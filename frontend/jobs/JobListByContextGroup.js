import React, { useState, useEffect } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import queryString from 'query-string';

import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';
import { withCurrentUser } from '../components/currentUser';

import JobList from './components/JobList';
import jobContextService from '../backend/jobContextService';

const JobListByContextGroup = ({ currentUser }) => {
  const { jobContextId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [contextGroup, setContextGroup] = useState(null);

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

  const loadContextGroup = () => {
    console.log(`Loading job context group info by ID: ${jobContextId}`);
    jobContextService.getJobContext(jobContextId)
      .then(contextGroup => setContextGroup(contextGroup))
      .catch(error => setContextGroup(error));
  };

  useEffect(() => {
    loadContextGroup();
  }, [jobContextId]);

  if (contextGroup === null) {
    return <LoadingIndicator />;
  }
  if (contextGroup instanceof Error) {
    return <ErrorAlert error={contextGroup} />;
  }

  return (
    <div>
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/">Jobs</Link>
          </li>
          <li className="breadcrumb-item active">{`Jobs using Context Group #${contextGroup.id}`}</li>
        </ol>
      </nav>
      <h2 className="display-4">{`Jobs using Context Group #${contextGroup.id}`}</h2>
      <div className="mb-2">{contextGroup.name}</div>
      <JobList 
        jobContextId={jobContextId} 
        actionEnabled={currentUser.canWrite} 
        search={location.search} 
        onRunJobList={onRunJobList} 
        onUpdateQuery={onUpdateQuery} 
      />
    </div>
  );
};

export default withCurrentUser(JobListByContextGroup);