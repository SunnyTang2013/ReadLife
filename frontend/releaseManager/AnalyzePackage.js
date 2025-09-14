import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sortCaseInsensitive } from '../utils/utilities';

import releaseService from '../backend/releaseService';
import Alert from '../components/Alert';
import LoadingIndicator from '../components/LoadingIndicator';
import ReleaseStatics from './components/ReleaseStatics';

function renderTip(typeTips, type) {
  if (!typeTips) {
    return <Alert type="success" text={`no ${type}`} />;
  }
  
  const $tips = sortCaseInsensitive(Object.keys(typeTips)).map((typeName) => {
    const tipList = typeTips[typeName];
    const $tipGroup = listTips(typeName, tipList, type);
    return <div key={`group-${typeName}`}>{$tipGroup}</div>;
  });

  if ($tips.length === 0) {
    return <Alert type="success" text={`no ${type}`} />;
  }

  return <div>{$tips}</div>;
}

function listTips(typeName, tipList, type) {
  const $icon = type === 'warn' 
    ? <i className="fa fa-fw fa-warning mr-1" />
    : <i className="fa fa-fw fa-stop-circle-o mr-1" />;

  const $rows = tipList.map(log => (
    <li className="list-group-item d-flex align-items-center" key={`${type}-${log}`}>
      {$icon}
      {log}
    </li>
  ));

  return (
    <div key={typeName} className="card my-2">
      <div className="card-header">
        <h6 className="mb-0">
          <a data-toggle="collapse" href={`#config-group-${type}-${typeName}`}>
            {typeName}
          </a>
        </h6>
      </div>
      <div id={`config-group-${type}-${typeName}`} className="collapse show">
        <ul className="list-group">{$rows}</ul>
      </div>
    </div>
  );
}

const AnalyzePackage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const input = location.state;
  const item = input.item;
  const packageName = input.packageName;
  const packageInput = { releaseItems: item };

  const [analysis, setAnalysis] = useState(null);
  const [env, setEnv] = useState('-');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    sessionStorage.setItem('refresh', 'false');
  }, []);

  const onChangeEnv = useCallback((event) => {
    const env = event.target.value;
    setEnv(env);
    
    if (env !== '-') {
      setLoading(true);
      
      if (packageName === 'releaseItem') {
        releaseService.analyzePackageFromCreate(env, packageInput)
          .then(analysis => {
            setAnalysis(analysis);
            setLoading(false);
          })
          .catch(error => {
            setAnalysis(error);
            setLoading(false);
          });
      } else {
        releaseService.analyzePackageFromUpdate(env, packageInput, packageName)
          .then(analysis => {
            setAnalysis(analysis);
            setLoading(false);
          })
          .catch(error => {
            setAnalysis(error);
            setLoading(false);
          });
      }
    }
  }, [packageInput, packageName]);

  let $tips = null;
  if (loading) {
    $tips = <LoadingIndicator />;
  } else if (analysis === null) {
    $tips = <Alert type="primary" text="Please choose environment to compare ..." />;
  } else if (analysis instanceof Error) {
    $tips = <Alert type="danger" text={String(analysis)} />;
  } else {
    $tips = React.createElement('div', null,
      React.createElement('section', null,
        React.createElement('h3', { className: 'display-6 alert alert-warning' },
          React.createElement('span', { className: 'mr-2' }, 'Warnings:')
        ),
        renderTip(analysis.warnings, 'warn')
      ),
      React.createElement('section', null,
        React.createElement('h3', { className: 'display-6 alert alert-danger' }, 'Errors:'),
        renderTip(analysis.errors, 'error')
      ),
      React.createElement('section', null,
        React.createElement('h3', { className: 'display-6 alert alert-danger' }, 'Infos:'),
        renderTip(analysis.infos, 'info')
      )
    );
  }

  return React.createElement('div', null,
    React.createElement('h2', { className: 'display-4' }, 'Analysis'),
    React.createElement('div', { className: 'form-group my-2' },
      React.createElement('button', {
        type: 'button',
        onClick: () => navigate(-1),
        className: 'btn btn-outline-primary'
      },
        <i className="fa fa-fw fa-arrow-left mr-1" />,
        'Return'
      )
    ),
    React.createElement('section', null,
      React.createElement('table', { className: 'table table-striped table-fixed' },
        React.createElement('tbody', null,
          React.createElement('tr', null,
            React.createElement('th', { style: { width: '20%' } }, 'Choose release environment'),
            React.createElement('td', null,
              React.createElement('select', {
                id: 'select-type',
                className: 'form-control',
                onChange: onChangeEnv,
                value: env
              },
                React.createElement('option', { value: '-' }, '-- Choose Env --'),
                <option value={ReleaseStatics.ENV_PROD}>production</option>,
                <option value={ReleaseStatics.ENV_PREPROD}>Pre production</option>
              )
            )
          )
        )
      )
    ),
    $tips
  );
};

export default AnalyzePackage;