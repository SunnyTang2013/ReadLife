import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import contextHistoryService from '../backend/globalConfigHistoryService';
import RemoteObject from '../utils/RemoteObject';

import Alert from '../components/Alert';
import LoadingIndicator from '../components/LoadingIndicator';
import JobConfigGroupsBlock from '../components/JobConfigGroupsBlock';
import { withCurrentUser } from '../components/currentUser';

const ContextHistoryDetail = () => {
  const { contextHistoryId } = useParams();
  const [contextHistoryDetail, setContextHistoryDetail] = useState(RemoteObject.notLoaded());

  useEffect(() => {
    loadContextHistory();
  }, []);

  function loadContextHistory() {
    console.log(`Loading job context #${contextHistoryId} ...`);
    contextHistoryService.getContextHistoryDetail(contextHistoryId)
      .then((contextHistoryDetail) => {
        setContextHistoryDetail(RemoteObject.loaded(contextHistoryDetail));
      })
      .catch((error) => {
        setContextHistoryDetail(RemoteObject.f
        ailed(error));
      });
  }

  if (contextHistoryDetail.isNotLoaded()) {
    return <LoadingIndicator />;
  }
  if (contextHistoryDetail.isFailed()) {
    return <Alert type="danger" text={contextHistoryDetail.error} />;
  }

  const jobContext = contextHistoryDetail.data.jobContextDetail;

  const updateInfo = [
    ['Release Version', contextHistoryDetail.data.releaseVersion],
    ['CR', contextHistoryDetail.data.cr],
    ['Updated By', contextHistoryDetail.data.updatedBy],
    ['Update Time', contextHistoryDetail.data.updateTime],
  ];

  const $updateInfoRows = updateInfo.map(([name, value]) => 
    React.createElement('tr', { key: `info-${name}` },
      React.createElement('th', { className: 'nowrap', style: { width: '30%' } }, name),
      <td>{value}</td>
    )
  );

  return React.createElement('div', null,
    React.createElement('nav', null,
      React.createElement('ol', { className: 'breadcrumb' },
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: '/' }, 'Global Configurations')
        ),
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: '/job-context/list' }, 'Job Contexts')
        ),
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: `/job-context/detail/${jobContext.id}` }, jobContext.name)
        ),
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: `/contextHistory/list/${contextHistoryDetail.data.contextId}/${jobContext.name}` },
            `History# ${jobContext.name}`
          )
        )
      )
    ),
    <h2 className="display-4">{jobContext.name}</h2>,
    React.createElement('section', null,
      React.createElement('h3', { className: 'display-6' }, 'Update Info'),
      <table className="table table-striped table-fixed">{<tbody>{...$updateInfoRows}</tbody>}</table>
    ),
    React.createElement('section', null,
      React.createElement('h3', { className: 'display-6' }, 'Information'),
      React.createElement('table', { className: 'table table-striped table-fixed my-0' },
        React.createElement('tbody', null,
          React.createElement('tr', null,
            React.createElement('th', { style: { width: '30%' } }, 'Execution System'),
            React.createElement('td', null,
              React.createElement(Link, { to: `/execution-system/detail/${jobContext.executionSystem.id}` },
                jobContext.executionSystem.name
              ),
              <span className="ml-2"> ( ',
                <code>{jobContext.executionSystem.baseUrl}</code>,
                </span>'
              )
            )
          ),
          React.createElement('tr', null,
            React.createElement('th', { style: { width: '30%' } }, 'Used in'),
            React.createElement('td', null,
              React.createElement('a', { href: `/frontend/jobs/job/list-by-context-group/${jobContext.id}` },
                `${jobContext.jobCount} jobs`
              )
            )
          )
        )
      )
    ),
    React.createElement('section', null,
      React.createElement('h3', { className: 'display-6' }, 'Configuration Groups'),
      <JobConfigGroupsBlock categoryType="technical" jobConfigGroups={jobContext.configGroups} />
    )
  );
};

export default ContextHistoryDetail;