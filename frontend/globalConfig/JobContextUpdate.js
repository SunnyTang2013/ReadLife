import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

import globalConfig from '../backend/globalConfig';
import jobContextService from '../backend/jobContextService';

import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';

import JobContextForm from './components/JobContextForm';

const JobContextUpdate = () => {
  const { jobContextId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  function onSave(jobContext) {
    setIsSaving(true);
    jobContextService.updateJobContext(jobContext)
      .then(() => {
        navigate(`/job-context/detail/${jobContext.id}`);
      })
      .catch((error) => {
        setIsSaving(false);
        setSaveError(error);
      });
  }

  function onCancel() {
    navigate(`/job-context/detail/${jobContextId}`);
  }

  function loadData() {
    console.log(`Loading job context #${jobContextId} and execution system list ...`);
    const jobContextPromise = jobContextService.getJobContext(jobContextId);
    const executionSystemListPromise = globalConfig.getExecutionSystemList();
    Promise.all([jobContextPromise, executionSystemListPromise])
      .then(([jobContext, executionSystemList]) => {
        setData({ jobContext, executionSystemList });
        setIsSaving(false);
        setSaveError(null);
      })
      .catch((error) => {
        setData(error);
        setIsSaving(false);
        setSaveError(null);
      });
  }

  if (data === null) {
    return <LoadingIndicator />;
  }
  if (data instanceof Error) {
    return <ErrorAlert error={data} />;
  }

  const { jobContext, executionSystemList } = data;
  return React.createElement('div', null,
    React.createElement('nav', null,
      React.createElement('ol', { className: 'breadcrumb' },
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: '/' }, 'Global Configurations')
        ),
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: '/job-context/list' }, 'Job Contexts')
        ),
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: `/job-context/detail/${jobContext.id}` }, jobContext.name)
        ),
        <li className="breadcrumb-item active">Update Job Context</li>
      )
    ),
    <h2 className="display-4">{`Update: ${jobContext.name}`}</h2>,
    <ErrorAlert error={saveError} />,
    <JobContextForm jobContext={jobContext} executionSystemList={executionSystemList} onSave={onSave} onCancel={onCancel} disabled={isSaving} />
  );
};

export default JobContextUpdate;