import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

import jobHistoryService from '../backend/jobHistoryService';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';
import { withCurrentUser } from '../components/currentUser';

import Alert from '../components/Alert';
import { formatTime } from '../utils/utilities';

const JobHistoryList = () => {
  const { jobId, jobName } = useParams();
  const [jobHistoryList, setJobHistoryList] = useState(null);

  useEffect(() => {
    loadJobHistoryInfo();
  }, [jobId, jobName]);

  const loadJobHistoryInfo = () => {
    console.log(`Loading job history info by ID: ${jobId}`);
    console.log(`Loading job history info by Name: ${jobName}`);

    jobHistoryService.listJobHistory(jobId, jobName).then((jobHistoryList) => {
      setJobHistoryList(jobHistoryList);
    })
      .catch((error) => {
        setJobHistoryList(error);
      });
  };

  if (jobHistoryList === null) {
    return <LoadingIndicator />;
  }
  if (jobHistoryList instanceof Error) {
    return <ErrorAlert error={jobHistoryList} />;
  }

  const $historyRows = jobHistoryList.map(jobHistory => (
    <tr key={`row-${jobHistory.id}`}>
      <td className="text-nowrap">
        <Link to={`/jobHistory/detail/${jobHistory.id}`}>
          {formatTime(jobHistory.updateTime) || 'N/A'}
        </Link>
      </td>
      <td className="text-nowrap">{jobHistory.releaseVersion}</td>
      <td className="text-nowrap">{jobHistory.cr}</td>
      <td className="text-nowrap">{jobHistory.updatedBy}</td>
    </tr>
  ));

  let $jobHistoryListTable = null;
  if (jobHistoryList.length === 0) {
    $jobHistoryListTable = <Alert type={"warning"} text={"No history found."} />;
  } else {
    $jobHistoryListTable = (
      <table className="table table-striped mb-2">
        <thead>
          <tr>
            <th className="text-nowrap" style={{ width: '5%' }}>Update Time</th>
            <th className="text-nowrap" style={{ width: '5%' }}>Release Package Version</th>
            <th className="text-nowrap" style={{ width: '5%' }}>CR</th>
            <th className="text-nowrap" style={{ width: '5%' }}>Updated By</th>
          </tr>
        </thead>
        <tbody>{$historyRows}</tbody>
      </table>
    );
  }

  return (
    <div>
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to={`/job/detail/${jobId}`}>{`Job #${jobName}`}</Link>
          </li>
          <li className="breadcrumb-item active">Job History</li>
        </ol>
      </nav>
      <div className="mb-4">
        <nav>
          <ol className="breadcrumb">
            <li className="breadcrumb-item active">{`Job History #${jobId}`}</li>
          </ol>
        </nav>
        <h2 className="display-4">{jobName}</h2>
      </div>
      <div>{$jobHistoryListTable}</div>
    </div>
  );
};

export default withCurrentUser(JobHistoryList);