import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import jobGroupService from '../backend/jobGroupService';
import RouterPropTypes from '../proptypes/router';
import ScorchPropTypes from '../proptypes/scorch';

import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';
import { withCurrentUser } from '../components/currentUser';

const JobGroupSettings = ({ currentUser }) => {
  const [jobGroup, setJobGroup] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const navigate = useNavigate();
  const { jobGroupId } = useParams();

  useEffect(() => {
    _loadJobGroup();
  }, [jobGroupId]);

  const onChangeMaxRunningJobs = (event) => {
    const maxRunningJobs = event.target.value;
    setJobGroup((prevJobGroup) => {
      return Object.assign({}, prevJobGroup, { maxRunningJobs });
    });
  };

  const onSave = () => {
    setIsSaving(true);
    // Make sure `maxRunningJobs` is a number.
    const input = Object.assign({}, jobGroup);
    const maxRunningJobs = parseInt(input.maxRunningJobs, 10);
    if (Number.isNaN(maxRunningJobs)) {
      setIsSaving(false);
      setSaveError(new Error('Invalid value of max running jobs.'));
      return;
    }
    input.maxRunningJobs = maxRunningJobs;
    // Save.
    jobGroupService.updateJobGroup(input)
      .then((jobGroup) => {
        navigate(`/job/list/${jobGroup.id}`, { replace: true });
      })
      .catch((error) => {
        setIsSaving(false);
        setSaveError(error);
      });
  };

  const onCancel = () => {
    navigate(-1);
  };

  const _loadJobGroup = () => {
    console.log(`Loading detail of job group #${jobGroupId}...`);
    jobGroupService.getJobGroup(jobGroupId)
      .then((jobGroup) => {
        setJobGroup(jobGroup);
        setIsSaving(false);
        setSaveError(null);
      })
      .catch((error) => {
        setJobGroup(error);
        setIsSaving(false);
        setSaveError(null);
      });
  };

  if (jobGroup === null) {
    return <LoadingIndicator />;
  }
  if (jobGroup instanceof Error) {
    return <ErrorAlert error={jobGroup} />;
  }

  if (!currentUser.canWrite) {
    return (
      <div className="alert alert-danger">
        <i className="fa fa-fw fa-exclamation-triangle mr-1" />
        You do not have the permission to edit settings of this job group.
      </div>
    );
  }

  return (
    <div>
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to={`/job/list/${jobGroup.id}`}>{`Job Group #${jobGroup.id}`}</Link>
          </li>
          <li className="breadcrumb-item active">Settings</li>
        </ol>
      </nav>
      <h2 className="display-4">{`Settings: ${jobGroup.name}`}</h2>
      <ErrorAlert error={saveError} />
      <form className="my-2">
        <fieldset disabled={isSaving}>
          <div className="form-row mb-4">
            <div className="col-3">
              <label htmlFor="max-running-jobs">
                Max Running-in-Parallel Jobs
              </label>
              <input
                id="max-running-jobs"
                className="form-control"
                type="number"
                value={jobGroup.maxRunningJobs}
                onChange={onChangeMaxRunningJobs}
              />
              <div className="form-text text-muted">
                Use <strong>-1</strong> to indicate no limit.
              </div>
            </div>
          </div>
          <div className="form-group">
            <button
              className="btn btn-primary mr-2"
              type="button"
              onClick={onSave}
            >
              Save Settings
            </button>
            <button className="btn btn-secondary" type="button" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
};

export default withCurrentUser(JobGroupSettings);