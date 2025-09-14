import React, { useState, useEffect, useRef, useCallback } from 'react';
import jobGroupService from '../../backend/jobGroupService';
import ReleaseStatics from './ReleaseStatics';
import jobContextService from '../../backend/jobContextService';
import ReleaseJobHierarchy from './ReleaseJobHierarchy';
import ReleaseJobs from './ReleaseJobs';
import ReleaseJobContext from './ReleaseJobContext';
import BatchAutosuggest from './BatchAutosuggest';
import JobConfigGroupsAutosuggest from './JobConfigGroupsAutosuggest';

const ReleaseActionTypes = ({ 
  onJobGroup, 
  onChangeStatus, 
  onAddJob, 
  onAddJobContext, 
  onAddBatch, 
  hiddenAction, 
  onAddJobConfigGroup, 
  jiraKey 
}) => {
  const [type, setType] = useState(ReleaseStatics.TYPE_ADD_JOB_GROUP);
  const [jiraKeyValue, setJiraKeyValue] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    loadList();
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const onChangeType = useCallback((event) => {
    const newType = event.target.value;
    setType(newType);
  }, []);

  const onRefreshHierarchy = useCallback((event) => {
    event.preventDefault();
    onChangeStatus(true);
    jobGroupService.getJobGroupList()
      .then((jobGroupList) => {
        if (isMountedRef.current) {
          ReleaseStatics.JobGroupList = jobGroupList;
          onChangeStatus(false);
        }
      })
      .catch((error) => {
        ReleaseStatics.JobGroupList = error;
      });
  }, [onChangeStatus]);

  const setJiraKey = useCallback((key) => {
    setJiraKeyValue(key);
    jiraKey(key);
  }, [jiraKey]);

  const loadList = useCallback(() => {
    if (ReleaseStatics.JobGroupList && ReleaseStatics.JobGroupList.length > 0) {
      onChangeStatus(false);
    } else {
      jobGroupService.getJobGroupList()
        .then((jobGroupList) => {
          if (isMountedRef.current) {
            ReleaseStatics.JobGroupList = jobGroupList;
            onChangeStatus(false);
          }
        })
        .catch((error) => {
          ReleaseStatics.JobGroupList = error;
        });

      jobContextService.getJobContextList()
        .then((jobContextList) => {
          ReleaseStatics.JobContextList = jobContextList;
        })
        .catch((error) => {
          ReleaseStatics.JobContextList = error;
        });
    }
  }, [onChangeStatus]);

  console.log(jiraKeyValue);

  let typeBlock = null;
  if (type === ReleaseStatics.TYPE_ADD_JOB_GROUP) {
    typeBlock = <ReleaseJobHierarchy onChange={onJobGroup} jiraKey={setJiraKey} />;
  } else if (type === ReleaseStatics.TYPE_ADD_JOB) {
    typeBlock = <ReleaseJobs onAdd={onAddJob} jiraKey={setJiraKey} />;
  } else if (type === ReleaseStatics.TYPE_CONTEXT) {
    typeBlock = <ReleaseJobContext onChange={onAddJobContext} jiraKey={setJiraKey} />;
  } else if (type === ReleaseStatics.TYPE_CONFIGURATION) {
    typeBlock = <JobConfigGroupsAutosuggest onAdd={onAddJobConfigGroup} jiraKey={setJiraKey} />;
  } else if (type === ReleaseStatics.TYPE_BATCH) {
    typeBlock = <BatchAutosuggest onAdd={onAddBatch} jiraKey={setJiraKey} />;
  } else {
    typeBlock = (
      <div className="alert alert-warning my-2">
        <i className="fa fa-fw fa-exclamation-triangle mr-1" />
        Unknown type..
      </div>
    );
  }

  return (
    <div className="card mb-3" hidden={hiddenAction}>
      <div className="list-group-item">
        <div className="row">
          <label htmlFor="select-type" className="col-sm-2 col-form-label">Type</label>
          <div className="col-sm-5 mr-2">
            <select 
              id="select-type" 
              className="form-control" 
              onChange={onChangeType} 
              value={type}
            >
              <option value={ReleaseStatics.TYPE_ADD_JOB_GROUP}>Hierarchy</option>
              <option value={ReleaseStatics.TYPE_ADD_JOB}>Job</option>
              <option value={ReleaseStatics.TYPE_CONTEXT}>Context</option>
              <option value={ReleaseStatics.TYPE_CONFIGURATION}>Configuration Group</option>
              <option value={ReleaseStatics.TYPE_BATCH}>Batch</option>
            </select>
          </div>
          <div className="col-sm-2">
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={onRefreshHierarchy}
            >
              Refresh Hierarchy
            </button>
          </div>
        </div>
      </div>
      <div className="card-body" style={{ padding: 'initial' }}>
        {typeBlock}
      </div>
    </div>
  );
};

// Static properties
ReleaseActionTypes.ADD_JOB_GROUP = 'addJobGroup';
ReleaseActionTypes.ADD_BATCH_JOB = 'addBatchJob';
ReleaseActionTypes.ADD_SINGLE_JOB = 'addSingleJob';

export default ReleaseActionTypes;