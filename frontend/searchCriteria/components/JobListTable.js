import React from 'react';
import PropTypes from 'prop-types';

import ScorchPropTypes from '../../proptypes/scorch';


/**
 * This component renders a table showing a list of job config groups.
 */
export default function JobListTable({ jobList }) {
  const $rows = jobList.map(job => (
    <tr key={job.id}>
      <td>
        <a href={`/frontend/jobs/job/detail/${job.id}`} target="_blank" rel="noopener noreferrer">
          {job.name}
        </a>
      </td>
      <td>
        {job.location}
      </td>
    </tr>
  ));

  return (
    <table className="table table-striped">
      <thead>
        <tr>
          <th>Name</th>
          <th>Location</th>
        </tr>
      </thead>
      <tbody>
        {$rows}
      </tbody>
    </table>
  );
}


JobListTable.propTypes = {
  jobList: PropTypes.arrayOf(ScorchPropTypes.jobPlainInfo()).isRequired,
};
