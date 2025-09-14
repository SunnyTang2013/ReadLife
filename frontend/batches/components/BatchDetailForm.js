import React, { useState, useEffect, useCallback } from 'react';
import { cloneDeep } from 'lodash';
import Toggle from 'react-toggle';
import { toast } from 'react-toastify';

import ParametersTable from '../../components/ParametersTable';
import OriginalDefinitionBlock from './OriginalDefinitionBlock';
import JobSelector from './JobSelector';
import batchService from '../../backend/batchService';
import ValuesTable from '../../components/ValuesTable';

const BatchDetailForm = ({ batchDetail, onSave, onCancel, disabled = false }) => {
  const [input, setInput] = useState(cloneDeep(batchDetail));
  const [originalJobList, setOriginalJobList] = useState([]);
  const [runJobList, setRunJobList] = useState(cloneDeep(batchDetail.jobPlainInfos));
  const [loadingJobList, setLoadingJobList] = useState(false);

  const onChangeProperty = useCallback((name, event) => {
    const value = event.target.value;
    setInput((prevInput) => {
      const newInput = cloneDeep(prevInput);
      newInput[name] = value;
      return newInput;
    });
  }, []);

  const onChangeType = useCallback((batchType) => {
    setInput((prevInput) => ({
      ...prevInput,
      batchType
    }));
  }, []);

  const onChangeCategory = useCallback((category) => {
    setInput((prevInput) => ({
      ...prevInput,
      categoryName: category
    }));
  }, []);

  const onChangeOriginalId = useCallback((id, name) => {
    setInput((prevInput) => ({
      ...prevInput,
      typeId: id,
      batchTypeName: name
    }));
  }, []);

  const onChangeOverrideParameters = useCallback((overriddenParameters) => {
    setInput((prevInput) => ({
      ...prevInput,
      overriddenParameters
    }));
  }, []);

  const onChangeFilterParameters = useCallback((configGroupVariables) => {
    setInput((prevInput) => ({
      ...prevInput,
      configGroupVariables
    }));
  }, []);

  const onChangeRodParameters = useCallback((rodParameters) => {
    setInput((prevInput) => ({
      ...prevInput,
      rodParameters
    }));
  }, []);

  const onChangeActiveDirectoryGroups = useCallback((adGroups) => {
    setInput((prevInput) => ({
      ...prevInput,
      adGroups
    }));
  }, []);

  const onAddJobToRunList = useCallback((newRunJobList, newOriginalJobList) => {
    setRunJobList(newRunJobList);
    setOriginalJobList(newOriginalJobList);
  }, []);

  const onFilterJobs = useCallback((event) => {
    const openFilter = event.target.checked;
    setInput((prevInput) => ({
      ...prevInput,
      useStaticJobList: openFilter
    }));
  }, []);

  const onSearchJobs = useCallback(() => {
    const batchType = input.batchType;
    let filterOption = {};

    let jobContent = '';
    if (input.configGroupVariables && Object.keys(input.configGroupVariables.entries).length > 0) {
      const entries = input.configGroupVariables.entries;
      const params = Object.keys(entries);
      params.map(param => {
        jobContent = `${jobContent}&&"${param}":"${entries[param]}"`;
        return param;
      });
    }

    if (batchType === 'HIERARCHY') {
      filterOption = { 
        jobGroupId: input.typeId,
        jobName: input.containInJobName,
        notContainInJobName: input.notContainInJobName,
        jobContent: jobContent 
      };
    } else if (batchType === 'LABEL') {
      filterOption = {
        filterScope: 'Label',
        jobNameKeyword: input.batchTypeName,
        jobName: input.containInJobName,
        notContainInJobName: input.notContainInJobName,
        jobContent: jobContent,
      };
    } else if (batchType === 'CONTEXT') {
      filterOption = { 
        jobContextId: input.typeId,
        jobName: input.containInJobName,
        notContainInJobName: input.notContainInJobName,
        jobContent: jobContent 
      };
    } else if (batchType === 'CRITERIA') {
      filterOption = { searchCriteriaId: input.typeId };
    } else if (batchType === 'BATCH') {
      filterOption = { BatchId: input.typeId };
    } else if (batchType === 'FUNCTIONAL_CONFIG_GROUP') {
      filterOption = { configGroupId: input.typeId };
    }

    if (Object.keys(filterOption).length === 0) {
      return;
    }

    setLoadingJobList(true);
    batchService.findJobsByScope(filterOption)
      .then((jobList) => {
        setOriginalJobList(jobList);
        setLoadingJobList(false);
      })
      .catch((error) => {
        setLoadingJobList(false);
        setOriginalJobList(error);
      });
  }, [input]);


  const handleSave = useCallback((event) => {
    event.preventDefault();
    const inputCopy = cloneDeep(input);
    
    if (!inputCopy.useStaticJobList && (!inputCopy.batchType || !inputCopy.typeId)) {
      toast.error('Missing necessary configuration');
      return;
    }
    if (inputCopy.useStaticJobList && (runJobList.length === 0 || runJobList.length > 1000)) {
      toast.error('Batch is null or exceed maximum limitation');
      return;
    }

    if (inputCopy.name.length > 110) {
      toast.error('Batch name is too long, plaese use shorter one');
      return;
    }

    const batch = { ...inputCopy, jobPlainInfos: runJobList };

    if (batch.useStaticJobList) {
      delete batch.batchType;
      delete batch.typeId;
      delete batch.batchTypeName;
    } else {
      delete batch.jobPlainInfos;
    }

    if (batch.batchType === 'CRITERIA') {
      delete batch.containsJobName;
    }

    onSave(batch);
  }, [input, runJobList, onSave]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  const showFilterJobList = input.useStaticJobList ? {} : { display: 'none' };
  const showFilterByJobNameOption = (input.batchType === 'CRITERIA' || input.batchType === 'BATCH' || input.batchType === 'FUNCTIONAL_CONFIG_GROUP') ? { display: 'none' } : {};
  const showFilterByConfigGroupVariable = (input.batchType === 'BATCH' || input.batchType === 'FUNCTIONAL_CONFIG_GROUP') ? { display: 'none' } : {};

  return (
    <form className="my-2">
      <fieldset disabled={disabled}>
        <section className="mb-3">
          <h3 className="display-6">Basic Information</h3>
          <div className="row">
            <div className="form-group col-6">
              <label htmlFor="batch-detail-name">Name</label>
              <input 
                id="batch-detail-name" 
                className="form-control" 
                type="text" 
                value={input.name} 
                onChange={event => onChangeProperty('name', event)} 
              />
            </div>
            <div className="form-group col-6">
              <label htmlFor="batch-detail-entity">Entity</label>
              <input 
                id="batch-detail-entity" 
                className="form-control" 
                type="text" 
                value={input.entity || ''} 
                onChange={event => onChangeProperty('entity', event)} 
              />
            </div>
          </div>
          <div className="row">
            <div className="form-group col-12">
              <label htmlFor="batch-detail-description" className="col-form-label">
                Description
              </label>
              <input 
                id="batch-detail-description" 
                className="form-control" 
                type="text" 
                value={input.description || ''} 
                onChange={event => onChangeProperty('description', event)} 
              />
            </div>
          </div>
          <div className="form-group row">
            <label 
              htmlFor="open-batch-jobs-filter"
              className="col-1 col-form-label"
            >
              Static List
            </label>
            <div className="col-2" style={{ paddingTop: '7px' }}>
              <Toggle 
                id="cheese-status" 
                checked={input.useStaticJobList} 
                onChange={onFilterJobs} 
              />
            </div>
          </div>

          <OriginalDefinitionBlock 
            type={input.batchType} 
            batchTypeName={input.batchTypeName} 
            categoryName={input.categoryName} 
            onChangeType={onChangeType} 
            onChangeCategory={onChangeCategory} 
            onChangeOriginalId={onChangeOriginalId} 
            showFilterButton={input.useStaticJobList} 
          />

          <div className="row">
            <div className="form-group col-6">
              <label 
                htmlFor="contain-job-name"
                className="col-form-label"
                style={showFilterByJobNameOption}
              >
                Contain In Job Name
              </label>
              <div style={showFilterByJobNameOption}>
                <input 
                  id="contain-job-name" 
                  className="form-control" 
                  type="text" 
                  value={input.containInJobName || ''} 
                  onChange={event => onChangeProperty('containInJobName', event)} 
                />
              </div>
            </div>

            <div className="form-group col-6">
              <label 
                htmlFor="not-contain-job-name"
                className="col-form-label"
                style={showFilterByJobNameOption}
              >
                Not Contain In Job Name
              </label>
              <div style={showFilterByJobNameOption}>
                <input 
                  id="not-contain-job-name" 
                  className="form-control" 
                  type="text" 
                  value={input.notContainInJobName || ''} 
                  onChange={event => onChangeProperty('notContainInJobName', event)} 
                />
              </div>
            </div>
          </div>

          <section className="mb-3">
            <div>
              <h5>Active Directory Groups</h5>
              <ValuesTable 
                values={input.adGroups} 
                onChange={onChangeActiveDirectoryGroups} 
              />
            </div>
          </section>

          <section className="mb-3">
            <div style={showFilterByConfigGroupVariable}>
              <h5>Falcon parameters</h5>
              <ParametersTable 
                parameters={input.rodParameters || { entries: {} }}
                onChange={onChangeRodParameters}
              />
            </div>
          </section>

          <section className="mb-3">
            <div style={showFilterByConfigGroupVariable}>
              <h5>Contains Config Group Variables</h5>
              <ParametersTable 
                parameters={input.configGroupVariables} 
                onChange={onChangeFilterParameters} 
              />
            </div>
          </section>

          <div className="form-group row">
            <div className="col-2" style={showFilterJobList}>
              <button
                className="btn btn-outline-primary"
                type="button"
                onClick={onSearchJobs}
              >
                Search Jobs
              </button>
            </div>
          </div>
        </section>

        <section style={showFilterJobList} className="mb-3">
          <h3 className="display-6">Filter Jobs</h3>
          <JobSelector 
            originalJobList={originalJobList} 
            runJobList={runJobList} 
            loading={loadingJobList} 
            onAddJobToRunList={onAddJobToRunList} 
          />
        </section>

        <section className="mb-3">
          <h3 className="display-6">Override Parameters</h3>
          <ParametersTable 
            parameters={input.overriddenParameters} 
            onChange={onChangeOverrideParameters} 
          />
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

export default BatchDetailForm;