import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

import jobHistoryService from '../backend/jobHistoryService';

import Alert from '../components/Alert';
import LoadingIndicator from '../components/LoadingIndicator';
import ParametersTable from '../components/ParametersTable';
import JobConfigGroupsBlock from '../components/JobConfigGroupsBlock';
import { withCurrentUser } from '../components/currentUser';
import ScheduleCreateFromJobs from '../schedule/ScheduleCreateFromModal';

const JobHistoryDetail = () => {
  const { jobHistoryId } = useParams();
  const [jobHistory, setJobHistory] = useState(null);

  useEffect(() => {
    loadJobHistory();
  }, [jobHistoryId]);

  const loadJobHistory = () => {
    console.log(`Loading detail of job history #${jobHistoryId}...`);
    jobHistoryService.getJobHistoryDetail(jobHistoryId).then((jobHistory) => {
      setJobHistory(jobHistory);
    })
      .catch((error) => {
        setJobHistory(error);
      });
  };

  if (jobHistory === null) {
    return <LoadingIndicator />;
  }
  if (jobHistory instanceof Error) {
    return <Alert type={"danger"} text={String(jobHistory)} />;
  }

  const job = jobHistory.jobDetail;
  const $jobGroupItems = job.jobGroups.map(jobGroup => 
    <li key={jobGroup.id} className="list-inline-item">
      <Link 
        to={`/job/list/${jobGroup.id}`} 
        className="badge badge-lg badge-muted badge-outline"
      >
        <i className="fa fa-fw fa-sitemap" />
        {' ' + jobGroup.name}
      </Link>
    </li>
  );

  let $jobGroups = null;
  if ($jobGroupItems.length > 0) {
    $jobGroups = <ul className="list-inline">{$jobGroupItems}</ul>;
  } else {
    $jobGroups = (
      <div className="alert alert-warning">
        <i className="fa fa-fw fa-exclamation-triangle mr-1" />
        This is an orphan job. It does not belong to any job group.
      </div>
    );
  }

  const updateInfo = [
    ['Release Version', jobHistory.releaseVersion],
    ['CR', jobHistory.cr],
    ['Updated By', jobHistory.updatedBy],
    ['Update Time', jobHistory.updateTime],
  ];

  const $updateInfoRows = updateInfo.map(([name, value]) => 
    <tr key={`info-${name}`}>
      <th className="nowrap" style={{ width: '30%' }}>{name}</th>
      <td>{value}</td>
    </tr>
  );

  const jobInfo = [
    ['Name', job.name],
    ['Description', job.description],
    ['Owner', job.owner],
    ['Priority', job.priority],
    ['Location', job.location],
    ['Type', job.type],
  ];
  const $jobInfoRows = jobInfo.map(([name, value]) => 
    <tr key={`info-${name}`}>
      <th className="nowrap" style={{ width: '30%' }}>{name}</th>
      <td>{value}</td>
    </tr>
  );

  const jobContext = job.context;
  const $jobContext = (
    <section>
      <h3 className="display-6">
        <span className="mr-2">Job Context:</span>
        <a href={`/frontend/globalConfig/job-context/detail/${jobContext.id}`}>
          {jobContext.name}
        </a>
      </h3>
      <div className="my-2">
        This job context contains the following technical configurations:
      </div>
      <JobConfigGroupsBlock 
        categoryType="technical" 
        jobConfigGroups={jobContext.configGroups} 
      />
    </section>
  );

  const hasVariables = Object.keys(job.variables.entries).length > 0;
  let $variablesSection = null;
  if (hasVariables) {
    $variablesSection = (
      <section>
        <h3 className="display-6">Job Variables</h3>
        <ParametersTable parameters={job.variables} />
      </section>
    );
  }

  const hasLabel = Object.keys(job.labels).length > 0;
  let $labels = null;
  if (hasLabel) {
    $labels = job.labels.map(label => 
      <a
        key={`label-${label.name}`}
        className="mr-2 scorch-label"
        href={`/frontend/jobs/?filterScope=Label&jobNameKeyword=${encodeURIComponent(label.name)}`}
      >
        {label.name}
      </a>
    );
  } else {
    $labels = <span>No labels</span>;
  }

  return (
    <div>
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to={`/job/detail/${job.id}`}>
              {`Job ${job.name}`}
            </Link>
          </li>
          <li className="breadcrumb-item">
            <Link to={`/jobHistory/list/${job.id}/${job.name}`}>
              Job History List
            </Link>
          </li>
          <li className="breadcrumb-item active">Job history</li>
        </ol>
      </nav>
      <h2 className="display-4" title="View Job Request History">
        {`History# ${job.name}`}
      </h2>
      <section>
        <h3 className="display-6">Update Info</h3>
        <table className="table table-striped table-fixed">
          <tbody>{$updateInfoRows}</tbody>
        </table>
      </section>
      <div>
        <div className="text-right" style={{ width: '100%' }}>
          {$labels}
        </div>
      </div>
      {$jobGroups}
      <section>
        <h3 className="display-6">Job Info</h3>
        <table className="table table-striped table-fixed">
          <tbody>{$jobInfoRows}</tbody>
        </table>
      </section>
      {$jobContext}
      <section>
        <h3 className="display-6">Configuration Groups</h3>
        <div className="my-2">
          This job contains the following functional configurations:
        </div>
        <JobConfigGroupsBlock 
          categoryType="functional" 
          jobConfigGroups={job.configGroups} 
        />
      </section>
      {$variablesSection}
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
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="modal-body">
              <ScheduleCreateFromJobs 
                jobName={job.name} 
                submitType="submitJob" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withCurrentUser(JobHistoryDetail);