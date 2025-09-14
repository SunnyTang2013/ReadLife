import React, { useState, useEffect } from 'react';
import { cloneDeep } from 'lodash';
import { toast } from 'react-toastify';

import jobContextService from '../../backend/jobContextService';
import ScorchPropTypes from '../../proptypes/scorch';
import { sortCaseInsensitive } from '../../utils/utilities';
import ParametersTable from '../../components/ParametersTable';
import JobConfigGroupsBlock from '../../components/JobConfigGroupsBlock';

import { getExecutionSystemTypeList, getLocationRegionList } from '../../utils/constants';
import Alert from '../../components/Alert';

function createJobInput(job) {
  return Object.assign({}, job, {
    contextId: job.context ? job.context.id : null,
    configGroupIds: job.configGroups.map(item => item.id),
  });
}

const JobForm = ({ job, onSave, onCancel, disabled = false }) => {
  const [input, setInput] = useState(createJobInput(job));
  const [jobContextList, setJobContextList] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    _loadJobContextList();
  }, []);

  const onChangeJobProperty = (name, event) => {
    let value = event.target.value;
    if (name === 'priority') {
      value = Number(value);
    }
    setInput((prevInput) => {
      const newInput = cloneDeep(prevInput);
      newInput[name] = value;
      return newInput;
    });
  };

  const onChangeLocation = (event) => {
    const location = event.target.value;
    setInput((prevInput) => {
      return Object.assign({}, prevInput, { location });
    });
  };

  const onChangeContext = (event) => {
    const value = event.target.value;
    setInput((prevInput) => {
      const newInput = cloneDeep(prevInput);
      const contextId = Number(value);
      if (!Number.isNaN(contextId) && contextId > 0) {
        newInput.context = jobContextList.find(item => item.id === contextId);
        newInput.contextId = contextId;
      } else {
        newInput.context = null;
        newInput.contextId = null;
      }
      return newInput;
    });
  };

  const onChangeJobConfigGroups = (jobConfigGroups) => {
    setInput((prevInput) => {
      const newInput = cloneDeep(prevInput);
      newInput.configGroups = jobConfigGroups;
      newInput.configGroupIds = jobConfigGroups.map(item => item.id);
      return newInput;
    });
  };

  const onChangeJobVariables = (variables) => {
    setInput((prevInput) => {
      const newInput = cloneDeep(prevInput);
      newInput.variables = variables;
      return newInput;
    });
  };

  const onSaveClick = (event) => {
    event.preventDefault();
    // Drop off context and config groups from job input.
    const submitInput = cloneDeep(input);
    delete submitInput.context;
    delete submitInput.configGroups;
    if (submitInput.type === 'VS' && (!submitInput.jobConsumer || !submitInput.jobScope)) {
      toast.error('Please full fill job scope and job consumer field.');
      setErrorMessage('Please full fill job scope and job consumer field.');
      return;
    }
    setErrorMessage(null);
    onSave(submitInput);
  };

  const onCancelClick = (event) => {
    event.preventDefault();
    onCancel && onCancel(event);
  };

  const onChangeJobScope = (event) => {
    const jobScope = event.target.value;
    setInput((prevInput) => {
      return Object.assign({}, prevInput, { jobScope });
    });
  };

  const onChangeJobConsumer = (event) => {
    let opt;
    let jobConsumer = '';
    const len = event.target.options.length;
    for (let i = 0; i < len; i++) {
      opt = event.target.options[i];
      if (opt.selected) {
        jobConsumer = `${jobConsumer + opt.value},`;
      }
    }
    jobConsumer = jobConsumer.substring(0, jobConsumer.length - 1);
    setInput((prevInput) => {
      return Object.assign({}, prevInput, { jobConsumer });
    });
  };

  const _loadJobContextList = () => {
    console.log('Loading job context list...');
    jobContextService.getJobContextList()
      .then((jobContextList) => {
        setJobContextList(jobContextList);
      })
      .catch((error) => {
        console.log(`Fail to load job context list: ${error}`);
        setJobContextList([]);
      });
  };

  const typeList = getExecutionSystemTypeList();
  const $typeOptions = typeList.map(type =>
    <option key={type} value={type}>{type}</option>
  );

  const $locationOptions = getLocationRegionList().map(([location, region]) =>
    <option key={`location-${location}`} value={location}>
      {`${region} / ${location}`}
    </option>
  );

  const $jobContextOptions = sortCaseInsensitive(jobContextList, jobContext => jobContext.name)
    .map(jobContext =>
      <option key={`job-context-${jobContext.id}`} value={`${jobContext.id}`}>
        {`${jobContext.name} (#${jobContext.id})`}
      </option>
    );

  // NOTE: Do NOT add `onSubmit` on the HTML form. This is to prevent user from accidentally
  // saving the job by hitting the Return button (this may often happen when user selects the
  // job config group in the autosuggest input using only keyboard).
  return (
    <form className="my-2">
      <fieldset disabled={disabled}>
        <section>
          <h3 className="display-6">Job Info</h3>
          {errorMessage && <Alert type="warning" text={errorMessage} />}
          <div className="form-group">
            <label htmlFor="job-name">Job Name</label>
            <input 
              id="job-name" 
              className="form-control" 
              type="text" 
              value={input.name || ''} 
              onChange={event => onChangeJobProperty('name', event)} 
            />
          </div>
          <div className="form-group">
            <label htmlFor="job-description">Description</label>
            <input 
              id="job-description" 
              className="form-control" 
              type="text" 
              value={input.description || ''} 
              onChange={event => onChangeJobProperty('description', event)} 
            />
          </div>
          <div className="row">
            <div className="col">
              <div className="form-group">
                <label htmlFor="job-type">Type</label>
                <select
                  id="job-type"
                  className="form-control"
                  value={input.type || ''}
                  onChange={event => onChangeJobProperty('type', event)}
                >
                  <option value="">----</option>
                  {$typeOptions}
                </select>
              </div>
            </div>
            <div className="col">
              <div className="form-group">
                <label htmlFor="job-priority">Priority</label>
                <input 
                  id="job-priority" 
                  className="form-control" 
                  type="number" 
                  value={String(input.priority)} 
                  onChange={event => onChangeJobProperty('priority', event)} 
                />
              </div>
            </div>
            <div className="col">
              <div className="form-group">
                <label htmlFor="location">Location</label>
                <select
                  id="location"
                  className="form-control"
                  value={input.location || ''}
                  onChange={onChangeLocation}
                >
                  <option value="">----</option>
                  {$locationOptions}
                </select>
              </div>
            </div>
            <div className="col">
              <div className="form-group">
                <label htmlFor="Job scope">Job scope</label>
                <select
                  id="Job scope"
                  className="form-control"
                  value={input.jobScope || ''}
                  onChange={onChangeJobScope}
                >
                  <option value="">----</option>
                  <option value="SRP">SRP</option>
                  <option value="Flow">Flow</option>
                  <option value="MRUD">MRUD</option>
                  <option value="CEM">CEM</option>
                  <option value="Compression">Compression</option>
                  <option value="Repo">Repo</option>
                  <option value="Risky Bond">Risky Bond</option>
                  <option value="PC-specific">PC-specific</option>
                  <option value="MKTY">MKTY</option>
                  <option value="VaR">VaR</option>
                </select>
              </div>
            </div>
            <div className="col">
              <div className="form-group">
                <label htmlFor="Job Consumer">Job Consumer</label>
                <select
                  id="Job Consumer"
                  className="form-control"
                  onChange={onChangeJobConsumer}
                  multiple={true}
                >
                  <option value="">----</option>
                  <option value="FO" selected={input.jobConsumer && input.jobConsumer.indexOf('FO') > -1}>FO</option>
                  <option value="TR" selected={input.jobConsumer && input.jobConsumer.indexOf('TR') > -1}>TR</option>
                  <option value="PC" selected={input.jobConsumer && input.jobConsumer.indexOf('PC') > -1}>PC</option>
                  <option value="Collateral" selected={input.jobConsumer && input.jobConsumer.indexOf('Collateral') > -1}>Collateral</option>
                  <option value="BondPrice" selected={input.jobConsumer && input.jobConsumer.indexOf('BondPrice') > -1}>BondPrice</option>
                  <option value="Credit_Risks" selected={input.jobConsumer && input.jobConsumer.indexOf('Credit_Risks') > -1}>Credit_Risks</option>
                </select>
              </div>
            </div>
          </div>
        </section>
        <section>
          <h3 className="display-6">Job Context</h3>
          <div className="form-group">
            <select
              className="form-control"
              value={input.contextId || ''}
              onChange={onChangeContext}
            >
              <option value="">----</option>
              {$jobContextOptions}
            </select>
          </div>
        </section>
        <section>
          <h3 className="display-6">Configuration Groups</h3>
          <JobConfigGroupsBlock 
            categoryType="functional" 
            jobConfigGroups={input.configGroups} 
            onChange={onChangeJobConfigGroups} 
          />
        </section>
        <section>
          <h3 className="display-6">Job Variables</h3>
          <ParametersTable 
            parameters={input.variables} 
            onChange={onChangeJobVariables} 
          />
        </section>
        <div className="form-group">
          <button
            className="btn btn-primary mr-2"
            type="button"
            onClick={onSaveClick}
          >
            Save
          </button>
          <button 
            className="btn btn-secondary" 
            type="button" 
            onClick={onCancelClick}
          >
            Cancel and Go Back
          </button>
        </div>
      </fieldset>
    </form>
  );
};

export default JobForm;