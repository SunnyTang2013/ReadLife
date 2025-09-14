import React, { useState } from 'react';
import { cloneDeep } from 'lodash';

import JobConfigGroupsBlock from '../../components/JobConfigGroupsBlock';

function createJobContextInput(jobContext) {
  return Object.assign({}, jobContext, {
    configGroupIds: jobContext.configGroups.map(item => item.id),
  });
}

const JobContextForm = ({ jobContext, executionSystemList, onSave, onCancel, disabled = false }) => {
  const [input, setInput] = useState(createJobContextInput(jobContext));

  function onChangeName(event) {
    const name = event.target.value;
    setInput((prevState) => {
      const updatedInput = cloneDeep(prevState);
      updatedInput.name = name;
      return updatedInput;
    });
  }

  function onChangeExecutionSystem(event) {
    const selected = executionSystemList.find(item => item.name === event.target.value);
    setInput((prevState) => {
      const updatedInput = cloneDeep(prevState);
      updatedInput.executionSystem = selected;
      return updatedInput;
    });
  }

  function onChangeJobConfigGroups(jobConfigGroups) {
    setInput((prevState) => {
      const updatedInput = cloneDeep(prevState);
      updatedInput.configGroups = jobConfigGroups;
      updatedInput.configGroupIds = jobConfigGroups.map(item => item.id);
      return updatedInput;
    });
  }

  function onSubmit(event) {
    event.preventDefault();
    const submitInput = cloneDeep(input);
    delete submitInput.configGroups;
    onSave(submitInput);
  }

  function handleCancel() {
    onCancel();
  }

  const executionSystemValue = input.executionSystem ? input.executionSystem.name : '';
  const $executionSystemOptions = executionSystemList.map(executionSystem => 
    <option key={executionSystem.id} value={executionSystem.name}>{executionSystem.name}</option>
  );
  $executionSystemOptions.unshift(
    <option key="" value="">----</option>
  );

  return React.createElement('form', { className: 'my-2', onSubmit: onSubmit },
    React.createElement('fieldset', { disabled: disabled },
      React.createElement('section', null,
        React.createElement('h3', { className: 'display-6' }, 'Basic Information'),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', { htmlFor: 'name' }, 'Name'),
          <input id="name" className="form-control" type="text" placeholder="Name" value={input.name} onChange={onChangeName} />
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', { htmlFor: 'execution-system' }, 'Execution System'),
          <select id="execution-system" className="form-control" value={executionSystemValue} onChange={onChangeExecutionSystem}>{...$executionSystemOptions}</select>
        )
      ),
      React.createElement('section', null,
        React.createElement('h3', { className: 'display-6' }, 'Configuration Groups'),
        <JobConfigGroupsBlock categoryType="technical" jobConfigGroups={input.configGroups} onChange={onChangeJobConfigGroups} />
      ),
      React.createElement('div', { className: 'form-group' },
        React.createElement('button', { className: 'btn btn-primary mr-2', type: 'submit' }, 'Save'),
        <button className="btn btn-secondary mr-2" type="button" onClick={handleCancel}>Cancel</button>
      )
    )
  );
};

export default JobContextForm;