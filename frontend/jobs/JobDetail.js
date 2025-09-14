import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import jobs from '../backend/jobs';
import jobExecution, { addCobDateParam } from '../backend/jobExecution';

import Alert from '../components/Alert';
import LoadingIndicator from '../components/LoadingIndicator';
import ParametersTable from '../components/ParametersTable';
import JobConfigGroupsBlock from '../components/JobConfigGroupsBlock';
import { withCurrentUser } from '../components/currentUser';
import ScheduleCreateFromJobs from '../schedule/ScheduleCreateFromModal';
import labelService from '../backend/labels';
import JobLabelEditModal from './components/JobLabelEditModal';
import RunModal from '../components/RunModal';
import JobGroupEditModalForJob from './components/JobGroupEditModalForJob';
import { checkWithinFiveCalendarDays } from '../utils/utilities';

const JobDetail = () => {
  const [job, setJob] = useState(null);
  const [jobRelatedPipelines, setJobRelatedPipelines] = useState(null);
  const [showLabelEditModal, setShowLabelEditModal] = useState(false);
  const [showAllPipelines, setShowAllPipelines] = useState(false);
  const [showJobGroupEditModal, setShowJobGroupEditModal] = useState(false);
  const [openRunModal, setOpenRunModal] = useState(false);

  const navigate = useNavigate();
  const params = useParams();
  const jobId = params.jobId;

  useEffect(() => {
    _loadJob();
    _loadJobRelatedPipelines();
  }, [jobId]);

  const onRefresh = (event) => {
    event.preventDefault();
    setJob(null);
    setOpenRunModal(false);
    _loadJob();
  };

  const onCloseRunModal = () => {
    setOpenRunModal(false);
  };

  const onRunModal = () => {
    const cobParameters = addCobDateParam();
    const asofdate = cobParameters.entries['ASOFDATE'];
    const marketdate = cobParameters.entries['MARKETDATE'];
    const tradeasofdate = cobParameters.entries['trade_as_of_date'];
    const cobdate = cobParameters.entries['scorch.ui.cobdate'];

    const manifestFilter = cobParameters.entries['goldeneye.manifestFilter'];
    const vaultSnapid = cobParameters.entries['vault.snapID'];
    const goldeneyeOptions = cobParameters.entries['goldeneye.options'];

    const isChanged = checkWithinFiveCalendarDays(asofdate, marketdate, tradeasofdate, cobdate);
    if (isChanged && (manifestFilter || vaultSnapid || goldeneyeOptions)) {
      setOpenRunModal(true);
    } else {
      onQuickRun();
    }
  };

  const onQuickRun = () => {
    jobExecution.submitJob(jobId)
      .then((jobRequest) => {
        navigate(`/job-request-submitted/${jobRequest.id}`);
      })
      .catch((error) => {
        toast.error(`Failed to submit job: ${error}`);
      });
  };

  const onUpdateLabels = (labels) => {
    labelService.updateJobLabels(job.id, labels).then(result => {
      setJob({ ...job, labels: result });
      setShowLabelEditModal(false);
    }).catch(error => {
      setShowLabelEditModal(false);
      toast.error(`fail to update labels: ${error}`);
    });
  };

  const onUpdateJobGroups = (jobGroups) => {
    jobs.updateJobWithJobGroup(job.id, jobGroups).then(jobSummary => {
      setJob(jobSummary);
      setShowJobGroupEditModal(false);
    }).catch(error => {
      setShowJobGroupEditModal(false);
      toast.error(`fail to update labels: ${error}`);
    });
  };

  const onShowAllPipelines = () => {
    setShowAllPipelines(true);
  };

  const onCloseLabelEditModal = () => {
    setShowLabelEditModal(false);
  };

  const onShowLabelEditModal = () => {
    setShowLabelEditModal(true);
  };

  const onShowJobGroupEditModal = () => {
    setShowJobGroupEditModal(true);
  };

  const onCloseJobGroupEditModal = () => {
    setShowJobGroupEditModal(false);
  };

  const _loadJob = () => {
    console.log(`Loading detail of job #${jobId}...`);
    jobs.getJob(jobId).then((job) => {
      setJob(job);
    })
      .catch((error) => {
        setJob(error);
      });
  };

  const _loadJobRelatedPipelines = () => {
    console.log(`Loading detail of job #${jobId}...`);
    jobs.getJobRelatedPipelines(jobId).then((jobRelatedPipelines) => {
      setJobRelatedPipelines(jobRelatedPipelines);
    })
      .catch((error) => {
        setJobRelatedPipelines(error);
      });
  };

  const _runModal = () => {
    if (openRunModal) {
      return <RunModal name={job.name} title="Job" openModal={openRunModal} onQuickRun={onQuickRun} onClose={onCloseRunModal} />;
    }
    return null;
  };

  if (job === null) {
    return <LoadingIndicator />;
  }
  if (job instanceof Error) {
    return <Alert type="danger" text={String(job)} />;
  }

  const $RunModal = _runModal();

  const $jobGroupItems = job.jobGroups.map(jobGroup =>
    <li key={jobGroup.id} className="list-inline-item">
      <Link
        to={`/job/list/${jobGroup.id}`}
        className="badge badge-lg badge-muted badge-outline"
      >
        <i className="fa fa-fw fa-sitemap" />
        {' '}
        {jobGroup.name}
      </Link>
    </li>
  );

  let $jobGroups = null;
  if ($jobGroupItems.length > 0) {
    $jobGroups = (
      <ul className="list-inline">
        <li key="edit-job-group" className="list-inline-item">
          <button
            className="btn btn-link"
            type="button"
            onClick={onShowJobGroupEditModal}
          >
            <i className="fa fa-fw fa-edit" />
          </button>
        </li>
        {$jobGroupItems}
      </ul>
    );
  }

  const $labelEditModal = showLabelEditModal ?
    <JobLabelEditModal job={job} onUpdate={onUpdateLabels} onClose={onCloseLabelEditModal} /> : null;

  const $jobGroupEditModal = showJobGroupEditModal ?
    <JobGroupEditModalForJob job={job} onUpdate={onUpdateJobGroups} onClose={onCloseJobGroupEditModal} /> : null;

  return (
    <div>
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to={`/job/list/${job.jobGroups[0]?.id || ''}`}>
              Job List
            </Link>
          </li>
          <li className="breadcrumb-item active">{job.name}</li>
        </ol>
      </nav>
      <h2 className="display-4">
        {job.name}
        {' '}
        <small className="text-muted">{`#${job.id}`}</small>
      </h2>
      <div className="row">
        <div className="col-9">
          <section>
            <h3 className="display-6">Basic Information</h3>
            <table className="table table-striped">
              <tbody>
                <tr>
                  <th>Name</th>
                  <td>{job.name}</td>
                </tr>
                <tr>
                  <th>Description</th>
                  <td>{job.description || <em>N/A</em>}</td>
                </tr>
                <tr>
                  <th>Owner</th>
                  <td>{job.owner}</td>
                </tr>
                <tr>
                  <th>Priority</th>
                  <td>{job.priority}</td>
                </tr>
                <tr>
                  <th>Location</th>
                  <td>{job.location}</td>
                </tr>
                <tr>
                  <th>Job Groups</th>
                  <td>{$jobGroups}</td>
                </tr>
              </tbody>
            </table>
          </section>
          <JobConfigGroupsBlock job={job} />
          <section>
            <h3 className="display-6">Variables</h3>
            <ParametersTable parameters={job.variables} />
          </section>
        </div>
        <div className="col-3">
          <aside>
            <h3 className="display-6">Actions</h3>
            <div className="list-group">
              <button
                className="list-group-item list-group-item-action"
                onClick={onRunModal}
              >
                <i className="fa fa-fw fa-play text-success" />
                {' Run Job'}
              </button>
              <Link
                to={`/job/customized-run/${job.id}`}
                className="list-group-item list-group-item-action"
              >
                <i className="fa fa-fw fa-play text-primary" />
                {' Run Job (Customized)'}
              </Link>
              <Link
                to={`/job/edit/${job.id}`}
                className="list-group-item list-group-item-action"
              >
                <i className="fa fa-fw fa-edit text-primary" />
                {' Edit Job'}
              </Link>
              <Link
                to={`/job/copy/${job.id}`}
                className="list-group-item list-group-item-action"
              >
                <i className="fa fa-fw fa-copy text-info" />
                {' Copy Job'}
              </Link>
              <button 
                className="list-group-item list-group-item-action" 
                onClick={onShowLabelEditModal}
              >
                <i className="fa fa-fw fa-tags text-warning" />
                {' Edit Labels'}
              </button>
              <button 
                className="list-group-item list-group-item-action" 
                onClick={onRefresh}
              >
                <i className="fa fa-fw fa-refresh" />
                {' Refresh'}
              </button>
            </div>
          </aside>
        </div>
      </div>
      {$RunModal}
      {$labelEditModal}
      {$jobGroupEditModal}
    </div>
  );
};

export default withCurrentUser(JobDetail);