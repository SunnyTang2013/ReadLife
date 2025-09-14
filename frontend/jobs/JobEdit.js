import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { isEqual } from 'lodash';

import jobs from '../backend/jobs';
import RouterPropTypes from '../proptypes/router';

import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';
import { withCurrentUser } from '../components/currentUser';
import JobForm from './components/JobForm';

const JobEdit = () => {
  const [job, setJob] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const navigate = useNavigate();
  const { jobId } = useParams();

  useEffect(() => {
    _loadJob();
  }, [jobId]);

  const onSave = (jobInput) => {
    setIsSaving(true);
    jobs.updateJob(jobInput)
      .then((savedJob) => {
        navigate(`/job/detail/${savedJob.id}`);
      })
      .catch((error) => {
        setIsSaving(false);
        setSaveError(error);
      });
  };

  const onCancel = () => {
    navigate(-1);
  };

  const _loadJob = () => {
    console.log(`Loading job #${jobId}...`);
    jobs.getJob(jobId)
      .then((job) => {
        setJob(job);
        setIsSaving(false);
        setSaveError(null);
      })
      .catch((error) => {
        setJob(error);
        setIsSaving(false);
        setSaveError(null);
      });
  };

  if (job === null) {
    return <LoadingIndicator />;
  }
  if (job instanceof Error) {
    return <ErrorAlert error={job} />;
  }

  return (
    <div>
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to={`/job/detail/${job.id}`}>{`Job #${job.id}`}</Link>
          </li>
          <li className="breadcrumb-item active">Edit job</li>
        </ol>
      </nav>
      <h2 className="display-4">{`Edit job #${job.id}`}</h2>
      <ErrorAlert error={saveError} />
      <JobForm job={job} onSave={onSave} onCancel={onCancel} disabled={isSaving} />
    </div>
  );
};

export default withCurrentUser(JobEdit);