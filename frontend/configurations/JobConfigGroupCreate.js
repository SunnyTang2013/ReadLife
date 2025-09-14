import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PropTypes from 'prop-types';

import configurations from '../backend/configurations';
import RouterPropTypes from '../proptypes/router';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';

import JobConfigGroupForm from './components/JobConfigGroupForm';

const JobConfigGroupCreate = () => {
  const [jobConfigGroup, setJobConfigGroup] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const navigate = useNavigate();
  const { fromConfigGroupId } = useParams();

  useEffect(() => {
    loadJobConfigGroup();
  }, [fromConfigGroupId]);

  function onSave(jobConfigGroup) {
    setIsSaving(true);
    configurations.createJobConfigGroup(jobConfigGroup)
      .then((configGroup) => {
        navigate(`/job-config-group/detail/${configGroup.id}`, { replace: true });
      })
      .catch((error) => {
        setIsSaving(false);
        setSaveError(error);
      });
  }

  function onCancel() {
    navigate('/job-config-group/list');
  }

  function loadJobConfigGroup() {
    if (!fromConfigGroupId) {
      setJobConfigGroup({
        id: null,
        name: '',
        category: '',
        description: '',
        parameters: {
          entries: {},
        },
      });
      setIsSaving(false);
      setSaveError(null);
      return;
    }

    console.log(`Loading reference config group #${fromConfigGroupId} ...`);
    configurations.getJobConfigGroup(fromConfigGroupId)
      .then((fromConfigGroup) => {
        setJobConfigGroup(Object.assign({}, fromConfigGroup, {
          id: null,
          name: '',
          description: '',
          jobCount: 0,
          createTime: null,
          updateTime: null,
        }));
        setIsSaving(false);
        setSaveError(null);
      })
      .catch((error) => {
        setJobConfigGroup(error);
        setIsSaving(false);
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
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/">Configurations</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/job-config-group/list">Job Config Groups</Link>
          </li>
          <li className="breadcrumb-item active">New Job Config Group</li>
        </ol>
      </nav>
      <h2 className="display-4">Create a New Job Config Group</h2>
      <ErrorAlert error={saveError} />
      <JobConfigGroupForm 
        jobConfigGroup={jobConfigGroup} 
        onSave={onSave} 
        onCancel={onCancel} 
        disabled={isSaving} 
      />
    </div>
  );
};

export default JobConfigGroupCreate;
