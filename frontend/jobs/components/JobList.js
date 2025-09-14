import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

import { isEqual } from 'lodash';
import queryString from 'query-string';
import { toast } from 'react-toastify';
import jobs from '../../backend/jobs';
import jobExecution from '../../backend/jobExecution';

import Alert from '../../components/Alert';
import LoadingIndicator from '../../components/LoadingIndicator';
import Paginator from '../../components/Paginator';

import { populateDragData } from '../utils';
import { withCurrentUser } from '../../components/currentUser';
import JobLabelEditModal from './JobLabelEditModal';
import labelService from '../../backend/labels';
import CriteriaBlock from './CriteriaBlock';
import JobReleaseModal from './JobReleaseModal';
import { loadReleaseJobItemsFromLocalStorage, updateReleaseJobItemsToLocalStorage } from '../../utils/utilities';
import ReleaseStatics from '../../releaseManager/components/ReleaseStatics';


const ASC = 'asc';
const DESC = 'desc';

const getDefaultQuery = () => {
  return {
    filterScope: filterScope().JobName,
    jobNameKeyword: '',
    searchCriteriaId: null,
    sort: 'name,asc',
    page: 0,
    size: 50,
  };
};

const filterScope = () => {
  return {
    JobName: 'Job_Name',
    JobContent: 'Job_Content',
    Label: 'Label',
    SearchCriteria: 'Search_Criteria',
  };
};

const onQuickRunJob = (jobId) => {
  jobExecution.submitJob(jobId)
    .then((jobRequest) => {
      toast.success(`Job has been submitted, status is: ${jobRequest.status}`);
    })
    .catch((error) => {
      toast.error(`Failed to submit job: ${error}`);
    });
};

const JobList = ({ jobGroupId = null, configGroupId = null, jobContextId = null, search, onUpdateQuery, onRunJobList, currentUser }) => {
  const [updatedFilterScope, setUpdatedFilterScope] = useState(null);
  const [jobPage, setJobPage] = useState(null);
  const [updatedKeyword, setUpdatedKeyword] = useState(null);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [showLabelEditModal, setShowLabelEditModal] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [searchCriteriaId, setSearchCriteriaId] = useState(null);
  const [autosuggestStatus, setAutosuggestStatus] = useState('');

  const filterScopeTips = new Map([
    [filterScope().JobName, 'search by job name'],
    [filterScope().JobContent, 'job content search by keyword1 && keyword2 ...'],
    [filterScope().Label, 'search by label']
  ]);

  const getQuery = useCallback(() => {
    const defaultQuery = getDefaultQuery();
    const query = queryString.parse(search);
    return Object.assign({}, defaultQuery, query);
  }, [search]);

  const query = getQuery();

  useEffect(() => {
    _loadJobPage();
  }, []);

  useEffect(() => {
    _clearAndLoadJobPage();
  }, [jobGroupId, configGroupId, jobContextId, search]);

  const onChangeFilterScope = (event) => {
    setUpdatedFilterScope(event.target.value);
  };

  const onRefresh = (event) => {
    event.preventDefault();
    setJobPage(null);
    _loadJobPage();
  };

  const onChangeJobNameKeyword = (event) => {
    setUpdatedKeyword(event.target.value);
  };

  const onRunJobListHandler = () => {
    if (selectedJobs.length < 1) {
      toast.warn('No job selected to run.');
      return;
    }
    onRunJobList(selectedJobs);
  };

  const onCheckOrUncheckJobs = (event) => {
    if (event.target.id === 'SELECT_ALL_JOBS') {
      const newSelectedJobs = [...selectedJobs];
      jobPage.content.forEach(job => {
        if (!newSelectedJobs.includes(job.id)) {
          newSelectedJobs.push(job.id);
        }
      });
      setSelectedJobs(newSelectedJobs);
    } else if (event.target.id === 'CLEAR') {
      const newSelectedJobs = [...selectedJobs];
      jobPage.content.forEach(job => {
        const index = newSelectedJobs.indexOf(job.id);
        if (index > -1) {
          newSelectedJobs.splice(index, 1);
        }
      });
      setSelectedJobs(newSelectedJobs);
    }
  };

  const onCheckOrUncheckJob = (job, event) => {
    const newSelectedJobs = [...selectedJobs];
    const index = newSelectedJobs.indexOf(job.id);
    if (event.target.checked && index === -1) {
      newSelectedJobs.push(job.id);
      setSelectedJobs(newSelectedJobs);
    } else if (!event.target.checked && index > -1) {
      newSelectedJobs.splice(index, 1);
      setSelectedJobs(newSelectedJobs);
    }
  };

  const onSubmitJobNameFilter = (event) => {
    event.preventDefault();
    const overrideQuery = {
      jobNameKeyword: updatedKeyword || query.jobNameKeyword,
      filterScope: updatedFilterScope || query.filterScope,
      searchCriteriaId: searchCriteriaId || query.searchCriteriaId,
      page: 0,
    };

    const newQuery = Object.assign({}, query, overrideQuery);
    onUpdateQuery(newQuery);
  };

  const onChangePageSize = (event) => {
    const size = event.target.value;
    const newQuery = Object.assign({}, query, { page: 0, size: size });
    onUpdateQuery(newQuery);
  };

  const onClickPage = (page) => {
    const newQuery = Object.assign({}, query, { page });
    onUpdateQuery(newQuery);
  };

  const onToggleNameOrdering = () => {
    if (jobPage === null) {
      console.log('Job page is not yet loaded: cannot toggle ordering.');
      return;
    }
    const [currentSorting, currentOrdering] = query.sort.split(',');
    const ordering = currentOrdering === ASC ? DESC : ASC;
    const sort = `${currentSorting},${ordering}`;
    const newQuery = Object.assign({}, query, { sort: sort, page: 0 });
    onUpdateQuery(newQuery);
  };

  const onDragStart = (event, job) => {
    let effectAllowed = null;
    if (event.ctrlKey || !jobGroupId) {
      effectAllowed = 'link';
    } else {
      effectAllowed = 'move';
    }
    const payload = {
      type: 'job',
      jobId: job.id,
      fromJobGroupId: jobGroupId,
    };
    populateDragData(event, effectAllowed, payload);
  };

  const onDragEnd = (event, job) => {
    const effect = event.dataTransfer.effectAllowed;
    const dropEffect = event.dataTransfer.dropEffect;
    if (effect !== 'move' || !dropEffect || dropEffect === 'none') {
      return;
    }

    setJobPage((prevJobPage) => {
      if (prevJobPage === null || prevJobPage instanceof Error) {
        return prevJobPage;
      }
      const content = prevJobPage.content.filter(item => item.id !== job.id);
      return Object.assign({}, prevJobPage, { content });
    });
  };

  const onAddLabels = (labels) => {
    const idListAndLabelList = {
      idList: selectedJobs,
      nameList: labels.map(label => label.name),
    };

    if (idListAndLabelList.nameList.length < 1) {
      setShowLabelEditModal(false);
      toast.warn('please input labels you want to add.');
      return;
    }

    if (idListAndLabelList.idList.length < 1) {
      setShowLabelEditModal(false);
      toast.warn('no job is selected to add labels. please select jobs.');
      return;
    }

    labelService.addLabelsToJobs(idListAndLabelList).then(result => {
      setShowLabelEditModal(false);
      _loadJobPage();
      toast.success(result.message);
    }).catch(error => {
      setShowLabelEditModal(false);
      toast.error(`fail to add labels: ${error}`);
    });
  };

  const onToastReleaseAddResult = (operationState) => {
    const jobsMap = jobPage.content.filter(job => selectedJobs.indexOf(job.id) !== -1);

    const selectedJobsSlice = [];

    const releaseItems = loadReleaseJobItemsFromLocalStorage('releaseItem');
    const releaseItemsSlice = releaseItems.slice();
    let successAdded = false;
    if (operationState.action === ReleaseStatics.ACTION_CREATE_OR_UPDATE) {
      jobsMap.forEach(job => {
        let existedJob = null;
        releaseItems.some(item => {
          if (item.name === job.name && item.type === 'JOB' && item.action === 'CREATE_OR_UPDATE') {
            existedJob = item;
            return true;
          }
          return false;
        });

        let targetContextName = operationState.jobContextName;
        if (!operationState.jobContextName) {
          targetContextName = job.jobContextSummary.name;
        }

        const targetJobIdGroups = job.jobGroups;
        let targetGroupName = null;
        if (targetJobIdGroups && targetJobIdGroups[0] && targetJobIdGroups[0].name) {
          targetGroupName = targetJobIdGroups[0].name;
        } else {
          toast.error(`Job ${job.name} has not job group, can not be added...`);
          selectedJobsSlice.push(job.id);
          return;
        }

        if (existedJob) {
          if (existedJob.targetContextName !== targetContextName) {
            toast.error(`Job ${job.name} exists in list with different targetContextName...`);
            selectedJobsSlice.push(job.id);
            return;
          }
          if (existedJob.targetGroupNames.indexOf(targetGroupName) !== -1) {
            toast.error(`Job ${job.name} exists in list...`);
            selectedJobsSlice.push(job.id);
            return;
          }
          existedJob.targetGroupNames.push(targetGroupName);
          successAdded = true;
        } else {
          const newJob = {
            targetGroupNames: [targetGroupName],
            name: job.name,
            targetContextName: targetContextName,
            sourceGroupNames: [],
            operateJobGroupOnly: false,
            type: 'JOB',
            action: 'CREATE_OR_UPDATE',
            jobContextName: '',
          };
          releaseItemsSlice.push(newJob);
          successAdded = true;
        }
      });
    } else if (operationState.action === ReleaseStatics.ACTION_MOVE) {
      jobsMap.forEach(job => {
        let existedJob = null;
        releaseItems.some(item => {
          if (item.name === job.name && item.type === 'JOB' && item.action === ReleaseStatics.ACTION_MOVE) {
            existedJob = item;
            return true;
          }
          return false;
        });

        if (existedJob) {
          const sourceGroupNames = existedJob.sourceGroupNames;
          const targetGroupNames = existedJob.targetGroupNames;
          if (targetGroupNames.indexOf(operationState.moveInJobGroupName) !== -1
            && sourceGroupNames.indexOf(operationState.moveOutJobGroupName) !== -1) {
            toast.error(`Move job ${job.name} exists in the list.`);
            selectedJobsSlice.push(job.id);
            return;
          }

          if (sourceGroupNames.indexOf(operationState.moveOutJobGroupName) === -1) {
            existedJob.sourceGroupNames.push(operationState.moveOutJobGroupName);
          }

          if (targetGroupNames.indexOf(operationState.moveInJobGroupName) === -1) {
            existedJob.targetGroupNames.push(operationState.moveInJobGroupName);
          }

          successAdded = true;
        } else {
          const newJob = {
            targetGroupNames: [operationState.moveInJobGroupName],
            name: job.name,
            targetContextName: job.jobContextSummary.name,
            sourceGroupNames: [operationState.moveOutJobGroupName],
            operateJobGroupOnly: false,
            type: 'JOB',
            action: ReleaseStatics.ACTION_MOVE,
            jobContextName: null,
          };
          releaseItemsSlice.push(newJob);
          successAdded = true;
        }
      });
    }

    if (successAdded) {
      updateReleaseJobItemsToLocalStorage('releaseItem', releaseItemsSlice);
      toast.success('Jobs have been added to release package');
    }
    setSelectedJobs(selectedJobsSlice);
    onShowReleaseModalHandler(false);
  };

  const onCloseLabelEditModal = () => {
    setShowLabelEditModal(false);
  };

  const onShowLabelEditModalHandler = () => {
    setShowLabelEditModal(true);
  };

  const onShowReleaseModalHandler = (flag) => {
    setShowReleaseModal(flag);
  };

  const onChangeSearchCriteriaId = (searchCriteriaId) => {
    setSearchCriteriaId(searchCriteriaId);
  };

  const onChangeAutoSuggestStatus = (autosuggestStatus) => {
    setAutosuggestStatus(autosuggestStatus);
  };

  const _loadJobPage = () => {
    const query = Object.assign({}, getQuery(), { jobGroupId, configGroupId, jobContextId });
    jobs.findJobsByKeywords(query)
      .then((jobPage) => {
        const currentPage = getQuery().page;
        if (jobPage.totalPages > 0 && currentPage >= jobPage.totalPages) {
          const lastPage = jobPage.totalPages - 1;
          console.log(`Jumping from page ${currentPage} back to last page ${lastPage}.`);
          const queryForLastPage = Object.assign({}, getQuery(), { page: lastPage });
          onUpdateQuery(queryForLastPage);
        } else {
          setJobPage(jobPage);
        }
      })
      .catch(error => setJobPage(error));
  };

  const _clearAndLoadJobPage = () => {
    setJobPage(null);
    setUpdatedFilterScope(null);
    setUpdatedKeyword(null);
    setSelectedJobs([]);
    _loadJobPage();
  };

  const {
    filterScope: queryFilterScope,
    jobNameKeyword,
    searchCriteriaId: querySearchCriteriaId,
    sort,
    page,
    size,
  } = query;

  const canWrite = currentUser.canWrite;
  const canExecute = currentUser.canExecute;
  const ordering = sort.split(',')[1];
  const finalFilterScope = updatedFilterScope !== null ? updatedFilterScope : queryFilterScope;

  let $searchInput = <input className="form-control" type="text" placeholder={filterScopeTips.get(finalFilterScope)} value={updatedKeyword !== null ? updatedKeyword : jobNameKeyword} onChange={onChangeJobNameKeyword} />;

  if (finalFilterScope === filterScope().SearchCriteria) {
    $searchInput = <CriteriaBlock onChange={onChangeSearchCriteriaId} onChangeAutoSuggestStatus={onChangeAutoSuggestStatus} searchCriteriaId={querySearchCriteriaId} />;
  }

  if (jobPage === null) {
    return <LoadingIndicator />;
  }
  if (jobPage instanceof Error) {
    return <Alert type="danger" text={String(jobPage)} />;
  }

  let $LabelEditModal = null;
  if (showLabelEditModal) {
    $LabelEditModal = <JobLabelEditModal labels={[]} onComplete={onAddLabels} onClose={onCloseLabelEditModal} />;
  }

  let $JobReleaseModal = null;
  if (showReleaseModal) {
    $JobReleaseModal = <JobReleaseModal onComplete={onToastReleaseAddResult} onClose={onShowReleaseModalHandler} />;
  }

  const $jobRows = jobPage.content.map(job => 
    <tr key={`job-row-${job.id}`}>
      <td>
        <input 
          type="checkbox" 
          checked={selectedJobs.indexOf(job.id) > -1} 
          onChange={event => onCheckOrUncheckJob(job, event)} 
        />
      </td>
      <td>
        <span
          draggable={true}
          onDragStart={event => onDragStart(event, job)}
          onDragEnd={event => onDragEnd(event, job)}
          style={{ userSelect: 'auto' }}
        >
          <i className="pointer fa fa-fw fa-th text-muted mr-1" />
          <Link to={`/job/detail/${job.id}`}>{job.name}</Link>
        </span>
      </td>
      <td className="text-nowrap">
        <a href={`/frontend/globalConfig/job-context/detail/${job.jobContextSummary.id}`}>
          {job.jobContextSummary.name}
        </a>
      </td>
      <td className="text-nowrap">{job.type}</td>
      <td className="text-nowrap">{job.owner}</td>
      <td className="text-nowrap">
        <div className="btn-group btn-group-xs" role="group">
          {canWrite && (
            <Link 
              to={`/job/edit/${job.id}`} 
              className="btn btn-outline-primary" 
              title="Configure"
            >
              <i className="fa fa-fw fa-pencil" />
            </Link>
          )}
          {canExecute && (
            <Link 
              to={`/job/customized-run/${job.id}`} 
              className="btn btn-outline-primary" 
              title="Customized Run"
            >
              <i className="fa fa-fw fa-play" />
            </Link>
          )}
          {canExecute && (
            <button 
              className="btn btn-outline-primary" 
              type="button" 
              title="Quick Run" 
              onClick={() => onQuickRunJob(job.id)}
            >
              <i className="fa fa-fw fa-forward" />
            </button>
          )}
        </div>
        {!canWrite && !canExecute && <span className="text-muted">--</span>}
      </td>
    </tr>
  );

  let $sortIcon = null;
  if (ordering === ASC) {
    $sortIcon = <i className="fa fa-fw fa-sort-alpha-asc ml-1" />;
  } else if (ordering === DESC) {
    $sortIcon = <i className="fa fa-fw fa-sort-alpha-desc ml-1" />;
  }

  let $jobListTable = null;
  if ($jobRows.length === 0) {
    $jobListTable = <Alert type="warning" text="No jobs found." />;
  } else {
    $jobListTable = (
      <table className="table table-striped mb-2">
        <thead>
          <tr>
            <th style={{ width: '7%' }}>
              <div className="btn-group">
                <button
                  data-toggle="dropdown"
                  className="btn btn-primary dropdown-toggle"
                  type="button"
                  id="dropdown-menu"
                >
                  ACTIONS
                </button>
                <div className="dropdown-menu">
                  <button 
                    id="SELECT_ALL_JOBS" 
                    className="dropdown-item" 
                    type="button" 
                    onClick={onCheckOrUncheckJobs}
                  >
                    Select All
                  </button>
                  <button 
                    id="CLEAR" 
                    className="dropdown-item" 
                    type="button" 
                    onClick={onCheckOrUncheckJobs}
                  >
                    Clear
                  </button>
                  {canExecute && (
                    <button 
                      id="RUN_JOBS" 
                      className="dropdown-item" 
                      type="button" 
                      title="Run selected Jobs" 
                      onClick={onRunJobListHandler}
                    >
                      Run Jobs
                    </button>
                  )}
                  {canWrite && (
                    <button 
                      id="ADD_LABEL" 
                      className="dropdown-item" 
                      type="button" 
                      onClick={onShowLabelEditModalHandler}
                    >
                      Add Label To Jobs
                    </button>
                  )}
                  {canWrite && (
                    <button 
                      id="ADD_TO_PACKAGE" 
                      className="dropdown-item" 
                      type="button" 
                      onClick={() => onShowReleaseModalHandler(true)}
                    >
                      Add Jobs To Package
                    </button>
                  )}
                </div>
              </div>
            </th>
            <th>
              <button className="anchor" type="button" onClick={onToggleNameOrdering}>
                Name {$sortIcon}
              </button>
            </th>
            <th className="text-nowrap" style={{ width: '5%' }}>Context</th>
            <th className="text-nowrap" style={{ width: '5%' }}>Type</th>
            <th className="text-nowrap" style={{ width: '5%' }}>Owner</th>
            <th className="text-nowrap" style={{ width: '5%' }}>Actions</th>
          </tr>
        </thead>
        <tbody>{$jobRows}</tbody>
      </table>
    );
  }

  return (
    <div>
      <div className="row mb-2">
        <div className="col-8">
          <form onSubmit={onSubmitJobNameFilter}>
            <div className="input-group">
              <div className="input-group-prepend">
                <select
                  id="filter-type"
                  className="btn btn-primary"
                  style={{ fontFamily: 'inherit' }}
                  value={finalFilterScope}
                  onChange={onChangeFilterScope}
                >
                  <option value={filterScope().JobName}>Job Name</option>
                  <option value={filterScope().JobContent}>Job Content</option>
                  <option value={filterScope().Label}>Label</option>
                  <option value={filterScope().SearchCriteria}>Criteria</option>
                </select>
              </div>
              {$searchInput}
              <div className="input-group-append">
                <button className="btn btn-primary" type="submit">
                  Search
                </button>
              </div>
            </div>
            <small className="form-text text-muted">{autosuggestStatus}</small>
          </form>
        </div>
        <div className="col-4 d-flex justify-content-end align-items-center">
          <div className="mr-2">
            Page: <strong>{`#${page}`}</strong>
          </div>
          <form className="form-inline mr-2 my-0">
            <label htmlFor="page-size" className="mr-2">Page Size</label>
            <select 
              id="page-size" 
              className="form-control" 
              onChange={onChangePageSize} 
              value={size}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </form>
          <button className="btn btn-link" type="button" onClick={onRefresh}>
            <i className="fa fa-fw fa-refresh" />
            {' Refresh'}
          </button>
        </div>
      </div>
      {$jobListTable}
      <Paginator page={jobPage} onClickPage={onClickPage} />
      {$LabelEditModal}
      {$JobReleaseModal}
    </div>
  );
};

export default withCurrentUser(JobList);