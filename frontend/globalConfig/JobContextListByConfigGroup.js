import React, { useEffect, useState } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';

import queryString from 'query-string';

import configurations from '../backend/configurations';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';
import { withCurrentUser } from '../components/currentUser';
import JobContextList from './JobContextList';

const JobContextListByConfigGroup = ({ currentUser }) => {
  const { configGroupId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [configGroup, setConfigGroup] = useState(null);

  useEffect(() => {
    loadConfigGroup();
  }, [configGroupId]);

  function onUpdateQuery(query) {
    const url = `${location.pathname}?${queryString.stringify(query)}`;
    navigate(url);
  }

  function loadConfigGroup() {
    console.log(`Loading job config group info by ID: ${configGroupId}`);
    configurations.getJobConfigGroup(configGroupId)
      .then(configGroup => setConfigGroup(configGroup))
      .catch(error => setConfigGroup(error));
  }

  if (configGroup == null) {
    return <LoadingIndicator />;
  }
  if (configGroup instanceof Error) {
    return <ErrorAlert error={configGroup} />;
  }
  console.warn('rendering the page...');
  console.warn(configGroup);

  return React.createElement('div', null,
    React.createElement('nav', null,
      React.createElement('ol', { className: 'breadcrumb' },
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: '/' }, 'Job Context')
        ),
        <li className="breadcrumb-item active">{`Job Contexts using Config Group #${configGroup.id}`}</li>
      )
    ),
    <h2 className="display-4">{`Job Contexts using Config Group #${configGroup.id}`}</h2>,
    React.createElement('div', { className: 'mb-2' },
      React.createElement('span', { className: 'h4' }, configGroup.name)
    ),
    <JobContextList configGroupId={configGroupId} actionEnabled={currentUser.canWrite} search={location.search} location={location} history={{ push: navigate}>{onUpdateQuery: onUpdateQuery
    }}</JobContextList>
  );
};

export default JobContextListByConfigGroup;