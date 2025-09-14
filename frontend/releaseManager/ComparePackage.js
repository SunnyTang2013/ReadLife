import React, { useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import moment from 'moment';

import ErrorAlert from '../components/ErrorAlert';
import releaseService from '../backend/releaseService';
import ReleaseStatics from './components/ReleaseStatics';
import Alert from '../components/Alert';
import LoadingIndicator from '../components/LoadingIndicator';
import NewItemsReport from './components/NewItemsReport';
import UpdateItemsReport from './components/UpdateItemsReport';
import ReportConfigGroupItems from './components/ReportConfigGroupItems';
import ReportJobItems from './components/ReportJobItems';
import ReportContextItems from './components/ReportContextItems';
import ReportExecutionSystemItems from './components/ReportExecutionSystemItems';
import ReportHierarchy from './components/ReportHierarchy';
import ReportBatchItems from './components/ReportBatchItems';

function getItems() {
  return [
    { key: 'jobCompareReport', itemName: 'Job' },
    { key: 'jobContextCompareReport', itemName: 'Context' },
    { key: 'configGroupCompareReport', itemName: 'Configuration' },
    { key: 'executionSystemCompareReport', itemName: 'Execution System' },
    { key: 'hierarchyCompareReport', itemName: 'Hierarchy' },
    { key: 'batchCompareReport', itemName: 'Batch' },
  ];
}

const ComparePackage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const input = location.state;
  const item = input.item;
  const packageName = input.packageName;
  const packageInput = { releaseItems: item };

  const [data, setData] = useState(null);
  const [env, setEnv] = useState('-');
  const [loading, setLoading] = useState(false);
  const [viewReport, setViewReport] = useState(null);

  React.useEffect(() => {
    sessionStorage.setItem('refresh', 'false');
  }, []);

  const onChangeEnv = useCallback((event) => {
    const env = event.target.value;
    setEnv(env);
    if (env !== '-') {
      setViewReport(null);
      setLoading(true);
      
      if (packageName === 'releaseItem') {
        releaseService.compareVersionsFromCreate(env, packageInput)
          .then(data => {
            setData(data);
            setLoading(false);
          })
          .catch(error => {
            setData(error);
            setLoading(false);
          });
      } else {
        releaseService.compareVersionsFromUpdate(env, packageInput, packageName)
          .then(data => {
            setData(data);
            setLoading(false);
          })
          .catch(error => {
            setData(error);
            setLoading(false);
          });
      }
    }
  }, [packageInput, packageName]);

  function listDetail() {
    if (!viewReport) {
      return null;
    }

    let $compareLabel = null;
    if (viewReport) {
      const compareItem = getItems().find(item => item.key === viewReport);
      $compareLabel = React.createElement('div', { className: 'alert alert-primary my-2' },
        React.createElement('h5', null,
          <i className="fa fa-fw fa-exclamation-triangle mr-1" />,
          compareItem.itemName
        )
      );
    }

    const report = data[viewReport];
    let $releaseItems = null;
    switch (viewReport) {
      case 'jobCompareReport':
        $releaseItems = <ReportJobItems releaseItems={report.releaseItems} />;
        break;
      case 'configGroupCompareReport':
        $releaseItems = <ReportConfigGroupItems releaseItems={report.releaseItems} />;
        break;
      case 'jobContextCompareReport':
        $releaseItems = <ReportContextItems releaseItems={report.releaseItems} />;
        break;
      case 'executionSystemCompareReport':
        $releaseItems = <ReportExecutionSystemItems releaseItems={report.releaseItems} />;
        break;
      case 'hierarchyCompareReport':
        $releaseItems = <ReportHierarchy releaseItems={report.releaseItems} />;
        break;
      case 'batchCompareReport':
        $releaseItems = <ReportBatchItems releaseItems={report.releaseItems} />;
        break;
      default:
        break;
    }
    
    return <div>{$compareLabel,
      <NewItemsReport compareReport={report} />,
      <UpdateItemsReport compareReport={report} env={env} />,
      $releaseItems}</div>;
  }

  function listCompares() {
    if (loading) {
      return <LoadingIndicator />;
    }

    if (data === null) {
      return <Alert type="primary" text="Please choose environment to compare" />;
    }

    if (data instanceof Error) {
      return <ErrorAlert error={data} />;
    }

    const $reportRows = getItems().map(item => {
      const report = data[item.key];
      return React.createElement('tr', { className: 'font-weight-bolder', key: item.key },
        React.createElement('td', { className: 'border-top-0 pl-0 py-2' }, item.itemName),
        React.createElement('td', {
          className: `border-top-0 text-right ${report.updatedItems === 0 ? '' : 'text-danger'}`
        }, report.updatedItems),
        <td className="border-top-0 text-right">{report.addNewItems}</td>,
        <td className="border-top-0 text-right">{report.releaseItems.length}</td>,
        React.createElement('td', { className: 'border-top-0 text-right' },
          React.createElement('button', {
            type: 'button',
            className: 'btn btn-link',
            onClick: () => setViewReport(item.key)
          }, 'Details')
        )
      );
    });

    return React.createElement('div', null,
      React.createElement('div', { className: 'card overflow-hidden mb-3 mb-lg-3 shadow bg-white rounded' },
        React.createElement('div', { className: 'card-body p-0 bg-primary' },
          React.createElement('div', { className: 'row justify-content-center px-md-0 mb-3' },
            React.createElement('div', { className: 'col-md-9' },
              React.createElement('div', { className: 'd-flex justify-content-between flex-column flex-md-row mb-2' },
                React.createElement('h1', { className: 'display-6 text-white mt-3' }, 'Compare Report')
              ),
              React.createElement('div', { className: 'd-flex justify-content-between text-white' },
                React.createElement('div', { className: 'd-flex flex-column' },
                  React.createElement('span', { className: '' }, 'DATA'),
                  <span className="">{moment(}</span>.format('YYYY-MM-DD'))
                ),
                React.createElement('div', { className: 'd-flex flex-column' },
                  React.createElement('span', { className: 'font-weight-bolder mb-2' }, 'Current Version'),
                  <span>{packageName !== 'releaseItem' ? packageName : '-'}</span>
                ),
                React.createElement('div', { className: 'd-flex flex-column' },
                  React.createElement('span', { className: 'font-weight-bolder mb-2' }, 'Compare Environment'),
                  <span>{` ${env} `}</span>
                )
              )
            )
          )
        ),
        React.createElement('div', { className: 'card-body p-0' },
          React.createElement('div', { className: 'row justify-content-center px-md-0' },
            React.createElement('div', { className: 'col-md-9' },
              React.createElement('div', { className: 'table-responsive' },
                React.createElement('table', { className: 'table' },
                  React.createElement('thead', null,
                    React.createElement('tr', null,
                      React.createElement('th', { className: 'pl-0 font-weight-bold text-muted' }, 'Description'),
                      <th className="text-right font-weight-bold text-muted">Updated Item</th>,
                      <th className="text-right font-weight-bold text-muted">New Item</th>,
                      <th className="text-right pr-0 font-weight-bold text-muted">Amount</th>,
                      <th className="text-right pr-0 font-weight-bold text-muted" />
                    )
                  ),
                  <tbody>{...$reportRows}</tbody>
                )
              )
            )
          )
        )
      )
    );
  }

  const $comparesList = listCompares();
  const $reportDetail = listDetail();

  return React.createElement('div', { className: 'container-fluid', style: { maxWidth: '85%' } },
    React.createElement('nav', null,
      React.createElement('ol', { className: 'breadcrumb' },
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: '/list' }, 'Releases')
        ),
        <li className="breadcrumb-item active">Compare Items Between Package And Other Environment</li>
      )
    ),
    <h2 className="display-5">Compare Items Between Package And Other Environment</h2>,
    React.createElement('section', null,
      React.createElement('div', { className: 'form-group my-2' },
        React.createElement('button', {
          type: 'button',
          onClick: () => navigate(-1),
          className: 'btn btn-outline-primary'
        },
          <i className="fa fa-fw fa-arrow-left mr-1" />,
          'Return'
        )
      )
    ),
    React.createElement('section', null,
      React.createElement('table', { className: 'table table-striped table-fixed' },
        React.createElement('tbody', null,
          React.createElement('tr', null,
            React.createElement('th', { style: { width: '20%' } }, 'Compare To'),
            React.createElement('td', null,
              React.createElement('select', {
                id: 'select-type',
                className: 'form-control',
                onChange: onChangeEnv,
                value: env
              },
                React.createElement('option', { value: '-' }, '-- Choose Env --'),
                <option value={ReleaseStatics.ENV_PROD}>Production</option>,
                <option value={ReleaseStatics.ENV_PREPROD}>Pre production</option>,
                <option value={ReleaseStatics.ENV_PREPROD_BLACK}>Pre prod black</option>,
                <option value={ReleaseStatics.ENV_QTF}>QTF</option>,
                <option value={ReleaseStatics.ENV_UAT}>UAT</option>
              )
            )
          )
        )
      )
    ),
    $comparesList,
    $reportDetail
  );
};

export default ComparePackage;