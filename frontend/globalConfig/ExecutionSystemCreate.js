import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import globalConfig from '../backend/globalConfig';
import ErrorAlert from '../components/ErrorAlert';

import ExecutionSystemForm from './components/ExecutionSystemForm';

const ExecutionSystemCreate = () => {
  const navigate = useNavigate();
  const [executionSystem, setExecutionSystem] = useState({
    name: '',
    baseUrl: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  function onSave(executionSystem) {
    setIsSaving(true);
    globalConfig.createExecutionSystem(executionSystem)
      .then(() => {
        navigate('/execution-system/list');
      })
      .catch((error) => {
        setIsSaving(false);
        setSaveError(error);
      });
  }

  function onCancel() {
    navigate('/execution-system/list');
  }

  return React.createElement('div', null,
    React.createElement('nav', null,
      React.createElement('ol', { className: 'breadcrumb' },
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: '/' }, 'Global Configurations')
        ),
        <li className="breadcrumb-item active">New Execution System</li>
      )
    ),
    <h2 className="display-4">Create a New Execution System</h2>,
    <ErrorAlert error={saveError} />,
    <ExecutionSystemForm executionSystem={executionSystem} onSave={onSave} onCancel={onCancel} disabled={isSaving} />
  );
};

export default ExecutionSystemCreate;