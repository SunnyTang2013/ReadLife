import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

import queryString from 'query-string';

import { loadJobListByJobGroupOptions } from './utils';

/**
 * This component takes the job list page options for this job group from browser session storage,
 * and redirects to the job list page with those options.
 */
const JobListByJobGroupRedirect = () => {
  const { jobGroupId } = useParams();
  const options = loadJobListByJobGroupOptions(jobGroupId, {});
  const query = queryString.stringify(options);
  return <Navigate to={`/job/list/${jobGroupId}?${query}`} />;
};

export default JobListByJobGroupRedirect;