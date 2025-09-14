import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';

import jobs from '../backend/jobs';
import monitoring from '../backend/monitoring';
import RemoteObject from '../utils/RemoteObject';
import { formatTime, formatDuration } from '../utils/utilities';

import Alert from '../components/Alert';
import LoadingIndicator from '../components/LoadingIndicator';
import RequestStatusBadge from '../components/RequestStatusBadge';
import { withCurrentUser } from '../components/currentUser';





function last24Hours(days) {
  let currentTime = new Date().getTime();
  currentTime -= currentTime % 1000;
  return new Date(currentTime - 24 * 60 * 60 * 1000 * days);
}

function getDefaultQuery(days) {
  let minTime = '';
  if (days > 0) {
    minTime = last24Hours(days).toISOString();
  }
  return {
    jobId,
    minCreateTime: minTime,
    maxCreateTime: new Date().toISOString(),
  };
}

const JobRequestListByJob = ({ currentUser }) => {
  const [job, setJob] = useState(RemoteObject.notLoaded());
  const [jobRequestList, setJobRequestList] = useState(RemoteObject.notLoaded());
  const [days, setDays] = useState(5);
  
  const { jobId } = useParams();

  const loadJob = useCallback(async () => {
    if (!jobId) return;
    
    console.log(`Loading Job #${jobId}...`);
    try {
      const data = await jobs.getJob(jobId);
      setJob(RemoteObject.loaded(data));
    } catch (error) {
      setJob(RemoteObject.failed(error));
    }
  }, [jobId]);

  const loadJobRequestListByJob = useCallback(async (daysParam) => {
    if (!jobId) return;
    
    console.log(`Loading job request list for job #${jobId}...`);
    const query = getDefaultQuery(daysParam);
    query.jobId = jobId;
    
    try {
      const data = await monitoring.getJobRequestListByJobAndDays(query);
      setJobRequestList(RemoteObject.loaded(data));
    } catch (error) {
      setJobRequestList(RemoteObject.failed(error));
    }
  }, [jobId]);

  useEffect(() => {
    loadJob();
    loadJobRequestListByJob(days);
  }, [loadJob, loadJobRequestListByJob, days]);

  const onChangeTimeRange = useCallback((event) => {
    const newDays = parseInt(event.target.value, 10);
    setDays(newDays);
    setJobRequestList(RemoteObject.notLoaded());
  }, []);

  const renderJobRequestList = useCallback(() => {
    if (jobRequestList.isNotLoaded()) {
      return null;
    }

    const jobRequestListData = jobRequestList.data || [];

    let totalCount = 0;
    let ongoingCount = 0;
    let successCount = 0;
    let failureCount = 0;

    const $timelineItems = jobRequestListData.map((jobRequest, index) => {
      totalCount += 1;

      let $timelineIcon = null;
      if (!jobRequest.status) {
        $timelineIcon = <i className="timeline-icon fa fa-fw fa-hourglass text-warning" />;
      } else if (jobRequest.status === 'ONGOING') {
        ongoingCount += 1;
        $timelineIcon = <i className="timeline-icon fa fa-fw fa-hourglass-half text-info" />;
      } else if (jobRequest.status === 'SUCCESS') {
        successCount += 1;
        $timelineIcon = <i className="timeline-icon fa fa-fw fa-check text-success" />;
      } else if (jobRequest.status === 'FAILURE') {
        failureCount += 1;
        $timelineIcon = <i className="timeline-icon fa fa-fw fa-times text-danger" />;
      } else {
        $timelineIcon = <i className="timeline-icon fa fa-fw fa-question text-warning" />;
      }

      let $latestBadge = null;
      if (index === 0) {
        $latestBadge = <span className="badge badge-purple">Latest</span>;
      }

      return (
        <li key={jobRequest.id}>
          {$timelineIcon}
          <div className="timeline-item">
            <div className="clearfix">
              <div className="float-right">
                <RequestStatusBadge status={jobRequest.status} />
              </div>
              <h5>
                <a 
                  className="mr-2"
                  data-toggle="collapse"
                  href={`#collapse-${jobRequest.id}`}
                >
                  {`Job Request #${jobRequest.id} @ ${formatTime(jobRequest.createTime)}`}
                </a>
                {$latestBadge}
              </h5>
            </div>
            <div 
              id={`collapse-${jobRequest.id}`}
              className={`collapse ${index === 0 ? 'show' : ''}`}
            >
              <ul className="mb-2">
                <li>
                  <span className="text-muted mr-2">Start / End Time:</span>
                  <span className="mr-1">{formatTime(jobRequest.startTime) || 'N/A'}</span>
                  <i className="fa fa-fw fa-long-arrow-right mr-1" />
                  <span className="mr-1">{formatTime(jobRequest.endTime) || 'N/A'}</span>
                  {`(${formatDuration(jobRequest.startTime, jobRequest.endTime) || 'N/A'})`}
                </li>
                <li>
                  <span className="text-muted mr-2">Job URI:</span>
                  <span className="text-code">{jobRequest.jobUri || 'N/A'}</span>
                </li>
                <li>
                  <span className="text-muted mr-2">Status:</span>
                  <span className="text-code mr-2">{jobRequest.status}</span>
                  <span className="text-muted">{`(Stage: ${jobRequest.stage})`}</span>
                </li>
              </ul>
              <div>
                <Link to={`/job-request/detail/${jobRequest.id}`}>View job request detail</Link>
              </div>
            </div>
          </div>
        </li>
      );
    });

    return (
      <div>
        <div className="d-flex justify-content-between">
          <div>
            Job request History for last:
            <select 
              className="pl-1"
              onChange={onChangeTimeRange}
              value={days.toString()}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="30">30</option>
              <option value="0">All</option>
            </select>
            days
          </div>
          <ul className="list-inline pr-1 mb-0">
            <li className="list-inline-item">
              Total: <strong>{totalCount}</strong>
            </li>
            <li className="list-inline-item text-info">
              Ongoing: <strong>{ongoingCount}</strong>
            </li>
            <li className="list-inline-item text-success">
              Success: <strong>{successCount}</strong>
            </li>
            <li className="list-inline-item text-danger">
              Failure: <strong>{failureCount}</strong>
            </li>
          </ul>
        </div>
        <ul className="timeline">{$timelineItems}</ul>
      </div>
    );
  }, [jobRequestList, onChangeTimeRange, days]);

  const renderJobInfo = useCallback(() => {
    if (job.isNotLoaded()) {
      return null;
    }

    const jobData = job.data;

    const $configGroupList = jobData.configGroups.map(configGroup => (
      <li key={`config-group-${configGroup.id}`}>
        <strong>{`${configGroup.category}:`}</strong>
        {` ${configGroup.name}`}
      </li>
    ));
    
    return (
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">About this Job:</h5>
          {jobData.description || 'No description'}
        </div>
        <ul className="list-group list-group-flush">
          <li className="list-group-item">
            <span className="text-muted">Owner:</span>
            {` ${jobData.owner}`}
          </li>
          <li className="list-group-item">
            <span className="text-muted">Priority:</span>
            {` ${jobData.priority}`}
          </li>
          <li className="list-group-item">
            <span className="text-muted">Context:</span>
            {` ${jobData.context.name}`}
          </li>
          <li className="list-group-item">
            <div className="text-muted">Configurations:</div>
            <ul className="list-unstyled mb-0">{$configGroupList}</ul>
          </li>
        </ul>
        <div className="card-body">
          <a 
            href={`/frontend/jobs/job/detail/${jobData.id}`}
            className="btn btn-primary"
          >
            View Job Details
          </a>
        </div>
      </div>
    );
  }, [job]);

  if (job.isNotLoaded() || jobRequestList.isNotLoaded()) {
    return <LoadingIndicator />;
  }
  if (job.isFailed()) {
    return <Alert type="danger" text={job.error} />;
  }
  if (jobRequestList.isFailed()) {
    return <Alert type="danger" text={jobRequestList.error} />;
  }

  const $jobRequestList = renderJobRequestList();
  const $jobInfo = renderJobInfo();

  return (
    <div>
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/">Monitoring</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/job-request/list">Job Requests</Link>
          </li>
          <li className="breadcrumb-item active">{`Job: ${job.data.name}`}</li>
        </ol>
      </nav>
      <h2 className="display-4">{job.data.name}</h2>
      <div className="row">
        <div className="col-8">{$jobRequestList}</div>
        <div className="col-4">
          <aside>{$jobInfo}</aside>
        </div>
      </div>
    </div>
  );
};

export default withCurrentUser(JobRequestListByJob);