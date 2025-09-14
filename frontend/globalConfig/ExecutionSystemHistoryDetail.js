import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import globalConfigHistoryService from '../backend/globalConfigHistoryService';
import RemoteObject from '../utils/RemoteObject';

import Alert from '../components/Alert';
import LoadingIndicator from '../components/LoadingIndicator';
import { withCurrentUser } from '../components/currentUser';

const ExecutionSystemHistoryDetail = () => {
  const { historyId } = useParams();
  const [historyDetail, setHistoryDetail] = useState(RemoteObject.notLoaded());

  useEffect(() => {
    queryHistoryDetail();
  }, []);

  function queryHistoryDetail() {
    console.log(`Querying detail of execution system #${historyId} ...`);
    globalConfigHistoryService.getExecutionSystemHistoryDetail(historyId)
      .then((vsDetail) => {
        setHistoryDetail(RemoteObject.loaded(vsDetail));
      })
      .catch((error) => {
        setHistoryDetail(RemoteObject.failed(error));
      });
  }

  if (historyDetail.isNotLoaded()) {
    return <LoadingIndicator />;
  }
  if (historyDetail.isFailed()) {
    return <Alert type="danger" text={historyDetail.error} />;
  }

  const {
    executionSystem, serviceStatus, deployedLibraries,
  } = historyDetail.data.executionSystemDetail;

  const updateInfo = [
    ['Release Version', historyDetail.data.releaseVersion],
    ['CR', historyDetail.data.cr],
    ['Updated By', historyDetail.data.updatedBy],
    ['Update Time', historyDetail.data.updateTime],
  ];

  const $updateInfoRows = updateInfo.map(([name, value]) => 
    React.createElement('tr', { key: `info-${name}` },
      React.createElement('th', { className: 'nowrap', style: { width: '30%' } }, name),
      <td>{value}</td>
    )
  );

  const serviceStatusTypes = {
    OKAY: 'success',
    SUBSYSTEM_FAILURE: 'danger',
    UNAVAILABLE: 'danger',
    UNKNOWN: 'warning',
  };
  const serviceStatusType = serviceStatusTypes[serviceStatus.toLocaleUpperCase()] || 'warning';
  const $serviceStatus = React.createElement('span', { className: `badge badge-${serviceStatusType} badge-outline` },
    <i className="fa fa-fw fa-circle" />,
    serviceStatus
  );

  let $deployedLibraries = '';
  if (deployedLibraries) {
    $deployedLibraries = deployedLibraries.map((library) => {
      const $versions = library.versions.map(version => 
        React.createElement('li', { key: `${library.name}-${version}`, className: 'list-inline-item badge badge-secondary' },
          version
        )
      );
      return React.createElement('div', { key: library.name, className: 'my-2' },
        React.createElement('h4', { className: 'lighter' },
          <i className="fa fa-fw fa-cube" />,
          library.name
        ),
        <ul className="list-inline">{...$versions}</ul>
      );
    });
  }

  return React.createElement('div', null,
    React.createElement('nav', null,
      React.createElement('ol', { className: 'breadcrumb' },
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: '/' }, 'Global Configurations')
        ),
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: '/execution-system/list' }, 'Execution Systems')
        ),
        <li className="breadcrumb-item active">{executionSystem.name}</li>
      )
    ),
    <h2 className="display-4">{executionSystem.name}</h2>,
    React.createElement('section', null,
      React.createElement('h3', { className: 'display-6' }, 'Update Info'),
      <table className="table table-striped table-fixed">{<tbody>{...$updateInfoRows}</tbody>}</table>
    ),
    React.createElement('section', null,
      React.createElement('h3', { className: 'display-6' }, `Execution System: ${executionSystem.name}`),
      React.createElement('ul', null,
        React.createElement('li', null,
          React.createElement('span', { className: 'mr-2' }, 'Base URL:'),
          React.createElement('a', { 
            className: 'mr-2', 
            href: `${executionSystem.baseUrl}/console`, 
            target: '_blank', 
            rel: 'noreferrer noopener' 
          },
            executionSystem.baseUrl,
            <i className="fa fa-fw fa-external-link ml-1" />
          ),
          $serviceStatus
        ),
        React.createElement('li', null,
          React.createElement('span', { className: 'mr-2' }, 'Max Running Jobs Limitation:'),
          executionSystem.maxRunning
        )
      )
    ),
    React.createElement('section', null,
      React.createElement('h3', { className: 'display-6' }, 'Deployed Libraries'),
      $deployedLibraries
    )
  );
};

export default ExecutionSystemHistoryDetail;