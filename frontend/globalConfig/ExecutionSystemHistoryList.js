import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import globalConfigHistoryService from '../backend/globalConfigHistoryService';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';
import { withCurrentUser } from '../components/currentUser';

import Alert from '../components/Alert';
import { formatTime } from '../utils/utilities';

const ExecutionSystemHistoryList = () => {
  const { executionSystemId, executionSystemName } = useParams();
  const [historyList, setHistoryList] = useState(null);

  useEffect(() => {
    loadHistoryInfo();
  }, []);

  function loadHistoryInfo() {
    console.log(`Loading history info by ID: ${executionSystemId}`);
    console.log(`Loading history info by Name: ${executionSystemName}`);

    globalConfigHistoryService.listExecutionSystemHistory(executionSystemId)
      .then((historyList) => {
        setHistoryList(historyList);
      })
      .catch((error) => {
        setHistoryList(error);
      });
  }

  if (historyList === null) {
    return <LoadingIndicator />;
  }
  if (historyList instanceof Error) {
    return <ErrorAlert error={historyList} />;
  }

  const $historyRows = historyList.map(historyDetail => 
    React.createElement('tr', { key: `row-${historyDetail.id}` },
      React.createElement('td', null,
        React.createElement('td', { className: 'text-nowrap' },
          React.createElement(Link, { to: `/execution-system-history/detail/${historyDetail.id}` },
            formatTime(historyDetail.updateTime) || 'N/A'
          )
        )
      ),
      <td className="text-nowrap">{historyDetail.releaseVersion}</td>,
      <td className="text-nowrap">{historyDetail.cr}</td>,
      <td className="text-nowrap">{historyDetail.updatedBy}</td>
    )
  );

  let $historyListTable = null;
  if (historyList.length === 0) {
    $historyListTable = <Alert type="warning" text="No history found." />;
  } else {
    $historyListTable = React.createElement('table', { className: 'table table-striped mb-2' },
      React.createElement('thead', null,
        React.createElement('tr', null,
          React.createElement('th', { className: 'text-nowrap', style: { width: '5%' } }, 'Update Time'),
          React.createElement('th', { className: 'text-nowrap', style: { width: '5%' } }, 'Release Package Version'),
          React.createElement('th', { className: 'text-nowrap', style: { width: '5%' } }, 'CR'),
          React.createElement('th', { className: 'text-nowrap', style: { width: '5%' } }, 'Updated By')
        )
      ),
      <tbody>{...$historyRows}</tbody>
    );
  }

  return React.createElement('div', null,
    React.createElement('div', { className: 'mb-4' },
      React.createElement('nav', null,
        React.createElement('ol', { className: 'breadcrumb' },
          React.createElement('li', { className: 'breadcrumb-item' },
            React.createElement(Link, { to: '/' }, 'Global Configurations')
          ),
          React.createElement('li', { className: 'breadcrumb-item' },
            React.createElement(Link, { to: '/execution-system/list' }, 'Execution Systems')
          ),
          React.createElement('li', { className: 'breadcrumb-item' },
            React.createElement(Link, { to: `/execution-system/detail/${executionSystemId}` }, executionSystemName)
          ),
          <li className="breadcrumb-item active">{`Execution System History #${executionSystemId}`}</li>
        )
      ),
      <h2 className="display-4">{executionSystemName}</h2>
    ),
    <div>{$historyListTable}</div>
  );
};

export default ExecutionSystemHistoryList;