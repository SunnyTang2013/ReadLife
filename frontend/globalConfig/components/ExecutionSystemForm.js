import React, { useState } from 'react';
import { cloneDeep } from 'lodash';

import { getExecutionSystemTypeList } from '../../utils/constants';

const ExecutionSystemForm = ({ executionSystem: initialExecutionSystem, onSave, onCancel, disabled = false }) => {
  const executionSystem = cloneDeep(initialExecutionSystem);
  executionSystem.password = '';
  const [formExecutionSystem, setFormExecutionSystem] = useState(executionSystem);

  function onChangeProperty(name, event) {
    const value = event.target.value;
    setFormExecutionSystem((prevState) => {
      const updatedExecutionSystem = cloneDeep(prevState);
      updatedExecutionSystem[name] = value;
      return updatedExecutionSystem;
    });
  }

  function onSubmit(event) {
    event.preventDefault();
    onSave(formExecutionSystem);
  }

  function handleCancel() {
    onCancel();
  }

  const typeList = getExecutionSystemTypeList();
  const $typeOptions = typeList.sort().map(type => 
    <option key={type} value={type}>{type}</option>
  );

  return React.createElement('form', { className: 'my-2', onSubmit: onSubmit },
    React.createElement('fieldset', { disabled: disabled },
      React.createElement('div', { className: 'form-group' },
        React.createElement('label', { htmlFor: 'execution-system-name' }, 'Name'),
        <input id="execution-system-name" className="form-control" type="text" value={formExecutionSystem.name} onChange={event => onChangeProperty('name'} event) />
      ),
      React.createElement('div', { className: 'form-group' },
        React.createElement('label', { htmlFor: 'execution-system-base-url' }, 'VS Base URL'),
        <input id="execution-system-base-url" className="form-control" type="text" value={formExecutionSystem.baseUrl} onChange={event => onChangeProperty('baseUrl'} event) />
      ),
      React.createElement('div', { className: 'form-group' },
        React.createElement('label', { htmlFor: 'execution-system-type' }, 'Type'),
        React.createElement('select', {
          id: 'execution-system-type',
          className: 'form-control',
          value: formExecutionSystem.type ? `${formExecutionSystem.type}` : '',
          onChange: event => onChangeProperty('type', event)
        },
          <option value="">----</option>,
          ...$typeOptions
        )
      ),
      React.createElement('div', { className: 'form-group' },
        React.createElement('label', { htmlFor: 'execution-system-max-running' }, 'Max Running Jobs Limitation'),
        <input id="execution-system-max-running" className="form-control" type="text" value={formExecutionSystem.maxRunning} onChange={event => onChangeProperty('maxRunning'} event) />
      ),
      React.createElement('div', { className: 'form-group' },
        React.createElement('button', { className: 'btn btn-primary mr-2', type: 'submit' }, 'Save'),
        <button className="btn btn-secondary mr-2" type="button" onClick={handleCancel}>Cancel</button>
      )
    )
  );
};

export default ExecutionSystemForm;