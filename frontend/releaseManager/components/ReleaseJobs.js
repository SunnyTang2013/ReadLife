import React, { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import jobs from '../../backend/jobs';
import ReleaseStatics from './ReleaseStatics';
import JobHierarchyAutosuggest from './JobHierarchyAutosuggest';
import JobAutosuggest from './JobAutosuggest';
import JobContextAutosuggest from './JobContextAutosuggest';

const getHiddenObject = (action) => {
  let hiddenObject = null;
  switch (action) {
    case ReleaseStatics.ACTION_CREATE_OR_UPDATE:
      hiddenObject = {
        firstGroupFieldName: 'Hierarchy (Choose jobs)',
        secondGroupFieldName: 'Target Hierarchy (Put jobs)',
        contextHidden: false,
        jobNameHidden: false,
      };
      break;
    case ReleaseStatics.ACTION_UPDATE_JOB_INFO:
      hiddenObject = {
        firstGroupFieldNameHidden: true,
        secondGroupFieldNameHidden: true,
        contextHidden: true,
        jobNameHidden: false,
      };
      break;
    case ReleaseStatics.ACTION_MOVE:
      hiddenObject = {
        firstGroupFieldName: 'Move Out',
        secondGroupFieldName: 'Move In',
        contextHidden: true,
        jobNameHidden: false,
      };
      break;
    case ReleaseStatics.ACTION_DELETE:
      hiddenObject = {
        firstGroupFieldName: 'Hierarchy',
        secondGroupFieldName: '',
        contextHidden: true,
        jobNameHidden: false,
      };
      break;
    default:
      break;
  }
  return hiddenObject;
};

const ReleaseJobs = ({ onAdd, jiraKey }) => {
  const [action, setAction] = useState(ReleaseStatics.ACTION_CREATE_OR_UPDATE);
  const [firstJobGroup, setFirstJobGroup] = useState(null);
  const [secondJobGroup, setSecondJobGroup] = useState(null);
  const [jobContext, setJobContext] = useState(null);
  const [jobName, setJobName] = useState(null);
  const [jobContextName, setJobContextName] = useState(null);
  const [disableBatchAdd, setDisableBatchAdd] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [jiraKeyValue, setJiraKeyValue] = useState('');
  const [job, setJob] = useState(null);

  const onChangeAction = useCallback((event) => {
    const newAction = event.target.value;
    setAction(newAction);
  }, []);

  const onChangeFirstJobGroup = useCallback((jobGroupSelection) => {
    setFirstJobGroup(jobGroupSelection);
    loadJobs(jobGroupSelection);
  }, []);

  const onChangeSecondJobGroup = useCallback((jobGroupSelection) => {
    setSecondJobGroup(jobGroupSelection);
  }, []);

  const onChangeJobContext = useCallback((jobContextSelection) => {
    setJobContext(jobContextSelection);
  }, []);

  const onShowTips = useCallback(() => {
    setShowTip(prev => !prev);
  }, []);

  const onChangeJiraKey = useCallback((event) => {
    const value = event.target.value;
    setJiraKeyValue(value);
    jiraKey(value);
  }, [jiraKey]);

  const onChangeJob = useCallback((newValue) => {
    if (newValue) {
      setJobName(newValue.name);
      setDisableBatchAdd(true);
      setJobContextName(
        newValue.jobContextSummary !== undefined ? newValue.jobContextSummary.name : null
      );
      loadJob(newValue.name);
    } else {
      setJobName(null);
      setDisableBatchAdd(false);
    }
  }, []);

  const onAddSingle = useCallback(() => {
    if (job && job.type === 'VS' && (!job.jobScope || !job.jobConsumer)) {
      toast.error(`Job ${job.name} scope or consumer is missing, can not be added!`);
      return;
    }

    const addType = ReleaseStatics.JOB_ADD_SINGLE;
    const value = {
      firstJobGroup, 
      jobContext, 
      jobName, 
      secondJobGroup, 
      action, 
      addType, 
      jobContextName, 
      job,
    };

    onAdd(value);
  }, [firstJobGroup, jobContext, jobName, secondJobGroup, action, jobContextName, job, onAdd]);

  const onAddBatch = useCallback(() => {
    const addType = ReleaseStatics.JOB_ADD_BATCH;
    const value = {
      firstJobGroup, 
      jobContext, 
      jobName, 
      secondJobGroup, 
      action, 
      addType, 
      jobContextName,
    };

    onAdd(value);
  }, [firstJobGroup, jobContext, jobName, secondJobGroup, action, jobContextName, onAdd]);

  const loadJob = useCallback((jobName) => {
    console.log(`Loading Job #${jobName}...`);
    jobs.getJobByName(jobName)
      .then((jobResult) => {
        toast.success('job is existing in the job list.');
        setJob(jobResult);
      })
      .catch((error) => {
        toast.error(`job is not existing in the job list ${error}`);
      });
  }, []);

  const loadJobs = useCallback((jobGroupSelection) => {
    if (!jobGroupSelection || !Number(jobGroupSelection.id)) {
      return;
    }
    const defaultQuery = ReleaseStatics.getDefaultQuery();
    const query = Object.assign({}, defaultQuery, { jobGroupId: jobGroupSelection.id });
    jobs.findJobs(query)
      .then((jobPage) => {
        if (jobPage.totalPages > 0) {
          JobAutosuggest.jobList = jobPage.content;
        }
      })
      .catch(() => {});
  }, []);

  const show = showTip ? '' : 'none';
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
      <div className="card-body">
        <div className="form-group" id="addJobGroup">
          <div 
            className="form-group row" 
            hidden={hiddenObject.firstGroupFieldNameHidden}
          >
            <label 
              htmlFor="inputGroup" 
              className="col-sm-2 col-form-label"
            >
              {hiddenObject.firstGroupFieldName}
            </label>
            <div className="col-sm-5">
              <JobHierarchyAutosuggest onChange={onChangeFirstJobGroup} />
            </div>
          </div>
          <div 
            className="form-group row" 
            hidden={hiddenObject.secondGroupFieldNameHidden}
          >
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
          <div 
            className="form-group row" 
            hidden={hiddenObject.jobNameHidden}
          >
            <label 
              htmlFor="inputJobName" 
              className="col-sm-2 col-form-label"
            >
              Job Name
            </label>
            <div className="col-sm-5">
              <JobAutosuggest onChange={onChangeJob} />
            </div>
          </div>
          <div 
            className="form-group row" 
            hidden={hiddenObject.contextHidden}
          >
            <label 
              htmlFor="inputContext" 
              className="col-sm-2 col-form-label"
            >
              Context (In Production)
            </label>
            <div className="col-sm-5">
              <JobContextAutosuggest onChange={onChangeJobContext} />
            </div>
            <div className="col-sm-3 col-form-label">
              <button
                type="button"
                className="badge badge-primary badge-pill"
                title="Click to show tips .."
                onClick={onShowTips}
              >
                ?
              </button>
            </div>
          </div>
          <div 
            className="form-group row" 
            hidden={hiddenObject.contextHidden} 
            style={{ display: show }}
          >
            <div className="col-sm-6">
              <div className="card">
                <div className="card-body">
                  <p className="card-text">
                    Context :
                    <br />
                    Choose context to use production context,
                    <br />
                    if it is empty,
                    <br />
                    it will upload this jobs context to production as new context.
                  </p>
                </div>
              </div>
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
              value={jiraKeyValue} 
              placeholder="JIRA ID if available" 
            />
          </div>
        </div>
        <div className="form-group row">
          <div className="col-sm-5">
            <button 
              type="button" 
              disabled={disableBatchAdd} 
              className="btn btn-primary mr-2" 
              onClick={onAddBatch}
            >
              Batch Add
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={onAddSingle}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReleaseJobs;