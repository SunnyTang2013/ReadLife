import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';

import DatePicker from 'react-datepicker';
import releaseService from '../backend/releaseService';
import ErrorAlert from '../components/ErrorAlert';
import { formatTimeByFormatStr, sortCaseInsensitive } from '../utils/utilities';
import LoadingIndicator from '../components/LoadingIndicator';

function getCheckingRows(checkReleaseResults) {
  let $checkResults = null;
  if (checkReleaseResults) {
    const severityClass = 'badge badge-warning';
    const messageClass = 'text-warning';
    let $configRows = null;
    let $executionSystemRows = null;

    const configSensitiveList = checkReleaseResults.ConfigGroup;
    let noEmptySensitive = false;

    if (Object.keys(configSensitiveList).length > 0) {
      noEmptySensitive = true;
      const configNames = sortCaseInsensitive(Object.keys(configSensitiveList));
      $configRows = configNames.map((name) => {
        const parameters = configSensitiveList[name];
        const $parameterRows = getParametersRows(parameters);
        return React.createElement('div', { className: 'ml-5', key: `config-group-${name}` },
          <hr className="border-dashed border-bottom-0" />,
          <p className="card-text">{name}</p>,
          $parameterRows
        );
      });
    } else {
      $configRows = React.createElement('li', null,
        React.createElement('span', { className: 'badge badge-info mr-2', style: { width: '5rem' } }, 'INFO'),
        <span className="text-code">No warning results</span>
      );
    }

    const executionSystemSensitiveList = checkReleaseResults.ExecutionSystem;
    if (Object.keys(executionSystemSensitiveList).length > 0) {
      noEmptySensitive = true;
      const names = sortCaseInsensitive(Object.keys(executionSystemSensitiveList));
      $executionSystemRows = names.map((name) => {
        const executionSystemUri = executionSystemSensitiveList[name];
        return React.createElement('li', { key: `execution-system-${name}`, className: 'ml-5' },
          React.createElement('span', { className: `${severityClass} mr-2`, style: { width: '5rem' } }, 'WARN'),
          <span className="text-muted text-code mr-2">{name}</span>,
          React.createElement('span', { className: `${messageClass} text-code` }, executionSystemUri)
        );
      });
    } else {
      $executionSystemRows = React.createElement('li', null,
        React.createElement('span', { className: 'badge badge-info mr-2', style: { width: '5rem' } }, 'INFO'),
        <span className="text-code">No warning results</span>
      );
    }

    let $title = '';
    if (noEmptySensitive) {
      if (checkReleaseResults.env === 'PDN-CLUSTER') {
        $title = 'These are UAT settings ! - Are you sure you want to deploy on Production ?';
      } else {
        $title = 'These are Production settings ! - Are you sure you want to deploy on UAT ? - UAT jobs should not target PROD';
      }
    } else {
      $title = 'No sensitive found, feel free to release.';
    }

    $checkResults = React.createElement('div', { className: 'ml-1 mt-2' },
      React.createElement('h3', { className: `${messageClass} text-code display-11` }, $title),
      React.createElement('section', null,
        React.createElement('h3', { className: 'display-11' }, 'Config Group'),
        $configRows
      ),
      React.createElement('section', null,
        React.createElement('h3', { className: 'display-11' }, 'Execution System'),
        $executionSystemRows
      )
    );
  }

  return $checkResults;
}

function getParametersRows(parameters) {
  if (!parameters) {
    return null;
  }

  const severityClass = 'badge badge-warning';
  const messageClass = 'text-warning';
  const parameterNames = sortCaseInsensitive(Object.keys(parameters));

  return parameterNames.map((parameterName) => {
    const value = parameters[parameterName];
    return React.createElement('div', { key: `parameter-${parameterName}` },
      React.createElement('li', null,
        React.createElement('span', { className: `${severityClass} mr-2`, style: { width: '5rem' } }, 'WARN'),
        <span className="text-muted text-code mr-2">{parameterName}</span>,
        React.createElement('span', { className: `${messageClass} text-code` }, value)
      )
    );
  });
}

const ReleasePackage = () => {
  const [releaseName, setReleaseName] = useState('');
  const [crNumber, setCrNumber] = useState('');
  const [instruction, setInstruction] = useState('Please select package create date first.');
  const [createDate, setCreateDate] = useState(null);
  const [isWorking, setIsWorking] = useState(true);
  const [releasing, setReleasing] = useState(false);
  const [error, setError] = useState(null);
  const [packageList, setPackageList] = useState([]);
  const [successPackages, setSuccessPackages] = useState([]);
  const [checkReleaseResults, setCheckReleaseResults] = useState(null);

  const onChangeReleaseName = useCallback((event) => {
    const releaseName = event.target.value;
    setReleaseName(releaseName);
    setCheckReleaseResults(null);
  }, []);

  const loadReleasePackages = useCallback(() => {
    if (!createDate) {
      setInstruction('Please select package create date first.');
      setIsWorking(true);
      return;
    }
    setIsWorking(true);
    setError(null);
    
    const createDateStr = formatTimeByFormatStr(createDate.toISOString(), 'YYYYMMDD');
    releaseService.listPackage(createDateStr).then((result) => {
      if (result.status === 'SUCCESS') {
        setPackageList(result.data.packageList);
        setInstruction('-----');
        setIsWorking(false);
      } else {
        setIsWorking(false);
        setInstruction('-----');
        setError('Fail to get package list !');
      }
    }).catch((error) => {
      setIsWorking(false);
      setInstruction('-----');
      setError(error);
    });
  }, [createDate]);

  const onChangeDate = useCallback((date) => {
    setCreateDate(date);
    setInstruction('Loading ...');
    setReleaseName('');
    setCheckReleaseResults(null);
    // loadReleasePackages will be called via useEffect
  }, []);

  const onChangeCRNumber = useCallback((event) => {
    const crNumber = event.target.value;
    setCrNumber(crNumber);
  }, []);

  const onCheckPackage = useCallback(() => {
    setIsWorking(true);
    setError(null);
    setReleasing(true);
    
    releaseService.checkPackageSensitive(releaseName)
      .then((result) => {
        setIsWorking(false);
        setReleasing(false);
        setCheckReleaseResults(result);
      })
      .catch((error) => {
        setIsWorking(false);
        setReleasing(false);
        setError(error);
      });
  }, [releaseName]);

  const onReleasePackage = useCallback(() => {
    setIsWorking(true);
    setError(null);
    setReleasing(true);
    
    releaseService.releasePackage(releaseName, crNumber)
      .then((result) => {
        if (result.status === 'SUCCESS') {
          setIsWorking(false);
          setReleasing(false);
          setSuccessPackages(prev => [...prev, result]);
        } else if (result.status === 'ERROR' && result.data.releaseInfo) {
          setIsWorking(false);
          setReleasing(false);
          setError(`${result.data.releaseInfo}`);
        } else {
          setIsWorking(false);
          setReleasing(false);
          setError(`Release package ${releaseName} fail !`);
        }
      })
      .catch((error) => {
        setIsWorking(false);
        setReleasing(false);
        setError(error);
      });
  }, [releaseName, crNumber]);

  // Load packages when createDate changes
  React.useEffect(() => {
    if (createDate) {
      loadReleasePackages();
    }
  }, [createDate, loadReleasePackages]);

  const $successItems = successPackages.map((item) => {
    const releaseResult = item;
    if (releaseResult.data && releaseResult.data.releaseInfo) {
      let warning = null;
      if (releaseResult.data.updateLogs) {
        warning = releaseResult.data.updateLogs.map((logs) => 
          <div key={logs.id}>{<i className="fa fa-fw fa-warning mr-1" />,
            logs.message}</div>
        );
      }

      const alertStyle = warning ? 'alert-warning' : 'alert-success';
      return React.createElement('div', { className: `alert ${alertStyle} my-2`, key: releaseResult.data.releaseInfo.id },
        React.createElement('div', null,
          <i className="fa fa-fw fa-check-circle-o mr-1" />,
          releaseResult.data.releaseInfo.releaseVersion,
          React.createElement(Link, { to: `/detail/${releaseResult.data.releaseInfo.id}`, className: 'mr-2', target: '_blank' },
            <strong> Logs</strong>
          )
        ),
        <div>{warning}</div>
      );
    }
    return null;
  });

  const $packageOptions = packageList.map(packageName => 
    <option key={packageName} value={packageName}>{packageName}</option>
  );

  let disableRelease = true;
  if (releaseName.length > 0) {
    disableRelease = false;
  }

  let $checkResults = null;
  const $sensitiveRows = getCheckingRows(checkReleaseResults);
  if ($sensitiveRows) {
    disableRelease = true;
    $checkResults = React.createElement('div', null,
      $sensitiveRows,
      React.createElement('div', { className: 'col-4 card-body' },
        React.createElement('button', {
          className: 'btn btn-primary mr-2',
          type: 'button',
          onClick: onReleasePackage,
          disabled: releasing
        }, 'Confirm To Release')
      )
    );
  }

  return React.createElement('div', null,
    React.createElement('nav', null,
      React.createElement('ol', { className: 'breadcrumb' },
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: '/list' }, 'Releases')
        ),
        <li className="breadcrumb-item active">Release Package</li>
      )
    ),
    <h2 className="display-4">Release A Package</h2>,
    <p>In ', <strong> UAT/Pre-Production</strong>, ' you could leave CR number empty.</p>,
    <ErrorAlert error={error} />,
    React.createElement('section', null,
      React.createElement('div', { className: 'row' },
        React.createElement('div', { className: 'col-1' },
          <DatePicker selected={createDate} onChange={onChangeDate} className="form-control" dateFormat="yyyyMMdd" peekNextMonth showMonthDropdown showYearDropdown placeholderText="Select create date ..." disabled={releasing} />
        ),
        React.createElement('div', { className: 'col-4' },
          React.createElement('select', {
            id: 'selectReleasePackage',
            className: 'form-control',
            value: releaseName,
            onChange: onChangeReleaseName,
            disabled: isWorking
          },
            React.createElement('option', { value: '' }, instruction),
            ...$packageOptions
          )
        ),
        <div className="col-2">{<input id="change-request-no" className="form-control" value={crNumber} placeholder="Please add CR number" onChange={onChangeCRNumber} />}</div>,
        React.createElement('div', { className: 'col-1' },
          React.createElement('button', {
            className: 'btn btn-primary mr-2',
            type: 'button',
            onClick: onCheckPackage,
            disabled: disableRelease
          }, 'Release')
        ),
        React.createElement('div', { className: 'col-2' },
          React.createElement(Link, { to: '/create-package', className: 'btn btn-outline-primary' },
            'Go To Create Package'
          )
        )
      )
    ),
    $successItems,
    $checkResults,
    <div hidden={!releasing}>{<LoadingIndicator text="Releasing ..." />}</div>
  );
};

export default ReleasePackage;