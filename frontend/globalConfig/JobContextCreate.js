import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

import globalConfig from '../backend/globalConfig';
import jobContextService from '../backend/jobContextService';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';

import JobContextForm from './components/JobContextForm';

const JobContextCreate = () => {
  const { fromJobContextId } = useParams();
  const navigate = useNavigate();
  const [jobContext, setJobContext] = useState({
    name: '',
    executionSystem: null,
    configGroups: [],
  });
  const [executionSystemList, setExecutionSystemList] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (!fromJobContextId) {
      loadExecutionSystemList();
    } else {
      loadJobContext();
    }
  }, [fromJobContextId]);

  function onSave(jobContext) {
    setIsSaving(true);
    jobContextService.createJobContext(jobContext)
      .then((summary) => {
        navigate(`/job-context/detail/${summary.id}`, { replace: true });
      })
      .catch((error) => {
        setIsSaving(false);
        setSaveError(error);
      });
  }

  function onCancel() {
    navigate('/job-context/list');
  }

  function loadExecutionSystemList() {
    console.log('Loading execution system list...');
    globalConfig.getExecutionSystemList()
      .then((executionSystemList) => {
        setExecutionSystemList(executionSystemList);
      })
      .catch((error) => {
        setExecutionSystemList(error);
      });
  }

  function loadJobContext() {
    console.log(`Loading job context #${fromJobContextId} and execution system list ...`);
    const jobContextPromise = jobContextService.getJobContext(fromJobContextId);
    const executionSystemListPromise = globalConfig.getExecutionSystemList();
    Promise.all([jobContextPromise, executionSystemListPromise])
      .then(([jobContext, executionSystemList]) => {
        setJobContext(Object.assign({}, jobContext, {
          id: null,
          name: '',
          createTime: null,
          updateTime: null,
        }));
        setExecutionSystemList(executionSystemList);
        setIsSaving(false);
        setSaveError(null);
      })
      .catch((error) => {
        setJobContext(error);
        setExecutionSystemList(error);
        setIsSaving(false);
        setSaveError(null);
      });
  }

  if (executionSystemList === null) {
    return <LoadingIndicator />;
  }
  if (executionSystemList instanceof Error) {
    return <ErrorAlert error={executionSystemList} />;
  }

  return React.createElement('div', null,
    React.createElement('nav', null,
      React.createElement('ol', { className: 'breadcrumb' },
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: '/' }, 'Global Configurations')
        ),
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: '/job-context/list' }, 'Job Contexts')
        ),
        <li className="breadcrumb-item active">New Job Context</li>
      )
    ),
    <h2 className="display-4">Create a New Job Context</h2>,
    <ErrorAlert error={saveError} />,
    <JobContextForm jobContext={jobContext} executionSystemList={executionSystemList} onSave={onSave} onCancel={onCancel} disabled={isSaving} />
  );
};

export default JobContextCreate;