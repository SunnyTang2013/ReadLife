import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import queryString from 'query-string';

import jobs from '../backend/jobs';
import RouterPropTypes from '../proptypes/router';

import { withCurrentUser } from '../components/currentUser';
import JobList from './components/JobList';

const Welcome = () => {
  const [jobCount, setJobCount] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    _countJobs();
  }, []);

  const onUpdateQuery = (query) => {
    const url = `${location.pathname}?${queryString.stringify(query)}`;
    navigate(url);
  };

  const onCustomizedRun = (url) => {
    navigate(url);
  };

  const onRunJobList = (jobIdArray) => {
    const jobListRunParams = { entries: { jobIds: jobIdArray } };
    const query = queryString.parse(location.search);
    jobListRunParams.entries.batchName = query.jobNameKeyword;
    navigate('/job/list-run', { state: { parameters: jobListRunParams } });
  };

  const _countJobs = () => {
    jobs.countJobs()
      .then((data) => {
        setJobCount(data.count);
      })
      .catch((error) => {
        console.log(`Fail to count jobs: ${error}`);
      });
  };

  return (
    <div>
      <h2 className="display-4">Jobs</h2>
      <div className="d-flex justify-content-between mb-2">
        <div className="btn-toolbar" role="toolbar">
          <div className="btn-group btn-group-sm mr-2" role="group">
            {jobCount > 0 && (
              <div className="text-muted mb-2">
                Total <strong>{jobCount}</strong> jobs.
              </div>
            )}
          </div>
        </div>
      </div>
      <JobList 
        search={location.search} 
        onUpdateQuery={onUpdateQuery} 
        onCustomizedRun={onCustomizedRun} 
        onRunJobList={onRunJobList} 
      />
    </div>
  );
};

export default withCurrentUser(Welcome);