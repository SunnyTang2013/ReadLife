import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { isEqual } from 'lodash';

import releaseService from '../backend/releaseService';
import loggingService from '../backend/logging';
import { formatTime } from '../utils/utilities';

import LoadingIndicatorNew from '../components/LoadingIndicatorNew';
import ErrorAlert from '../components/ErrorAlert';

const ReleaseDetail = () => {
  const [data, setData] = useState(null);
  
  const { releaseId } = useParams();

  useEffect(() => {
    loadData();
  }, [releaseId]);

  const loadData = () => {
    console.log(`Loading release #${releaseId} and its logs...`);
    const releasePromise = releaseService.getRelease(releaseId);
    const logsPromise = loggingService.getLogs('Release', releaseId);
    Promise.all([releasePromise, logsPromise])
      .then(([release, logs]) => setData({ release, logs }))
      .catch(error => setData(error));
  };

  if (data === null) {
    return <LoadingIndicatorNew />;
  }
  if (data instanceof Error) {
    return <ErrorAlert error={data} />;
  }

  const { release, logs } = data;

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
      React.createElement('span', { 
        className: `${severityClass} mr-2`, 
        style: { width: '5rem' } 
      }, logEntry.severity),
      <span className="text-muted text-code mr-2">{logEntry.time}</span>,
      React.createElement('span', { 
        className: `${messageClass} text-code` 
      }, logEntry.message)
    );
  });

  let $logs = null;
  if ($logEntryItems.length > 0) {
    $logs = <ul className="list-unstyled">{...$logEntryItems}</ul>;
  } else {
    $logs = <div className="alert alert-danger">{<i className="fa fa-fw fa-exclamation-triangle mr-1" />,
      'No logs for this release.'}</div>;
  }

  return React.createElement('div', null,
    React.createElement('nav', null,
      React.createElement('ol', { className: 'breadcrumb' },
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: '/list' }, 'Releases')
        ),
        <li className="breadcrumb-item active">{`#${release.id}: ${release.name}`}</li>
      )
    ),
    <h2 className="display-4">{<i className="fa fa-fw fa-cubes mr-2" />,
      `#${release.id}: ${release.name}`}</h2>,
    React.createElement('div', { className: 'alert alert-primary' },
      <i className="fa fa-fw fa-info-circle mr-1" />,
      'Released at ',
      React.createElement('strong', { className: 'mx-1' }, formatTime(release.releaseTime)),
      ' by ',
      <strong className="mx-1">{release.username}</strong>
    ),
    React.createElement('section', null,
      React.createElement('h3', { className: 'display-6' }, 'Package Version'),
      release.releaseVersion
    ),
    React.createElement('section', null,
      React.createElement('h3', { className: 'display-6' }, 'Logs'),
      $logs
    )
  );
};

export default ReleaseDetail;