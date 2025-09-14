import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import jobs from '../backend/jobs';
import LoadingIndicator from '../components/LoadingIndicator';
import ErrorAlert from '../components/ErrorAlert';
import { getLocationRegionList } from '../utils/constants';

import { withCurrentUser } from '../components/currentUser';
import JobForm from './components/JobForm';
import JobGroupAutosuggest from './components/JobGroupAutosuggest';

function getDefaultLocation() {
  const locationAndRegions = getLocationRegionList();
  return locationAndRegions[0][0];
}

/**
 * Create a new job in the given job group. This function returns a promise.
 */
function createJob(job, jobGroupId) {
  if (!jobGroupId) {
    return Promise.reject(new Error('Parent job group ID is not specified.'));
  }
  return jobs.createJob(job, jobGroupId);
}

const JobCreate = ({ currentUser }) => {
  const { jobGroupId: urlJobGroupId, fromJobId } = useParams();
  const navigate = useNavigate();
  
  const [jobGroupId, setJobGroupId] = useState(urlJobGroupId || null);
  const [newJob, setNewJob] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const onChangeJobGroup = (jobGroup) => {
    if (jobGroup) {
      setJobGroupId(jobGroup.id);
    }
  };

  const onSaveJob = (job) => {
    setIsSaving(true);
    createJob(job, jobGroupId)
      .then((savedJob) => {
        navigate(`/job/detail/${savedJob.id}`);
      })
      .catch((error) => {
        setNewJob(job);
        setIsSaving(false);
        setSaveError(error);
      });
  };

  const onCancel = () => {
    navigate(-1);
  };

  const loadJob = () => {
    if (!fromJobId) {
      setNewJob({
        id: null,
        name: '',
        description: '',
        priority: 1,
        jobGroups: [],
        context: null,
        configGroups: [],
        variables: { entries: {} },
        location: getDefaultLocation(),
      });
      setIsSaving(false);
      setSaveError(null);
      return;
    }

    console.log(`Loading reference job #${fromJobId}...`);
    jobs.getJob(fromJobId)
      .then((fromJob) => {
        setNewJob(Object.assign({}, fromJob, {
          id: null,
          name: '',
          description: '',
          owner: currentUser.username,
          jobGroups: [],
        }));
        setIsSaving(false);
        setSaveError(null);
      })
      .catch((error) => {
        setNewJob(error);
        setIsSaving(false);
        setSaveError(null);
      });
  };

  useEffect(() => {
    loadJob();
  }, [fromJobId]);

  if (newJob === null) {
    return <LoadingIndicator />;
  }
  if (newJob instanceof Error) {
    return <ErrorAlert error={newJob} />;
  }

  return (
    <div>
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item active">Create New Job</li>
        </ol>
      </nav>
      <h2 className="display-4">New Job</h2>
      <ErrorAlert error={saveError} />
      <section>
        <h3 className="display-6">Parent Job Group</h3>
        <JobGroupAutosuggest defaultJobGroupId={jobGroupId} onChange={onChangeJobGroup} />
      </section>
      <JobForm job={newJob} onSave={onSaveJob} onCancel={onCancel} disabled={isSaving} />
    </div>
  );
};

export default withCurrentUser(JobCreate);