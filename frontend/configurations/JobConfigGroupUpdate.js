import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { isEqual } from 'lodash';

import configurations from '../backend/configurations';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';

import JobConfigGroupForm from './components/JobConfigGroupForm';
import StaticModal from '../components/StaticModal';

const JobConfigGroupUpdate = () => {
  const [jobConfigGroup, setJobConfigGroup] = useState(null);
  const [currentJobConfigGroup, setCurrentJobConfigGroup] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const navigate = useNavigate();
  const params = useParams();
  const jobConfigGroupId = params.jobConfigGroupId;

  useEffect(() => {
    loadJobConfigGroup();
  }, [jobConfigGroupId]);

  function onOpenSaveModal(jobConfigGroup) {
    const category = jobConfigGroup.category;
    const currentManifestFilter = jobConfigGroup.parameters.entries['goldeneye.manifestFilter'];
    const previousManifestFilter = jobConfigGroup.parameters.entries['goldeneye.manifestFilter'];
    if (category === 'MANIFEST' && currentManifestFilter !== previousManifestFilter) {
      setOpenModal(true);
      setCurrentJobConfigGroup(jobConfigGroup);
    } else {
      onSave(jobConfigGroup);
    }
  }

  function onCloseSaveModal() {
    setOpenModal(false);
  }

  function onSave(jobConfigGroup) {
    setIsSaving(true);
    configurations.updateJobConfigGroup(jobConfigGroup)
      .then(() => {
        toast.success('Job config group is updated successfully.');
        navigate(`/job-config-group/detail/${jobConfigGroupId}`);
      })
      .catch((error) => {
        setIsSaving(false);
        setOpenModal(false);
        setSaveError(error);
      });
  }

  function onCancel() {
    navigate(`/job-config-group/detail/${jobConfigGroupId}`);
  }

  function loadJobConfigGroup() {
    console.log(`Loading job config group #${jobConfigGroupId} ...`);
    configurations.getJobConfigGroup(jobConfigGroupId)
      .then((jobConfigGroup) => {
        setJobConfigGroup(jobConfigGroup);
        setIsSaving(false);
        setOpenModal(false);
        setSaveError(null);
      })
      .catch((error) => {
        setJobConfigGroup(error);
        setIsSaving(false);
        setOpenModal(false);
        setSaveError(null);
      });
  }

  if (jobConfigGroup === null) {
    return <LoadingIndicator />;
  }
  if (jobConfigGroup instanceof Error) {
    return <ErrorAlert error={jobConfigGroup} />;
  }

  return (
    <div>
      <section>
        <nav>
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link to="/">Configurations</Link>
            </li>
            <li className="breadcrumb-item">
              <Link to="/job-config-group/list">Job Config Groups</Link>
            </li>
            <li className="breadcrumb-item active">{jobConfigGroup.name}</li>
          </ol>
        </nav>
        <h2 className="display-4">Update: {jobConfigGroup.name}</h2>
        <ErrorAlert error={saveError} />
        <JobConfigGroupForm 
          jobConfigGroup={jobConfigGroup} 
          onSave={onOpenSaveModal} 
          onCancel={onCancel} 
          disabled={isSaving} 
        />
      </section>
      <section>
        <StaticModal isOpen={openModal}>
          <h2 className="lighter">Change Manifest Filter</h2>
          <div className="alert alert-warning my-2" role="alert">
            <i className="fa fa-fw fa-exclamation-triangle mr-1" />
            Are you sure you want to change Manifest trade filter? Please ensure that you have known this will not impact QTF&PPE or other users
          </div>
          <fieldset disabled={!openModal}>
            <div className="form-group">
              <button
                className="btn btn-danger mr-2"
                type="button"
                onClick={() => onSave(currentJobConfigGroup)}
              >
                Save Changes!
              </button>
              <button 
                className="btn btn-default" 
                type="button" 
                onClick={onCloseSaveModal}
              >
                Cancel
              </button>
            </div>
          </fieldset>
        </StaticModal>
      </section>
    </div>
  );
};

export default JobConfigGroupUpdate;