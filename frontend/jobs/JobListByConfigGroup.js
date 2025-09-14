import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';

import queryString from 'query-string';

import configurations from '../backend/configurations';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';
import { withCurrentUser } from '../components/currentUser';

import JobList from './components/JobList';

const JobListByConfigGroup = ({ currentUser }) => {
  const { configGroupId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [configGroup, setConfigGroup] = useState(null);

  useEffect(() => {
    loadConfigGroup();
  }, [configGroupId]);

  const onUpdateQuery = (query) => {
    const url = `${location.pathname}?${queryString.stringify(query)}`;
    navigate(url);
  };

  const onRunJobList = (jobIdArray) => {
    const jobListRunParams = { entries: { jobIds: jobIdArray } };
    const query = queryString.parse(location.search);
    jobListRunParams.entries.batchName = query.jobNameKeyword;
    navigate('/job/list-run', { state: { parameters: jobListRunParams } });
  };

  const loadConfigGroup = () => {
    console.log(`Loading job config group info by ID: ${configGroupId}`);
    configurations.getJobConfigGroup(configGroupId)
      .then(configGroup => setConfigGroup(configGroup))
      .catch(error => setConfigGroup(error));
  };

  if (configGroup === null) {
    return <LoadingIndicator />;
  }
  if (configGroup instanceof Error) {
    return <ErrorAlert error={configGroup} />;
  }

  return (
    <div>
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/">Jobs</Link>
          </li>
          <li className="breadcrumb-item active">{`Jobs using Config Group #${configGroup.id}`}</li>
        </ol>
      </nav>
      <h2 className="display-4">{`Jobs using Config Group #${configGroup.id}`}</h2>
      <div className="mb-2">{configGroup.name}</div>
      <JobList 
        configGroupId={configGroupId} 
        actionEnabled={currentUser.canWrite} 
        search={location.search} 
        onRunJobList={onRunJobList} 
        onUpdateQuery={onUpdateQuery} 
      />
    </div>
  );
};

export default withCurrentUser(JobListByConfigGroup);