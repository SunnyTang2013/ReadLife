import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';

import DatePicker from 'react-datepicker';
import releaseService from '../backend/releaseService';
import ErrorAlert from '../components/ErrorAlert';
import Alert from '../components/Alert';
import { formatTimeByFormatStr } from '../utils/utilities';
import LoadingIndicator from '../components/LoadingIndicator';

const RollbackPackage = () => {
  const [releaseName, setReleaseName] = useState('');
  const [instruction, setInstruction] = useState('Please select package create date first.');
  const [createDate, setCreateDate] = useState(null);
  const [isWorking, setIsWorking] = useState(true);
  const [rollingBack, setRollingBack] = useState(false);
  const [error, setError] = useState(null);
  const [packageList, setPackageList] = useState([]);
  const [successPackages, setSuccessPackages] = useState([]);
  const [logs, setLogs] = useState(null);

  const onChangeReleaseName = useCallback((event) => {
    const releaseName = event.target.value;
    setReleaseName(releaseName);
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
  }, []);

  const onRollbackPackage = useCallback(() => {
    setIsWorking(true);
    setError(null);
    setRollingBack(true);
    setLogs(null);
    
    releaseService.rollbackPackage(releaseName)
      .then((result) => {
        if (result.status === 'SUCCESS') {
          setIsWorking(false);
          setRollingBack(false);
          setSuccessPackages(prev => [...prev, releaseName]);
          setLogs(result.data.logEntryList);
        } else {
          setIsWorking(false);
          setRollingBack(false);
          setError(`Rollback package ${releaseName} fail !`);
          setLogs(result.data.logEntryList);
        }
      })
      .catch((error) => {
        setIsWorking(false);
        setRollingBack(false);
        setError(error);
        setLogs(null);
      });
  }, [releaseName]);

  useEffect(() => {
    if (createDate) {
      loadReleasePackages();
    }
  }, [createDate, loadReleasePackages]);

  const $logEntryItems = (logs || []).map((logEntry) => {
    let severityClass = '';
    let messageClass = '';
    switch (logEntry.severity) {
      case 'INFO':
        severityClass = 'badge badge-info';
        break;
      case 'WARNING':
        severityClass = 'badge badge-warning';
        messageClass = 'text-warning';
        break;
      case 'ERROR':
        severityClass = 'badge badge-danger';
        messageClass = 'text-danger';
        break;
      default:
        severityClass = 'badge badge-secondary';
        break;
    }
    return React.createElement('li', { key: logEntry.id },
      React.createElement('span', { className: `${severityClass} mr-2`, style: { width: '5rem' } }, logEntry.severity),
      <span className="text-muted text-code mr-2">{logEntry.time}</span>,
      React.createElement('span', { className: `${messageClass} text-code` }, logEntry.message)
    );
  });

  let $logs = null;
  if ($logEntryItems.length > 0) {
    $logs = <ul className="list-unstyled">{...$logEntryItems}</ul>;
  } else {
    const message = rollingBack ? 'Rolling back ... ' : 'None';
    $logs = <Alert type="primary" text={message} key="waiting rollback" />;
  }

  const $successItems = successPackages.map(item => 
    React.createElement(Alert, { type: 'success', text: item, key: `success-${item}` })
  );

  const $packageOptions = packageList.map(packageName => 
    <option key={packageName} value={packageName}>{packageName}</option>
  );

  let disableRelease = true;
  if (releaseName.length > 0) {
    disableRelease = false;
  }

  return React.createElement('div', null,
    React.createElement('nav', null,
      React.createElement('ol', { className: 'breadcrumb' },
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: '/list' }, 'Releases')
        ),
        <li className="breadcrumb-item active">Rollback Package</li>
      )
    ),
    <h2 className="display-4">Rollback A Package</h2>,
    <ErrorAlert error={error} />,
    React.createElement('section', null,
      React.createElement('div', { className: 'row' },
        React.createElement('div', { className: 'col-2' },
          <DatePicker selected={createDate} onChange={onChangeDate} className="form-control" dateFormat="yyyyMMdd" peekNextMonth showMonthDropdown showYearDropdown placeholderText="Select create date ..." disabled={rollingBack} />
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
        React.createElement('div', { className: 'col-1' },
          React.createElement('button', {
            className: 'btn btn-primary mr-2',
            type: 'button',
            onClick: onRollbackPackage,
            disabled: disableRelease
          }, 'Rollback')
        )
      )
    ),
    $successItems,
    <section hidden={!rollingBack}>{<LoadingIndicator text="Rolling ..." />}</section>,
    React.createElement('section', null,
      React.createElement('h3', { className: 'display-6' }, 'Logs'),
      $logs
    )
  );
};

export default RollbackPackage;