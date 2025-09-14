import React, { useState, useCallback } from 'react';
import ReleaseStatics from './ReleaseStatics';
import JobHierarchyAutosuggest from './JobHierarchyAutosuggest';

const getHiddenObject = (action) => {
  let hiddenObject = null;
  switch (action) {
    case ReleaseStatics.ACTION_CREATE_OR_UPDATE:
      hiddenObject = {
        firstGroupFieldName: 'Parent Group',
        firstGroupHidden: false,
        secondGroupFieldName: 'Create Child Group',
      };
      break;
    case ReleaseStatics.ACTION_MOVE:
      hiddenObject = {
        firstGroupFieldName: 'Move To',
        firstGroupHidden: false,
        secondGroupFieldName: 'Move Hierarchy',
      };
      break;
    case ReleaseStatics.ACTION_DELETE:
      hiddenObject = {
        firstGroupFieldName: 'First Group',
        firstGroupHidden: true,
        secondGroupFieldName: 'Group',
      };
      break;
    default:
      break;
  }
  return hiddenObject;
};

const ReleaseJobHierarchy = ({ onChange, jiraKey }) => {
  const [action, setAction] = useState(ReleaseStatics.ACTION_CREATE_OR_UPDATE);
  const [firstJobGroup, setFirstJobGroup] = useState(null);
  const [firstGroupCanBeEmpty] = useState(true);
  const [secondJobGroup, setSecondJobGroup] = useState(null);
  const [jiraKeyValue, setJiraKeyValue] = useState(null);

  const onChangeAction = useCallback((event) => {
    const newAction = event.target.value;
    setAction(newAction);
  }, []);

  const onChangeFirstJobGroup = useCallback((jobGroupSelection) => {
    setFirstJobGroup(jobGroupSelection);
  }, []);

  const onChangeSecondJobGroup = useCallback((jobGroupSelection) => {
    setSecondJobGroup(jobGroupSelection);
  }, []);

  const onAdd = useCallback(() => {
    const newValue = { firstJobGroup, secondJobGroup, action, jiraKey: jiraKeyValue };
    onChange(newValue);
  }, [firstJobGroup, secondJobGroup, action, jiraKeyValue, onChange]);

  const onChangeJiraKey = useCallback((event) => {
    const value = event.target.value;
    setJiraKeyValue(value);
    jiraKey(value);
  }, [jiraKey]);

  const hiddenObject = getHiddenObject(action);

  return (
    <div>
      <div className="list-group-item">
        <div className="row">
          <label htmlFor="select-type" className="col-sm-2 col-form-label">Action</label>
          <div className="col-sm-5">
            <select 
              id="select-action" 
              className="form-control" 
              onChange={onChangeAction} 
              value={action}
            >
              <option value={ReleaseStatics.ACTION_CREATE_OR_UPDATE}>CREATE/UPDATE</option>
              <option value={ReleaseStatics.ACTION_MOVE}>MOVE</option>
            </select>
          </div>
        </div>
      </div>
      <div className="list-group-item">
        <div className="form-group">
          <div 
            className="form-group row" 
            hidden={hiddenObject.firstGroupHidden}
          >
            <label 
              htmlFor="inputGroup" 
              className="col-sm-2 col-form-label"
            >
              {hiddenObject.firstGroupFieldName}
            </label>
            <div className="col-sm-5">
              <JobHierarchyAutosuggest 
                canBeEmpty={firstGroupCanBeEmpty} 
                onChange={onChangeFirstJobGroup} 
              />
            </div>
          </div>
          <div className="form-group row">
            <label 
              htmlFor="inputGroup" 
              className="col-sm-2 col-form-label"
            >
              {hiddenObject.secondGroupFieldName}
            </label>
            <div className="col-sm-5">
              <JobHierarchyAutosuggest onChange={onChangeSecondJobGroup} />
            </div>
          </div>
        </div>
        <div className="form-group row">
          <label htmlFor="jira-id" className="col-sm-2 col-form-label">JIRA ID</label>
          <div className="col-sm-3">
            <input 
              id="jira-id" 
              className="form-control" 
              onChange={onChangeJiraKey} 
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

export default ReleaseJobHierarchy;