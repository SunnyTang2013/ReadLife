import React, { useState, useCallback } from 'react';
import ReleaseStatics from './ReleaseStatics';
import JobContextAutosuggest from './JobContextAutosuggest';

const ReleaseJobContext = ({ onChange, jiraKey }) => {
  const [action, setAction] = useState(ReleaseStatics.ACTION_CREATE_OR_UPDATE);
  const [jobContextName, setJobContextName] = useState(null);
  const [jiraKeyValue, setJiraKeyValue] = useState(null);

  const onChangeJobContext = useCallback((jobContextSelection) => {
    setJobContextName(jobContextSelection.name);
  }, []);

  const onAdd = useCallback(() => {
    const newValue = { jobContextName, action };
    onChange(newValue);
  }, [jobContextName, action, onChange]);

  const onChangeJiraKey = useCallback((event) => {
    const value = event.target.value;
    setJiraKeyValue(value);
    jiraKey(value);
  }, [jiraKey]);

  return (
    <div>
      <div className="list-group-item">
        <div className="form-group row">
          <label htmlFor="inputContext" className="col-sm-2 col-form-label">Context Name</label>
          <div className="col-sm-5">
            <JobContextAutosuggest onChange={onChangeJobContext} />
          </div>
        </div>
        <div className="form-group row">
          <label htmlFor="jira-id" className="col-sm-2 col-form-label">JIRA ID</label>
          <div className="col-sm-3">
            <input 
              id="jira-id" 
              className="form-control" 
              onChange={onChangeJiraKey} 
              value={jiraKeyValue || ''} 
              placeholder="JIRA ID if available" 
            />
          </div>
        </div>
        <div className="form-group row">
          <div className="col-sm-10">
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={onAdd}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReleaseJobContext;