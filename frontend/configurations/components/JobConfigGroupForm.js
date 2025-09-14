import React, { useState } from 'react';
import { cloneDeep } from 'lodash';

import ParametersTable from '../../components/ParametersTable';
import { getJobConfigCategoriesByType } from '../../utils/constants';
import { sortCaseInsensitive } from '../../utils/utilities';

function createConfigGroupInput(configGroup) {
  const input = cloneDeep(configGroup);
  input.commitMessage = '';
  input.saveAsNewVersion = true;
  return input;
}

const JobConfigGroupForm = ({ jobConfigGroup, onSave, onCancel, disabled = false }) => {
  const [input, setInput] = useState(createConfigGroupInput(jobConfigGroup));

  function onChangeProperty(name, event) {
    const value = event.target.value;
    setInput(prevState => {
      const newInput = cloneDeep(prevState);
      newInput[name] = value;
      return newInput;
    });
  }

  function onChangeParameters(parameters) {
    setInput(prevState => Object.assign({}, prevState, { parameters }));
  }

  function onChangeSaveAsNewVersion(saveAsNewVersion) {
    setInput(prevState => Object.assign({}, prevState, { saveAsNewVersion }));
  }

  function handleSave(event) {
    event.preventDefault();
    const inputCopy = cloneDeep(input);
    delete inputCopy.versionInfo;
    onSave(inputCopy);
  }

  function handleCancel() {
    onCancel();
  }

  const categoriesByType = getJobConfigCategoriesByType();
  const categoryValues = sortCaseInsensitive(
    categoriesByType.functional.concat(categoriesByType.technical),
  );

  // NOTE: Do NOT add `onSubmit` on the HTML form. This is to prevent user from accidentally
  // saving the job config group by hitting the Return button (this may often happen when user
  // is editing the pending parameter).
  return (
    <form className="my-2">
      <fieldset disabled={disabled}>
        <section>
          <h3 className="display-6">Basic Information</h3>
          <div className="row">
            <div className="col">
              <div className="form-group">
                <label htmlFor="job-config-group-name">Name</label>
                <input 
                  id="job-config-group-name" 
                  className="form-control" 
                  type="text" 
                  value={input.name} 
                  onChange={event => onChangeProperty('name', event)} 
                />
              </div>
            </div>
            <div className="col">
              <div className="form-group">
                <label htmlFor="job-config-group-category">Category</label>
                <select
                  id="job-config-group-category"
                  className="form-control"
                  value={input.category || ''}
                  onChange={event => onChangeProperty('category', event)}
                >
                  <option value="">----</option>
                  {categoryValues.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="job-config-group-description">Description</label>
            <input 
              id="job-config-group-description" 
              className="form-control" 
              type="text" 
              value={input.description || ''} 
              onChange={event => onChangeProperty('description', event)} 
            />
          </div>
        </section>
        <section>
          <h3 className="display-6">Parameters</h3>
          <ParametersTable parameters={input.parameters} onChange={onChangeParameters} />
        </section>
        <section>
          <h3 className="display-6">Save option</h3>
          <div className="form-group">
            <label htmlFor="commitMessage">Commit message</label>
            <input 
              id="commitMessage" 
              className="form-control" 
              type="text" 
              value={input.commitMessage || ''} 
              placeholder="Brief description of this change" 
              onChange={event => onChangeProperty('commitMessage', event)} 
            />
          </div>
          <div className="form-group">
            <div className="form-check">
              <input 
                id="saveAsNewVersion" 
                className="form-check-input" 
                name="saveOption" 
                type="radio" 
                checked={input.saveAsNewVersion} 
                onChange={() => onChangeSaveAsNewVersion(true)} 
              />
              <label htmlFor="saveAsNewVersion" className="form-check-label">
                Save as a new version
              </label>
            </div>
          </div>
        </section>
        <div className="form-group">
          <ul className="list-inline">
            <li className="list-inline-item">
              <button
                className="btn btn-primary"
                type="button"
                onClick={handleSave}
              >
                Save
              </button>
            </li>
            <li className="list-inline-item">
              <button
                className="btn btn-secondary"
                type="button"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </li>
          </ul>
        </div>
      </fieldset>
    </form>
  );
};

export default JobConfigGroupForm;