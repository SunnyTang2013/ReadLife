import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';

import queryString from 'query-string';

import jobGroupService from '../backend/jobGroupService';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';
import { withCurrentUser } from '../components/currentUser';

import JobList from './components/JobList';

import { saveJobListByJobGroupOptions } from './utils';
import ScheduleCreateFromJobs from '../schedule/ScheduleCreateFromModal';


const JobListByJobGroup = ({ currentUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  
  const [jobGroup, setJobGroup] = useState(null);
  const [jobGroupId, setJobGroupId] = useState(params.jobGroupId);

  const jobGroupName = params.jobGroupName;

  useEffect(() => {
    setJobGroupId(params.jobGroupId);
    _loadJobGroupInfo();
  }, [params.jobGroupId, params.jobGroupName]);

  const onUpdateQuery = (query) => {
    // Before jumping to URL, save the job list query for this job group.
    saveJobListByJobGroupOptions(jobGroupId, query);
    const url = `${location.pathname}?${queryString.stringify(query)}`;
    navigate(url);
  };

  const onRunJobList = (jobIdArray) => {
    const jobListRunParams = { entries: { jobIds: jobIdArray } };
    const query = queryString.parse(location.search);
    jobListRunParams.entries.batchName = query.jobNameKeyword;
    navigate('/job/list-run', { state: { parameters: jobListRunParams } });
  };

  const _loadJobGroupInfo = () => {
    console.log(`Loading job group info by ID: ${params.jobGroupId}`);
    console.log(`Loading job group info by Name: ${jobGroupName}`);

    if (params.jobGroupId) {
      jobGroupService.getJobGroup(params.jobGroupId).then((jobGroup) => {
        setJobGroup(jobGroup);
      })
        .catch((error) => {
          setJobGroup(error);
        });
    } else {
      jobGroupService.getJobGroupByName(jobGroupName).then((jobGroup) => {
        setJobGroup(jobGroup);
        setJobGroupId(jobGroup.id);
      })
        .catch((error) => {
          setJobGroup(error);
        });
    }
  };

  const _renderHeader = () => {
    const canWrite = currentUser.canWrite;
    const canExecute = currentUser.canExecute;

    return (
      <div className="mb-4">
        <nav>
          <ol className="breadcrumb">
            <li className="breadcrumb-item active">{`Job Group #${jobGroup.id}`}</li>
          </ol>
        </nav>
        <h2 className="display-4">{jobGroup.name}</h2>
        <div className="d-flex justify-content-between">
          <div className="btn-toolbar" role="toolbar">
            <div className="btn-group btn-group-sm mr-2" role="group">
              {canWrite && (
                <Link
                  to={`/job/create/${jobGroup.id}`}
                  className="btn btn-primary btn-light-primary"
                >
                  <i className="fa fa-fw fa-plus" />
                  {' Add'}
                </Link>
              )}
              {canExecute && (
                <Link
                  to={`/job-group/run/${jobGroup.id}`}
                  className="btn btn-primary btn-light-primary"
                  title="Run All Jobs in this job group"
                >
                  <i className="fa fa-fw fa-play" />
                  {' Run all jobs'}
                </Link>
              )}
            </div>
          </div>
          <div className="btn-toolbar" role="toolbar">
            <div className="btn-group btn-group-sm" role="group">
              <Link
                to={`/job-group/settings/${jobGroup.id}`}
                className="btn btn-primary btn-light-primary"
              >
                <i className="fa fa-fw fa-cog" />
                {' Settings'}
              </Link>
              <a className="btn btn-sm btn-primary btn-light-primary" href="/frontend/releases/create-package">
                <i className="fa fa-fw fa-cube" />
                {' Release'}
              </a>
              <a href="#myModal" className="btn btn-sm btn-primary btn-light-primary" data-toggle="modal" data-target="#myModal">
                <i className="fa fa-fw fa-clock-o" />
                Schedule
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (jobGroup === null) {
    return <LoadingIndicator />;
  }
  if (jobGroup instanceof Error) {
    return <ErrorAlert error={jobGroup} />;
  }

  const $header = _renderHeader();
  
  return (
    <div>
      {$header}
      <JobList jobGroupId={jobGroupId} search={location.search} onRunJobList={onRunJobList} onUpdateQuery={onUpdateQuery} />
      <div
        className="modal right fade"
        id="myModal"
        tabIndex="-1"
        role="dialog"
        aria-labelledby="myModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title" id="myModalLabel">
                Set Up Schedule
              </h4>
              <button
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <ScheduleCreateFromJobs jobName={jobGroup.name} submitType="submitBatch" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withCurrentUser(JobListByJobGroup);