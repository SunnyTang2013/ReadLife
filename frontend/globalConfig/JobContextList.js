import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import jobContextService from '../backend/jobContextService';
import RemoteObject from '../utils/RemoteObject';

import Alert from '../components/Alert';
import LoadingIndicator from '../components/LoadingIndicator';
import Paginator from '../components/Paginator';
import { withCurrentUser } from '../components/currentUser';

const JobContextList = ({ 
  configGroupId, 
  actionEnabled = true, 
  search = '', 
  location, 
  history, 
  onUpdateQuery,
  currentUser 
}) => {
  const navigate = useNavigate();
  const currentLocation = useLocation();
  const [jobContextPage, setJobContextPage] = useState(RemoteObject.notLoaded());

  useEffect(() => {
    loadJobContextList();
  }, [configGroupId, search]);

  function loadJobContextList() {
    console.log('Loading job context list...');
    const query = configGroupId ? { configGroupId } : {};
    
    jobContextService.getJobContextList(query)
      .then((jobContextList) => {
        setJobContextPage(RemoteObject.loaded({
          content: jobContextList,
          totalPages: 1,
          totalElements: jobContextList.length,
          number: 0,
          size: jobContextList.length
        }));
      })
      .catch((error) => {
        setJobContextPage(RemoteObject.failed(error));
      });
  }

  function renderJobContextList(jobContextList) {
    if (!jobContextList || jobContextList.length === 0) {
      return <Alert type="danger" text="No job contexts found." />;
    }

    const $rows = jobContextList.map(jobContext => 
      React.createElement('tr', { key: jobContext.id },
        React.createElement('td', null,
          React.createElement(Link, { to: `/job-context/detail/${jobContext.id}` }, jobContext.name)
        ),
        React.createElement('td', null,
          React.createElement(Link, { to: `/execution-system/detail/${jobContext.executionSystem.id}` },
            jobContext.executionSystem.name
          )
        ),
        <td>{jobContext.jobCount}</td>,
        actionEnabled && React.createElement('td', null,
          React.createElement('div', { className: 'btn-group btn-group-sm', role: 'group' },
            React.createElement(Link, { 
              to: `/job-context/update/${jobContext.id}`, 
              className: 'btn btn-primary btn-light-primary' 
            },
              <i className="fa fa-fw fa-pencil" />,
              ' Update'
            ),
            React.createElement(Link, { 
              to: `/job-context/copy/${jobContext.id}`, 
              className: 'btn btn-secondary' 
            },
              <i className="fa fa-fw fa-copy" />,
              ' Copy'
            )
          )
        )
      )
    );

    return React.createElement('table', { className: 'table table-striped' },
      React.createElement('thead', null,
        React.createElement('tr', null,
          <th>Name</th>,
          <th>Execution System</th>,
          <th>Job Count</th>,
          actionEnabled && <th>Actions</th>
        )
      ),
      <tbody>{....$rows}</tbody>
    );
  }

  if (jobContextPage.isNotLoaded()) {
    return <LoadingIndicator />;
  }
  if (jobContextPage.isFailed()) {
    return <Alert type="danger" text={jobContextPage.error} />;
  }

  const $jobContextList = renderJobContextList(jobContextPage.data.content);

  return React.createElement('div', null,
    !configGroupId && React.createElement('nav', null,
      React.createElement('ol', { className: 'breadcrumb' },
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: '/' }, 'Global Configurations')
        ),
        <li className="breadcrumb-item active">Job Contexts</li>
      )
    ),
    !configGroupId && <h2 className="display-4">Job Contexts</h2>,
    actionEnabled && React.createElement('div', { className: 'text-right my-2' },
      React.createElement(Link, { 
        to: '/job-context/create', 
        className: 'btn btn-primary btn-light-primary' 
      },
        <i className="fa fa-fw fa-plus" />,
        ' Create a new Job Context'
      )
    ),
    $jobContextList,
    <Paginator page={jobContextPage.data} onClickPage={(page) => onUpdateQuery && onUpdateQuery({ page} />
    })
  );
};

export default JobContextList;