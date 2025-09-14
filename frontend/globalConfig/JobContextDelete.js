import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { isEqual } from 'lodash';

import jobContextService from '../backend/jobContextService';
import deleteCheck from '../backend/deleteCheck';

import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';
import { withCurrentUser } from '../components/currentUser';

const JobDelete = () => {
  const { jobContextId } = useParams();
  const navigate = useNavigate();
  const [jobContext, setJobContext] = useState(null);
  const [delContextCheck, setDelContextCheck] = useState(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [isDeleted, setIsDeleted] = useState(false);

  useEffect(() => {
    loadJobContext();
  }, [jobContextId]);

  function onConfirmDelete(event) {
    const isConfirmed = event.target.checked;
    setIsConfirmed(isConfirmed);
  }

  function onDelete() {
    setIsDeleting(true);
    if (jobContext === null || jobContext instanceof Error) {
      console.log('JobContext is not loaded.');
      return;
    }
    jobContextService.deleteJobContext(jobContext.id)
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
  }

  function onCancel() {
    navigate(-1);
  }

  function loadJobContext() {
    console.log(`Loading JobContext #${jobContextId}...`);
    const jobContextPromise = jobContextService.getJobContext(jobContextId);
    const delCheckPromise = deleteCheck.delJobContextCheck(jobContextId);
    Promise.all([jobContextPromise, delCheckPromise])
      .then(([jobContext, delContextCheck]) => {
        setJobContext(jobContext);
        setDelContextCheck(delContextCheck);
        setIsDeleting(false);
        setDeleteError(null);
        setIsDeleted(false);
      })
      .catch((error) => {
        setJobContext(error);
        setIsDeleting(false);
        setDeleteError(null);
        setIsDeleted(false);
      });
  }

  function renderDeleted() {
    return <div className="alert alert-success">{<i className="fa fa-fw fa-check mr-1" />,
      `JobContext #${jobContext.id} ( `,
      <strong>{jobContext.name}</strong>,
      '}</div> has been deleted successfully.'
    );
  }

  function renderConfirmation() {
    return React.createElement('div', null,
      <ErrorAlert error={deleteError} />,
      React.createElement('section', null,
        React.createElement('div', { className: 'display-6' },
          `Job context used in ${jobContext.jobCount} jobs.`
        )
      ),
      React.createElement('section', null,
        React.createElement('div', { className: 'alert alert-warning my-2' },
          <i className="fa fa-fw fa-exclamation-triangle mr-1" />,
          `Are you sure you want to delete context #${jobContext.id}: `,
          <strong>{jobContext.name}</strong>,
          ' ?'
        ),
        React.createElement('fieldset', { disabled: isDeleting },
          React.createElement('div', { className: 'form-group form-check' },
            <input id="confirmDelete" type="checkbox" className="form-check-input" checked={isConfirmed} onChange={onConfirmDelete} />,
            React.createElement('label', { htmlFor: 'confirmDelete', className: 'form-check-label' },
              'Yes, I confirm I want to delete this context.'
            )
          ),
          React.createElement('div', { className: 'form-group' },
            React.createElement('button', {
              className: 'btn btn-danger mr-2',
              type: 'button',
              disabled: !isConfirmed,
              onClick: onDelete
            }, 'Delete this jobContext'),
            <button className="btn btn-secondary" type="button" onClick={onCancel}>Cancel and go back</button>
          )
        )
      )
    );
  }

  function renderDeleteCheck() {
    const $batchItems = delContextCheck.batches.map(batch => 
      React.createElement('li', { key: batch.id, className: 'list-inline-item' },
        React.createElement('a', {
          href: `/frontend/batches/detail/${batch.id}`,
          className: 'badge badge-lg badge-muted badge-outline'
        },
          <i className="fa fa-fw fa fa-tasks" />,
          ` ${batch.name}`
        )
      )
    );

    return React.createElement('div', null,
      jobContext.jobCount > 0 && React.createElement('section', null,
        React.createElement('div', { className: 'my-2' },
          React.createElement('a', {
            href: `/frontend/jobs/job/list-by-context-group/${jobContext.id}`,
            className: 'badge badge-lg badge-muted badge-outline'
          }, `Job context used in ${jobContext.jobCount} jobs.`)
        )
      ),
      delContextCheck.batchExists && React.createElement('section', null,
        React.createElement('div', { className: 'my-2' },
          'Job context ( ',
          <strong>{jobContext.name}</strong>,
          ' ) has the following batches:'
        ),
        <ul className="list-inline">{...$batchItems}</ul>
      ),
      React.createElement('section', null,
        React.createElement('div', { className: 'alert alert-warning my-2' },
          <i className="fa fa-fw fa-exclamation-triangle mr-1" />,
          'You have to drop these relationship first!'
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('button', { 
            className: 'btn btn-secondary', 
            type: 'button', 
            onClick: onCancel 
          }, 'Cancel')
        )
      )
    );
  }

  if (jobContext === null) {
    return <LoadingIndicator />;
  }
  if (jobContext instanceof Error) {
    return <ErrorAlert error={jobContext} />;
  }

  let $content = null;
  if (delContextCheck && (delContextCheck.batchExists || jobContext.jobCount > 0)) {
    $content = renderDeleteCheck();
  } else if (isDeleted) {
    $content = renderDeleted();
  } else {
    $content = renderConfirmation();
  }

  return React.createElement('div', null,
    React.createElement('nav', null,
      React.createElement('ol', { className: 'breadcrumb' },
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: `/job-context/detail/${jobContext.id}` }, `JobContext #${jobContext.id}`)
        ),
        <li className="breadcrumb-item active">Delete jobContext</li>
      )
    ),
    <h2 className="display-4">{`Delete jobContext #${jobContext.id}`}</h2>,
    $content
  );
};

export default JobDelete;