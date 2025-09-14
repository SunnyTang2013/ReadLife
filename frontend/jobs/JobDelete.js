import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { isEqual } from 'lodash';

import jobs from '../backend/jobs';
import deleteCheck from '../backend/deleteCheck';
import RouterPropTypes from '../proptypes/router';

import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';
import { withCurrentUser } from '../components/currentUser';

const JobDelete = () => {
  const [job, setJob] = useState(null);
  const [delJobCheck, setDelJobCheck] = useState(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [isDeleted, setIsDeleted] = useState(false);

  const navigate = useNavigate();
  const { jobId } = useParams();

  useEffect(() => {
    _loadJob();
  }, [jobId]);

  const onConfirmDelete = (event) => {
    const isConfirmed = event.target.checked;
    setIsConfirmed(isConfirmed);
  };

  const onDelete = () => {
    setIsDeleting(true);
    if (job === null || job instanceof Error) {
      console.log('Job is not loaded.');
      return;
    }
    jobs.deleteJob(job)
      .then(() => {
        setIsDeleting(false);
        setDeleteError(null);
        setIsDeleted(true);
      })
      .catch((error) => {
        setIsDeleting(false);
        setDeleteError(error);
        setIsDeleted(false);
      });
  };

  const onCancel = () => {
    navigate(-1);
  };

  const _loadJob = () => {
    console.log(`Loading job #${jobId}...`);
    const jobPromise = jobs.getJob(jobId);
    const delCheckPromise = deleteCheck.delJobCheck(jobId);
    Promise.all([jobPromise, delCheckPromise])
      .then(([job, delJobCheck]) => {
        setJob(job);
        setDelJobCheck(delJobCheck);
        setIsDeleting(false);
        setDeleteError(null);
        setIsDeleted(false);
      })
      .catch((error) => {
        setJob(error);
        setIsDeleting(false);
        setDeleteError(null);
        setIsDeleted(false);
      });
  };

  const _renderDeleted = () => {
    return (
      <div className="alert alert-success">
        <i className="fa fa-fw fa-check mr-1" />
        {`Job #${job.id} ( `}
        <strong>{job.name}</strong>
        {') has been deleted successfully.'}
      </div>
    );
  };

  const _renderConfirmation = () => {
    const $jobGroupItems = job.jobGroups.map(jobGroup => (
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
    ));

    return (
      <div>
        <ErrorAlert error={deleteError} />
        <section>
          <div className="my-2">
            {`Job #${job.id} ( `}
            <strong>{job.name}</strong>
            {') belongs to the following job groups:'}
          </div>
          <ul className="list-inline">{$jobGroupItems}</ul>
        </section>
        <section>
          <div className="alert alert-warning my-2">
            <i className="fa fa-fw fa-exclamation-triangle mr-1" />
            {`Are you sure you want to delete job #${job.id}: `}
            <strong>{job.name}</strong>
            {' ?'}
          </div>
          <fieldset disabled={isDeleting}>
            <div className="form-group form-check">
              <input
                id="confirmDelete"
                type="checkbox"
                className="form-check-input"
                checked={isConfirmed}
                onChange={onConfirmDelete}
              />
              <label htmlFor="confirmDelete" className="form-check-label">
                Yes, I confirm I want to delete this job.
              </label>
            </div>
            <div className="form-group">
              <button
                className="btn btn-danger mr-2"
                type="button"
                disabled={!isConfirmed}
                onClick={onDelete}
              >
                Delete this job
              </button>
              <Link to={`/job/detail/${job.id}`} className="btn btn-secondary mr-2">
                View job detail
              </Link>
              <button className="btn btn-secondary" type="button" onClick={onCancel}>
                Cancel and go back
              </button>
            </div>
          </fieldset>
        </section>
      </div>
    );
  };

  const _renderDeleteCheck = () => {
    return (
      <div>
        <section>
          <div className="my-2">
            {`Job #${job.id} ( `}
            <strong>{job.name}</strong>
            {') has the following schedules:'}
          </div>
          <ul className="list-inline">
            <li key={job.id} className="list-inline-item">
              <a
                href={`/frontend/schedule/list?keywordField=jobName&keywordValue=${job.name}&page=0`}
                className="badge badge-lg badge-muted badge-outline"
              >
                <i className="fa fa-fw fa fa-clock-o" />
                {' '}
                {job.name}
              </a>
            </li>
          </ul>
        </section>
        <section>
          <div className="alert alert-warning my-2">
            <i className="fa fa-fw fa-exclamation-triangle mr-1" />
            You have to drop these schedules first!
          </div>
          <div className="form-group">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={onCancel}
            >
              Cancel and go back
            </button>
          </div>
        </section>
      </div>
    );
  };

  if (job === null) {
    return <LoadingIndicator />;
  }
  if (job instanceof Error) {
    return <ErrorAlert error={job} />;
  }

  let $content = null;
  if (delJobCheck && delJobCheck.schedulerExists) {
    $content = _renderDeleteCheck();
  } else if (isDeleted) {
    $content = _renderDeleted();
  } else {
    $content = _renderConfirmation();
  }

  return (
    <div>
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to={`/job/detail/${job.id}`}>{`Job #${job.id}`}</Link>
          </li>
          <li className="breadcrumb-item active">Delete job</li>
        </ol>
      </nav>
      <h2 className="display-4">{`Delete job #${job.id}`}</h2>
      {$content}
    </div>
  );
};

export default withCurrentUser(JobDelete);