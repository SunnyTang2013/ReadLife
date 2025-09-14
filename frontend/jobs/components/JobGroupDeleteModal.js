import React, { useState, useEffect } from 'react';

import jobGroupService from '../../backend/jobGroupService';
import ErrorAlert from '../../components/ErrorAlert';
import StaticModal from '../../components/StaticModal';
import deleteCheck from '../../backend/deleteCheck';
import LoadingIndicator from '../../components/LoadingIndicator';


const JobGroupDeleteModal = ({ action, onComplete, onClose }) => {
  const jobGroup = action.jobGroup;
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [isConfirmDeleteChecked, setIsConfirmDeleteChecked] = useState(false);
  const [isDeleteOrphansChecked, setIsDeleteOrphansChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [delHierarchyCheck, setDelHierarchyCheck] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    _delCheck();
  }, []);

  const onConfirmDeleteChanged = (event) => {
    const isConfirmDeleteChecked = event.target.checked;
    setIsConfirmDeleteChecked(isConfirmDeleteChecked);
  };

  const onDeleteOrphansChanged = (event) => {
    const isDeleteOrphansChecked = event.target.checked;
    setIsDeleteOrphansChecked(isDeleteOrphansChecked);
  };

  const onDelete = () => {
    setIsSubmitting(true);
    jobGroupService.deleteJobGroup(jobGroup.id, isDeleteOrphansChecked)
      .then(() => {
        setIsModalOpen(false);
        setIsSubmitting(false);
        setTimeout(onComplete, 0);
      })
      .catch((error) => {
        setIsSubmitting(false);
        setError(error);
      });
  };

  const onCancel = () => {
    setIsModalOpen(false);
    setTimeout(onClose, 0);
  };

  const _delCheck = () => {
    deleteCheck.delJobGroupCheck(jobGroup.id).then((delHierarchyCheck) => {
      setDelHierarchyCheck(delHierarchyCheck);
    })
      .catch((error) => {
        setDelHierarchyCheck(error);
      });
  };

  const _renderDeleteCheck = () => {
    const $batchItems = delHierarchyCheck.batches.map(batch => 
      <li key={batch.id} className="list-inline-item">
        <a
          href={`/frontend/batches/detail/${batch.id}`}
          className="badge badge-lg badge-muted badge-outline"
        >
          <i className="fa fa-fw fa fa-tasks" />
          {` ${batch.name}`}
        </a>
      </li>
    );
    
    return (
      <div>
        {delHierarchyCheck.schedulerExists && (
          <section>
            <div className="my-2">
              Job group ( <strong>{jobGroup.name}</strong> ) has the following schedules:
            </div>
            <ul className="list-inline">
              <li className="list-inline-item">
                <a
                  href={`/frontend/schedule/list?keywordField=jobName&keywordValue=${jobGroup.name}&page=0`}
                  className="badge badge-lg badge-muted badge-outline"
                >
                  <i className="fa fa-fw fa fa-clock-o" />
                  {` ${jobGroup.name}`}
                </a>
              </li>
            </ul>
          </section>
        )}
        {delHierarchyCheck.batchExists && (
          <section>
            <div className="my-2">
              Job group ( <strong>{jobGroup.name}</strong> ) has the following batches:
            </div>
            <ul className="list-inline">{$batchItems}</ul>
          </section>
        )}
        <section>
          <div className="alert alert-warning my-2">
            <i className="fa fa-fw fa-exclamation-triangle mr-1" />
            You have to drop these relationship first!
          </div>
          <div className="form-group">
            <button className="btn btn-default" type="button" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </section>
      </div>
    );
  };

  const _renderConfirmation = () => {
    return (
      <div>
        <div className="alert alert-warning my-2" role="alert">
          <i className="fa fa-fw fa-exclamation-triangle mr-1" />
          Are you sure you want to delete <strong>{jobGroup.name}</strong>?
        </div>
        <fieldset disabled={isSubmitting}>
          <div className="form-group form-check">
            <input 
              id="confirm-delete" 
              type="checkbox" 
              className="form-check-input" 
              checked={isConfirmDeleteChecked} 
              onChange={onConfirmDeleteChanged} 
            />
            <label htmlFor="confirm-delete" className="form-check-label">
              Yes, I want to delete this job group.
            </label>
          </div>
          <div className="form-group form-check">
            <input 
              id="delete-orphans" 
              type="checkbox" 
              className="form-check-input" 
              checked={isDeleteOrphansChecked} 
              onChange={onDeleteOrphansChanged} 
            />
            <label htmlFor="delete-orphans" className="form-check-label">
              Also delete orphan jobs, if any.
            </label>
          </div>
          <div className="form-group">
            <button
              className="btn btn-danger mr-2"
              type="button"
              disabled={!isConfirmDeleteChecked}
              onClick={onDelete}
            >
              Delete this job group!
            </button>
            <button className="btn btn-default" type="button" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </fieldset>
      </div>
    );
  };

  let $content = null;

  if (delHierarchyCheck === null) {
    $content = (
      <div>
        <LoadingIndicator />
        <button className="btn btn-default" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    );
  } else if (delHierarchyCheck instanceof Error) {
    $content = (
      <div>
        <ErrorAlert error={delHierarchyCheck} />
        <button className="btn btn-default" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    );
  } else if (delHierarchyCheck
    && (delHierarchyCheck.schedulerExists || delHierarchyCheck.batchExists)) {
    $content = _renderDeleteCheck();
  } else {
    $content = _renderConfirmation();
  }

  return (
    <StaticModal isOpen={isModalOpen}>
      <h2 className="lighter">Delete job group</h2>
      <ErrorAlert error={error} />
      {$content}
    </StaticModal>
  );
};

export default JobGroupDeleteModal;