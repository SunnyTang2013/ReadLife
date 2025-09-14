import React, { useState } from 'react';
import jobGroupService from '../../backend/jobGroupService';
import StaticModal from '../../components/StaticModal';
import Alert from '../../components/Alert';


const JobGroupCreateModal = ({ action, onComplete, onClose }) => {
  const parentJobGroup = action.jobGroup;
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const onCancel = () => {
    setIsModalOpen(false);
    setTimeout(onClose, 0);
  };

  const onChangeName = (event) => {
    setName(event.target.value);
  };

  const onSubmit = (event) => {
    event.preventDefault();
    if (!validateName(name)) {
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    const parentJobGroupId = parentJobGroup.id;
    jobGroupService.createJobGroup(name, parentJobGroupId)
      .then(() => {
        setIsModalOpen(false);
        setTimeout(onComplete, 0);
      })
      .catch((error) => {
        setIsSubmitting(false);
        setErrorMessage(error.message || String(error));
      });
  };

  const validateName = (name) => {
    if (!name) {
      setErrorMessage('Please Input Your Job Group Name.');
      return false;
    }
    return true;
  };

  return (
    <StaticModal isOpen={isModalOpen}>
      <h2 className="lighter">Add a new job group</h2>
      {errorMessage && <Alert type="warning" text={errorMessage} />}
      <form className="my-2" onSubmit={onSubmit}>
        <fieldset disabled={isSubmitting}>
          <div className="form-group">
            <label htmlFor="parent-job-group">Parent Job Group</label>
            <input
              id="parent-job-group"
              className="form-control"
              type="text"
              value={parentJobGroup.name}
              readOnly
            />
          </div>
          <div className="form-group">
            <label htmlFor="job-group-name">Job Group Name</label>
            <input
              id="job-group-name"
              className="form-control"
              type="text"
              placeholder="Your Job Group Name"
              value={name}
              onChange={onChangeName}
            />
          </div>
          <div className="form-group pull-right">
            <ul className="list-inline">
              <li className="list-inline-item">
                <button className="btn btn-primary" type="submit">
                  {isSubmitting && <i className="fa fa-spin fa-spinner mr-1" />}
                  Save
                </button>
              </li>
              <li className="list-inline-item">
                <button className="btn btn-default" type="button" onClick={onCancel}>
                  Cancel
                </button>
              </li>
            </ul>
          </div>
        </fieldset>
      </form>
    </StaticModal>
  );
};

export default JobGroupCreateModal;