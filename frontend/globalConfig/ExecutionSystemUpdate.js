import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

import globalConfig from '../backend/globalConfig';

import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';

import ExecutionSystemForm from './components/ExecutionSystemForm';

const ExecutionSystemUpdate = () => {
  const { executionSystemId } = useParams();
  const navigate = useNavigate();
  const [executionSystem, setExecutionSystem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    loadExecutionSystem();
  }, []);

  function onSave(executionSystem) {
    setIsSaving(true);
    globalConfig.updateExecutionSystem(executionSystem)
      .then(() => {
        navigate(`/execution-system/detail/${executionSystem.id}`);
      })
      .catch((error) => {
        setIsSaving(false);
        setSaveError(error);
      });
  }

  function onCancel() {
    navigate(`/execution-system/detail/${executionSystemId}`);
  }

  function loadExecutionSystem() {
    console.log(`Loading execution system #${executionSystemId} ...`);
    globalConfig.getExecutionSystem(executionSystemId)
      .then((executionSystem) => {
        setExecutionSystem(executionSystem);
        setIsSaving(false);
        setSaveError(null);
      })
      .catch((error) => {
        setExecutionSystem(error);
        setIsSaving(false);
        setSaveError(null);
      });
  }

  if (executionSystem === null) {
    return <LoadingIndicator />;
  }
  if (executionSystem instanceof Error) {
    return <ErrorAlert error={executionSystem} />;
  }

  return React.createElement('div', null,
    React.createElement('nav', null,
      React.createElement('ol', { className: 'breadcrumb' },
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: '/' }, 'Global Configurations')
        ),
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: '/execution-system/list' }, 'Execution Systems')
        ),
        <li className="breadcrumb-item active">{executionSystem.name}</li>
      )
    ),
    <h2 className="display-4">{`Update: ${executionSystem.name}`}</h2>,
    <ErrorAlert error={saveError} />,
    <ExecutionSystemForm executionSystem={executionSystem} onSave={onSave} onCancel={onCancel} disabled={isSaving} />
  );
};

export default ExecutionSystemUpdate;