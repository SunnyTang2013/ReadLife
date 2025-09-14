import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import globalConfig from '../backend/globalConfig';
import RemoteObject from '../utils/RemoteObject';
import Alert from '../components/Alert';
import LoadingIndicator from '../components/LoadingIndicator';
import { withCurrentUser } from '../components/currentUser';

function renderExecutionSystemList(executionSystemList) {
  if (!executionSystemList || executionSystemList.length === 0) {
    return <Alert type="danger" text="No available execution systems." />;
  }

  const $rows = executionSystemList.map(executionSystem => 
    React.createElement('tr', { key: executionSystem.id },
      React.createElement('td', null,
        React.createElement(Link, { to: `/execution-system/detail/${executionSystem.id}` }, executionSystem.name)
      ),
      <td>{executionSystem.type}</td>,
      React.createElement('td', null,
        React.createElement('a', { 
          href: `${executionSystem.baseUrl}/console`, 
          target: '_blank', 
          rel: 'noreferrer noopener' 
        },
          executionSystem.baseUrl,
          <i className="fa fa-fw fa-external-link ml-1" />
        )
      )
    )
  );

  return React.createElement('table', { className: 'table table-striped' },
    React.createElement('thead', null,
      React.createElement('tr', null,
        <th>Name</th>,
        <th>Type</th>,
        <th>Base URL</th>
      )
    ),
    <tbody>{...$rows}</tbody>
  );
}

const ExecutionSystemList = () => {
  const [executionSystemList, setExecutionSystemList] = useState(RemoteObject.notLoaded());

  useEffect(() => {
    loadExecutionSystemList();
  }, []);

  function loadExecutionSystemList() {
    console.log('Loading execution system list...');
    globalConfig.getExecutionSystemList()
      .then((executionSystemList) => {
        setExecutionSystemList(RemoteObject.loaded(executionSystemList));
      })
      .catch((error) => {
        setExecutionSystemList(RemoteObject.failed(error));
      });
  }

  if (executionSystemList.isNotLoaded()) {
    return <LoadingIndicator />;
  }
  if (executionSystemList.isFailed()) {
    return <Alert type="danger" text={executionSystemList.error} />;
  }

  const $executionSystemList = renderExecutionSystemList(executionSystemList.data);

  return React.createElement('div', null,
    React.createElement('nav', null,
      React.createElement('ol', { className: 'breadcrumb' },
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: '/' }, 'Global Configurations')
        ),
        <li className="breadcrumb-item active">Execution Systems</li>
      )
    ),
    <h2 className="display-4">Execution Systems</h2>,
    React.createElement('div', { className: 'text-right my-2' },
      React.createElement(Link, { to: '/execution-system/create', className: 'btn btn-primary btn-light-primary' },
        <i className="fa fa-fw fa-plus" />,
        ' Create a new Execution System'
      )
    ),
    $executionSystemList
  );
};

export default ExecutionSystemList;