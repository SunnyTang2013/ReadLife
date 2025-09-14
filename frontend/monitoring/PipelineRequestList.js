import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import { isEqual, cloneDeep } from 'lodash';
import queryString from 'query-string';

import DatePicker from 'react-datepicker';
import { toast } from 'react-toastify';
import monitoring from '../backend/monitoring';
import jobExecution from '../backend/jobExecution';
import RouterPropTypes from '../proptypes/router';
import { formatTime, truncateChars, formatDuration } from '../utils/utilities';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';
import Paginator from '../components/Paginator';
import RequestStatusBadge from '../components/RequestStatusBadge';

import { withCurrentUser } from '../components/currentUser';

import { getBatchRequestProgress } from './utils';
import 'react-datepicker/dist/react-datepicker.css';
import Doughnut from '../components/Doughnut';
import colors from '../utils/colors';
import ScorchPropTypes from '../proptypes/scorch';
import pipelineRequestService from '../backend/pipelineRequestService';

function PipelineRequestList({ currentUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  // Static helper functions
  const isNotDone = useCallback((pipelineRequest) => {
    return pipelineRequest.status !== 'SUCCESS' && pipelineRequest.status !== 'FAILURE'
      && pipelineRequest.status !== 'FAILED_IGNORE';
  }, []);

  const isDone = useCallback((scorchRequest) => {
    return scorchRequest.status === 'SUCCESS' || scorchRequest.status === 'FAILURE'
      || scorchRequest.status === 'FAILED_IGNORE';
  }, []);

  const last24Hours = useCallback(() => {
    let currentTime = new Date().getTime();
    currentTime -= currentTime % 1000;
    return new Date(currentTime - 24 * 60 * 60 * 1000);
  }, []);

  const getDefaultQuery = useCallback(() => {
    return {
      name: '',
      pipelineRequestUUID: '',
      showRootRequest: true,
      minCreateTime: last24Hours().toISOString(),
      maxCreateTime: '',
      status: '',
      username: '',
      pandoraBuildKey: '',
      sort: 'createTime,desc',
      page: 0,
      size: 50,
    };
  }, [last24Hours]);

  const colorForStatus = useCallback((status) => {
    const mappings = {
      PENDING: colors.GRAY,
      ONGOING: colors.BLUE,
      SUCCESS: colors.GREEN,
      FAILURE: colors.RED,
    };
    return mappings[status] || colors.DEEP_ORANGE;
  }, []);

  const getNodeRequestDetailLink = useCallback((scorchRequest) => {
    if (scorchRequest.nodeType === 'BATCH') {
      return (
        <Link to={`/batch-request/detail/${scorchRequest.id}`}>
          {truncateChars(scorchRequest.name, 80)}
        </Link>
      );
    }

    if (scorchRequest.nodeType === 'PIPELINE') {
      return (
        <Link to={`/pipeline-request/detail/${scorchRequest.id}`}>
          {truncateChars(scorchRequest.name, 80)}
        </Link>
      );
    }

    return (
      <Link to={`/job-request/detail/${scorchRequest.id}`}>
        {truncateChars(scorchRequest.name, 80)}
      </Link>
    );
  }, []);

  // State management
  const [pipelineRequestPage, setPipelineRequestPage] = useState(null);
  const [pipelineRequestStats, setPipelineRequestStats] = useState(null);
  const [filteringOptions, setFilteringOptions] = useState({});
  const [currentlySupportingPipeline, setCurrentlySupportingPipeline] = useState({});
  const [currentlySupportingPipelineTags, setCurrentlySupportingPipelineTags] = useState([]);
  const [selectedScorchRequests, setSelectedScorchRequests] = useState([]);
  const [childSubNodes, setChildSubNodes] = useState({});
  const [dropDownFlag, setDropDownFlag] = useState({});
  const [showJobRequestType, setShowJobRequestType] = useState({});
  const [jobRequests, setJobRequests] = useState({});

  // Memoized query object
  const query = useMemo(() => {
    const defaultQuery = getDefaultQuery();
    const parsedQuery = queryString.parse(location.search);
    return Object.assign({}, defaultQuery, parsedQuery);
  }, [location.search, getDefaultQuery]);

  // Helper functions
  const getQueryUrl = useCallback((overrides) => {
    const nextQuery = Object.assign({}, query, overrides);
    return `${location.pathname}?${queryString.stringify(nextQuery)}`;
  }, [query, location.pathname]);


  const onKeyDown = useCallback((e) => {
    if (e.keyCode === 13 && e.target.id && e.target.id.indexOf('query-') !== -1) {
      onApplyFilteringOptions();
    }
  }, []);

  const onChecked = useCallback((pipelineRequest) => {
    let $selectedIdExists = false;
    if (selectedScorchRequests.length > 0) {
      selectedScorchRequests.map((selectedBatchRequest) => {
        if (selectedBatchRequest.id === pipelineRequest.id) {
          $selectedIdExists = true;
        }
        return null;
      });
    }

    return $selectedIdExists;
  }, [selectedScorchRequests]);

  const onShowSubNodes = useCallback((pipelineRequest) => {
    setDropDownFlag(prevState => {
      const newDropDownFlag = { ...prevState };
      newDropDownFlag[pipelineRequest.id] = !newDropDownFlag[pipelineRequest.id];
      return newDropDownFlag;
    });
  }, []);

  const onLoadSubNodes = useCallback((scorchRequest) => {
    const newDropDownFlag = { ...dropDownFlag };
    newDropDownFlag[scorchRequest.id] = !newDropDownFlag[scorchRequest.id];
    setDropDownFlag(newDropDownFlag);

    if (!childSubNodes[scorchRequest.uuid]) {
      monitoring.getPipelineRequestSubNodes([scorchRequest.id])
        .then((subNodes) => {
          const newChildSubNodes = Object.assign({}, childSubNodes, subNodes);
          setChildSubNodes(newChildSubNodes);
        }).catch((error) => {
          toast.error(error);
        });
    }
  }, [dropDownFlag, childSubNodes]);

  const onLoadJobs = useCallback((batchRequest) => {
    const newDropDownFlag = { ...dropDownFlag };
    newDropDownFlag[batchRequest.id] = !newDropDownFlag[batchRequest.id];
    setDropDownFlag(newDropDownFlag);

    if (!jobRequests[batchRequest.id]) {
      monitoring.getJobRequestByBatchRequest(batchRequest.uuid)
        .then((jobRequestList) => {
          const newJobRequests = { ...jobRequests };
          newJobRequests[batchRequest.id] = jobRequestList;
          setJobRequests(newJobRequests);
        }).catch((error) => {
          toast.error(error);
        });
    }
  }, [dropDownFlag, jobRequests]);

  const onShowJobs = useCallback((batchRequest, status) => {
    setShowJobRequestType(prevState => ({
      ...prevState,
      [batchRequest.id]: status
    }));
  }, []);

  const onSelectScorchRequest = useCallback((pipelineRequest, event) => {
    const newSelectedBatches = selectedScorchRequests.slice();
    if (event.target.checked) {
      newSelectedBatches.push(pipelineRequest);
    } else {
      const pipelineReqIds = selectedScorchRequests.map(pipelineReq => pipelineReq.id);
      const index = pipelineReqIds.indexOf(pipelineRequest.id);
      if (index > -1) {
        newSelectedBatches.splice(index, 1);
      }
    }

    setSelectedScorchRequests(newSelectedBatches);
  }, [selectedScorchRequests]);

  const onSelectScorchRequestAll = useCallback(() => {
    const scorchRequestPage = pipelineRequestPage;
    const newSelectedScorchRequests = scorchRequestPage.content.slice();
    setSelectedScorchRequests(newSelectedScorchRequests);
  }, [pipelineRequestPage]);

  const onClear = useCallback(() => {
    setSelectedScorchRequests([]);
  }, []);

  const onTriggerCancelButton = useCallback(() => {
    const notDoneList = selectedScorchRequests.filter(
      pipelineRequest => isNotDone(pipelineRequest),
    );

    notDoneList.forEach(request => onCancelRequest(request));
    onClear();
  }, [selectedScorchRequests, isNotDone, onClear, onCancelRequest]);

  const onRerunSelectedFailedRequests = useCallback(() => {
    selectedScorchRequests.forEach(request => {
      pipelineRequestService.rerunFailedJobs(request).then((result) => {
        toast.success(`Success to rerun request ${request.name}.`);
        onResetPipelineRequestPage(result);
        onResetSubNodes(result);
      }).catch((error) => {
        toast.error(`Failed to rerun request ${request.name}: ${error}`);
      });
    });
    onClear();
  }, [selectedScorchRequests, onClear, onResetPipelineRequestPage, onResetSubNodes]);

  const onForceOKSelectedRequests = useCallback(() => {
    selectedScorchRequests.forEach(request => {
      if (request.status === 'FAILURE') {
        pipelineRequestService.markAsSuccess(request).then((result) => {
          toast.success(`Success to mark request ${request.name} to Success.`);
          onResetPipelineRequestPage(result);
          onResetSubNodes(request);
        }).catch((error) => {
          toast.error(`Failed to mark request ${request.name}: ${error}`);
        });
      } else {
        toast.warn(`Request ${request.name} is not failed stage.`);
      }
    });
  }, [selectedScorchRequests]);

  const onRerunSelectedRequests = useCallback(() => {
    selectedScorchRequests.forEach(request => {
      pipelineRequestService.rerunPipelineRequest(request).then((result) => {
        toast.success(`Success to rerun request ${request.name} to Success.`);
        onResetPipelineRequestPage(result);
        onResetSubNodes(request);
      }).catch((error) => {
        toast.error(`Failed to rerun request ${request.name}: ${error}`);
      });
    });
  }, [selectedScorchRequests]);

  const onResetPipelineRequestPage = useCallback((scorchRequest) => {
    const requestList = pipelineRequestPage.content;
    const newScorchRequestList = requestList.map((request) => {
      if (request.id === scorchRequest.id) {
        return scorchRequest;
      }
      return request;
    });
    const newRequestPage = Object.assign({}, pipelineRequestPage,
      { content: newScorchRequestList });
    setPipelineRequestPage(newRequestPage);
  }, [pipelineRequestPage]);

  const onResetSubNodes = useCallback((scorchRequest) => {
    let key = scorchRequest.pipelineRequestUUID;
    if (scorchRequest.nodeType === 'PIPELINE') {
      key = scorchRequest.ticketId;
    }
    const subNodes = childSubNodes[key];

    if (subNodes) {
      const newSubNodes = subNodes.map((request) => {
        if (request.id === scorchRequest.id) {
          return scorchRequest;
        }
        return request;
      });
      const newChildSubNodes = { ...childSubNodes };
      newChildSubNodes[key] = newSubNodes;
      setChildSubNodes(newChildSubNodes);
    }
  }, [childSubNodes]);

  const onClickPage = useCallback((page) => {
    const url = getQueryUrl({ page });
    navigate(url);
  }, [getQueryUrl, navigate]);

  const onChangeCreateTimeRange = useCallback((name, dateTime) => {
    setFilteringOptions(prevState => {
      const newFilteringOptions = { ...prevState };
      if (!dateTime) {
        newFilteringOptions[name] = null;
      } else {
        newFilteringOptions[name] = dateTime.toISOString();
      }
      return newFilteringOptions;
    });
  }, []);

  const onClickLaunchedByMe = useCallback(() => {
    if (currentUser && currentUser.username) {
      const username = currentUser.username;
      setFilteringOptions(prevState => ({ ...prevState, username }));
    }
  }, [currentUser]);

  const onChangeShowRootRequestCheck = useCallback((event) => {
    const showRootRequest = event.target.checked;
    setFilteringOptions(prevState => ({ ...prevState, showRootRequest }));
  }, []);

  const onChangeProperty = useCallback((name, event) => {
    const value = event.target.value;
    setFilteringOptions(prevState => ({
      ...prevState,
      [name]: value
    }));
  }, []);

  const onApplyFilteringOptions = useCallback(() => {
    const queryOverrides = Object.assign({}, filteringOptions);
    Object.keys(queryOverrides).forEach((key) => {
      if (key !== 'showRootRequest') {
        queryOverrides[key] = (queryOverrides[key] || '').trim();
      }
    });
    queryOverrides.page = 0;
    const url = getQueryUrl(queryOverrides);
    navigate(url);
  }, [filteringOptions, getQueryUrl, navigate]);

  const onResetFilteringOptions = useCallback(() => {
    const defaultQuery = getDefaultQuery();
    const queryOverrides = {
      nameKeyword: defaultQuery.nameKeyword,
      batchUuid: defaultQuery.batchUuid,
      minCreateTime: defaultQuery.minCreateTime,
      maxCreateTime: defaultQuery.maxCreateTime,
      status: defaultQuery.status,
      overrun: defaultQuery.overrun,
      page: 0,
    };
    setFilteringOptions({});
    const url = getQueryUrl(queryOverrides);
    navigate(url);
  }, [getDefaultQuery, getQueryUrl, navigate]);

  const onCancelRequest = useCallback((scorchRequest) => {
    if (scorchRequest.nodeType === 'PIPELINE') {
      jobExecution.cancelPipelineRequest(scorchRequest.uuid)
        .then((cancelledPipelineRequest) => {
          onResetSubNodes(cancelledPipelineRequest);
          onResetPipelineRequestPage(cancelledPipelineRequest);
          toast.success(`Success to cancel request ${scorchRequest.name}.`);
        })
        .catch((error) => {
          console.log(`Failed to cancel pipeline request : ${error}`);
          toast.error(`Failed to cancel request ${scorchRequest.name}: ${error}`);
        });
    } else {
      jobExecution.cancelBatchRequest(scorchRequest.uuid)
        .then((cancelledBatchRequest) => {
          onResetSubNodes(cancelledBatchRequest);
          toast.success(`Success to cancel request ${scorchRequest.name}.`);
        })
        .catch((error) => {
          console.log(`Failed to cancel pipeline request : ${error}`);
          toast.error(`Failed to cancel request ${scorchRequest.name}: ${error}`);
        });
    }
  }, []);

  const onClickSupportNotes = useCallback((pipelineRequest) => {
    let tags = '';
    const tagTable = {};
    let notes = '';
    let tempPipelineRequest = {};

    tempPipelineRequest = cloneDeep(pipelineRequest);
    if (pipelineRequest.supportNotes) {
      if (pipelineRequest.supportNotes.indexOf(' tags:') >= 0) {
        tags = pipelineRequest.supportNotes.substring(
          pipelineRequest.supportNotes.indexOf(' tags:') + 6,
        );
        notes = pipelineRequest.supportNotes.substring(0,
          pipelineRequest.supportNotes.indexOf(' tags:'));
        // create temp request without  tags in text
        tempPipelineRequest.supportNotes = notes;

        // fill tags in table
        if (tags.length > 0) {
          tags.split(',').forEach(tag => {
            // tag structure is tags:tag:GCP,tag:SCOMPARATOR ...
            const tagName = tag.substring(4);
            tagTable[tagName] = 'true';
          });
        }
      }
    }

    setCurrentlySupportingPipeline(tempPipelineRequest);
    setCurrentlySupportingPipelineTags(tagTable);
  }, []);

  const onSubmitSupportNotes = useCallback(() => {
    let tags = '';
    let cpt = 0;
    Object.keys(currentlySupportingPipelineTags).forEach((tagKey) => {
      if (currentlySupportingPipelineTags[tagKey] === 'true') {
        if (cpt) {
          tags = `${tags},tag:${tagKey}`;
        } else {
          tags = ` tags:tag:${tagKey}`;
        }
        cpt += 1;
      }
    });
    
    const updatedPipeline = { ...currentlySupportingPipeline };
    if (tags.length > 0) {
      if ((updatedPipeline.supportNotes === null)
         || (updatedPipeline.supportNotes.length === 0)) {
        updatedPipeline.supportNotes = tags;
      } else {
        updatedPipeline.supportNotes += tags;
      }
    }

    jobExecution.updateSupportNotes(updatedPipeline)
      .then((result) => {
        onResetPipelineRequestPage(result);
      })
      .catch((error) => {
        alert('error - invalid input probably or server down');
        console.log(`Failed to update pipeline request support notes: ${error}`);
      });
  }, [currentlySupportingPipeline, currentlySupportingPipelineTags, onResetPipelineRequestPage]);

  const onTagClick = useCallback((name) => {
    setCurrentlySupportingPipelineTags(prevState => {
      const newTags = { ...prevState };
      if (newTags[name] === 'true') {
        newTags[name] = 'false';
      } else {
        newTags[name] = 'true';
      }
      return newTags;
    });
  }, []);

  const onChangeSupportNote = useCallback((name, event) => {
    const value = event.target.value;
    setCurrentlySupportingPipeline(prevState => ({
      ...prevState,
      [name]: value
    }));
  }, []);

  // useEffect hooks to handle lifecycle behavior
  useEffect(() => {
    loadPipelineRequestPage();
  }, [loadPipelineRequestPage]);

  useEffect(() => {
    if (pipelineRequestPage && !(pipelineRequestPage instanceof Error)) {
      queryAndUpdatePipelineRequestList();
      getPipelineRequestSubNodes();
    }
  }, [pipelineRequestPage, queryAndUpdatePipelineRequestList, getPipelineRequestSubNodes]);

  useEffect(() => {
    if (pipelineRequestPage === null) {
      loadPipelineRequestPage();
    }
  }, [pipelineRequestPage, loadPipelineRequestPage]);


  const loadPipelineRequestPage = useCallback(() => {
    const pipelineRequestPagePromise = monitoring.getPipelineRequestList(query);
    const pipelineRequestStatsPromise = monitoring.getPipelineRequestStats(query);
    Promise.all([pipelineRequestPagePromise, pipelineRequestStatsPromise])
      .then(([pipelineRequestPageResult, pipelineRequestStatsResult]) => {
        setPipelineRequestPage(pipelineRequestPageResult);
        setPipelineRequestStats(pipelineRequestStatsResult);
        setChildSubNodes({});
        setDropDownFlag({});
        setJobRequests({});
        // Note: queryAndUpdatePipelineRequestList and getPipelineRequestSubNodes will be called via useEffect
      }).catch((error) => {
        setPipelineRequestPage(error);
        setPipelineRequestStats(error);
      });
  }, [query]);

  const clearAndLoadPipelineRequestPage = useCallback(() => {
    setFilteringOptions({});
    setPipelineRequestPage(null);
    // loadPipelineRequestPage will be called via useEffect when pipelineRequestPage changes
  }, []);

  const queryAndUpdatePipelineRequestList = useCallback(() => {
    if (pipelineRequestPage === null || pipelineRequestPage instanceof Error) {
      return;
    }

    const pipelineRequestList = pipelineRequestPage.content;
    const found = pipelineRequestList.find(
      pipelineRequest => isNotDone(pipelineRequest),
    );
    if (!found) {
      return;
    }

    const pipelineRequestIds = pipelineRequestList.filter(
      pipelineRequest => isNotDone(pipelineRequest),
    ).map(pipelineRequest => pipelineRequest.id);
    monitoring.queryAndUpdatePipelineRequestList(pipelineRequestIds)
      .then((content) => {
        updatePipelineRequestPage(content);
      });
  }, [pipelineRequestPage, isNotDone]);

  const getPipelineRequestSubNodes = useCallback(() => {
    if (pipelineRequestPage === null || pipelineRequestPage instanceof Error) {
      return;
    }

    const pipelineRequestList = pipelineRequestPage.content;

    const pipelineRequestIds = pipelineRequestList.map(pipelineRequest => pipelineRequest.id);
    monitoring.getPipelineRequestSubNodes(pipelineRequestIds)
      .then((subNodes) => {
        setChildSubNodes(prevState => {
          const currentChildSubNodes = cloneDeep(prevState);
          const newChildSubNodes = Object.assign({}, currentChildSubNodes, subNodes);
          return newChildSubNodes;
        });
      }).catch((error) => {
        setChildSubNodes(error);
      });
  }, [pipelineRequestPage]);

  const updatePipelineRequestPage = useCallback((pipelineRequestList) => {
    if (pipelineRequestList) {
      setPipelineRequestPage(prevState => {
        if (prevState) {
          const currentContent = prevState.content;
          const updatedContent = currentContent.map(currentPipelineRequest => {
            let pipelineRequest = currentPipelineRequest;
            pipelineRequestList.map(updatedPipelineRequest => {
              if (pipelineRequest.id === updatedPipelineRequest.id) {
                pipelineRequest = updatedPipelineRequest;
              }
              return updatedPipelineRequest;
            });
            return pipelineRequest;
          });
          return { ...prevState, content: updatedContent };
        }
        return prevState;
      });
    }
  }, []);

  const renderBatchDropdown = useCallback((scorchRequest, seqWholePath, angle) => {
    let showType = 'ALL';
    if (showJobRequestType[scorchRequest.id]) {
      showType = showJobRequestType[scorchRequest.id];
    }
    return (
      <div className="form-inline">
        <a
          type="button"
          className="btn btn-link btn-sm font-size-sm"
          data-toggle="collapse"
          href={`#collapse-${scorchRequest.id}`}
          role="button"
          aria-expanded="false"
          aria-controls={scorchRequest.id}
          onClick={() => onLoadJobs(scorchRequest)}
        >
          <i className={`fa fa-fw ${angle} ml-1`} />
          {` ${seqWholePath} ${scorchRequest.nodeType}`}
        </a>
        <div className="btn-group">
          <button
            className="btn btn-link btn-sm dropdown-toggle font-size-sm"
            type="button"
            id={`#dropdownMenuButton-${scorchRequest.id}`}
            data-toggle="dropdown"
            aria-expanded="false"
          >
            {showType}
          </button>
          <div className="dropdown-menu">
            <button
              id="ALL"
              className="dropdown-item"
              type="button"
              onClick={() => onShowJobs(scorchRequest, 'ALL')}
            >
              All
            </button>
            <button id="PENDING" className="dropdown-item" type="button" onClick={() => onShowJobs(scorchRequest, 'PENDING')}>Pending</button>
            <button id="ONGOING" className="dropdown-item" type="button" onClick={() => onShowJobs(scorchRequest, 'ONGOING')}>Ongoing</button>
            <button id="SUCCESS" className="dropdown-item" type="button" onClick={() => onShowJobs(scorchRequest, 'SUCCESS')}>Success</button>
            <button id="FAILURE" className="dropdown-item" type="button" onClick={() => onShowJobs(scorchRequest, 'FAILURE')}>Failure</button>
          </div>
        </div>
      </div>
    );
  }, [showJobRequestType, onLoadJobs, onShowJobs]);

  const renderJobList = useCallback((jobRequestList, pathLevel, scorchRequestId) => {
    let status = 'ALL';
    if (showJobRequestType[scorchRequestId]) {
      status = showJobRequestType[scorchRequestId];
    }

    let reqList = jobRequestList || [];
    if (status !== 'ALL') {
      reqList = jobRequestList.filter(jobRequest => jobRequest.status === status);
    }

    const canExecute = currentUser.canExecute;
    const paddingLeftLength = `${0.8 * (pathLevel + 1)}rem`;
    const rows = reqList.map(jobRequest => (
      <div
        className="row request-list-line"
        key={`subNode-${jobRequest.id}`}
      >
        {canExecute && (
          <div className="col-1 text-center">
            <input 
              type="checkbox" 
              checked={onChecked(jobRequest)} 
              onChange={event => onSelectScorchRequest(jobRequest, event)} 
            />
          </div>
        )}
        <div className="col-6">
          <div className="row">
            <div
              className="col-3"
              style={{ paddingLeft: paddingLeftLength }}
            >
              Job
            </div>
            <div className="col-5">
              <div>{getNodeRequestDetailLink(jobRequest)}</div>
            </div>
            <div className="col-4">
              <div>
                {`${formatTime(jobRequest.startTime) || 'N/A'} ~ ${formatTime(jobRequest.endTime) || 'N/A'}`}
              </div>
              <div className="text-muted">
                {`Time used: ${formatDuration(jobRequest.startTime, jobRequest.endTime) || 'N/A'}`}
              </div>
            </div>
          </div>
        </div>
        <div className="col-5">
          <div className="row">
            <div className="col-2">
              {jobRequest.username}
            </div>
            <div className="col-5">
              {jobRequest.executionSystem && (
                <a href={`/frontend/globalConfig/execution-system/detail/${jobRequest.executionSystem.id}`}>
                  {jobRequest.executionSystem.name}
                </a>
              )}
            </div>
            <div className="col-2">
              <div>
                <RequestStatusBadge status={jobRequest.status} />
              </div>
              <div className="text-muted">{jobRequest.stage}</div>
            </div>
            <div className="col-2" />
            <div className="col-1" />
          </div>
        </div>
      </div>
    ));
    return <div className="bg-light">{rows}</div>;
  }, [showJobRequestType, currentUser.canExecute, onChecked, onSelectScorchRequest, getNodeRequestDetailLink]);

  const renderPipelineRequestNodes = useCallback((scorchRequestList, childSubNodesParam, seqParentPath,
    pathLevel, parentReqId, dropDownFlagParam, jobRequestsParam) => {
    const canExecute = currentUser.canExecute;

    const rows = (scorchRequestList || []).map(scorchRequest => {
      let errorGoingNumber = 0;
      if ((scorchRequest.status === 'ONGOING')
        && ((scorchRequest.failureCount > 0) || (scorchRequest.ignoreCount > 0)
          || (scorchRequest.suberrorsCount > 0))) {
        if (scorchRequest.nodeType === 'BATCH') {
          errorGoingNumber = scorchRequest.failureCount + scorchRequest.ignoreCount;
        } else {
          errorGoingNumber = scorchRequest.suberrorsCount;
        }
      }

      let seqWholePath = scorchRequest.runningSequence;
      if (seqParentPath) {
        seqWholePath = `${seqParentPath}-${scorchRequest.runningSequence}`;
      }

      if (scorchRequest.id === 185898663) {
        console.log(scorchRequest);
      }
      let subNodeList = null;
      if (scorchRequest.nodeType === 'PIPELINE') {
        if (!childSubNodesParam || !childSubNodesParam[scorchRequest.uuid]) {
          subNodeList = <LoadingIndicator />;
        } else if (childSubNodesParam instanceof Error) {
          subNodeList = <ErrorAlert error={childSubNodesParam} />;
        } else {
          subNodeList = renderPipelineRequestNodes(
            childSubNodesParam[scorchRequest.uuid], childSubNodesParam, seqWholePath,
            pathLevel + 1, scorchRequest.id, dropDownFlagParam, jobRequestsParam,
          );
        }
      } else if (scorchRequest.nodeType === 'BATCH') {
        if (!jobRequestsParam || !jobRequestsParam[scorchRequest.id]) {
          subNodeList = <LoadingIndicator />;
        } else if (jobRequestsParam instanceof Error) {
          subNodeList = <ErrorAlert error={jobRequestsParam} />;
        } else {
          subNodeList = renderJobList(jobRequestsParam[scorchRequest.id],
            pathLevel + 1, scorchRequest.id);
        }
      }

      const paddingLeftLength = `${0.8 * pathLevel}rem`;
      const angle = dropDownFlagParam[scorchRequest.id] ? 'fa-angle-down' : 'fa-angle-right';

      let dropdownIcon = null;
      if (scorchRequest.nodeType === 'BATCH') {
        dropdownIcon = renderBatchDropdown(scorchRequest, seqWholePath, angle);
      }
      if (scorchRequest.nodeType === 'PIPELINE') {
        dropdownIcon = (
          <a
            type="button"
            className="btn btn-link btn-sm"
            data-toggle="collapse"
            href={`#collapse-${scorchRequest.id}`}
            role="button"
            aria-expanded="false"
            aria-controls={scorchRequest.id}
            onClick={() => onLoadSubNodes(scorchRequest)}
          >
            <i className={`fa fa-fw ${angle} ml-1`} />
            {` ${seqWholePath} ${scorchRequest.nodeType}`}
          </a>
        );
      }

      return (
        <div key={`subNode-${scorchRequest.id}`}>
          <div className="row request-list-line">
            {canExecute && (
              <div className="col-1 text-center">
                <input 
                  type="checkbox" 
                  checked={onChecked(scorchRequest)} 
                  onChange={event => onSelectScorchRequest(scorchRequest, event)} 
                />
              </div>
            )}
            <div className="col-6">
              <div className="row">
                <div
                  className="col-3"
                  style={{ paddingLeft: paddingLeftLength }}
                >
                  <div className="form-inline">
                    {dropdownIcon}
                  </div>
                </div>
                <div className="col-5">
                  <div>{getNodeRequestDetailLink(scorchRequest)}</div>
                </div>
                <div className="col-4">
                  <div>
                    {`${formatTime(scorchRequest.startTime) || 'N/A'} ~ ${formatTime(scorchRequest.endTime) || 'N/A'}`}
                  </div>
                  <div className="text-muted">
                    {`Time used: ${formatDuration(scorchRequest.startTime, scorchRequest.endTime) || 'N/A'}`}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-5">
              <div className="row">
                <div className="col-2">
                  {scorchRequest.username}
                </div>
                <div className="col-5">
                  <div className="text-code">
                    <strong>{scorchRequest.totalCount}</strong>
                    <span className="text-muted px-1">/</span>
                    <span className="text-muted">{scorchRequest.pendingCount}</span>
                    <span className="text-muted px-1">/</span>
                    <span className="text-muted">{scorchRequest.ongoingCount}</span>
                    <span className="text-muted px-1">/</span>
                    <span className="text-success">{scorchRequest.successCount}</span>
                    <span className="text-muted px-1">/</span>
                    <span className="text-danger">{scorchRequest.failureCount}</span>
                    <span className="text-muted px-1">/</span>
                    <span className="text-warning">{scorchRequest.ignoreCount}</span>
                  </div>
                </div>
                <div className="col-2">
                  <RequestStatusBadge status={scorchRequest.status} errorGoingNumber={errorGoingNumber} />
                </div>
                {canExecute && (
                  <div className="col-2">
                    {isNotDone(scorchRequest) && (
                      <button 
                        type="button" 
                        className="btn btn-outline-primary btn-sm" 
                        onClick={() => onCancelRequest(scorchRequest)}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                )}
                <div className="col-1" />
              </div>
            </div>
          </div>
          <div
            className="collapse bg-light"
            id={`collapse-${scorchRequest.id}`}
          >
            {subNodeList}
          </div>
        </div>
      );
    });
    return <div className="bg-light">{rows}</div>;
  }, [currentUser.canExecute, renderBatchDropdown, onLoadSubNodes, onChecked, onSelectScorchRequest, getNodeRequestDetailLink, isNotDone, onCancelRequest]);

  const renderPipelineRequestList = useCallback((pipelineRequestPageParam, childSubNodesParam, dropDownFlagParam, jobRequestsParam) => {
    const pipelineRequestList = pipelineRequestPageParam.content;
    const canExecute = currentUser.canExecute;

    const rows = (pipelineRequestList || []).map(pipelineRequest => {
      let pandoraBuildKey = null;
      let targetVersion = null;
      if (pipelineRequest.overriddenParameters.groups
        && pipelineRequest.overriddenParameters.groups.cobDateParam) {
        pandoraBuildKey = pipelineRequest.overriddenParameters.groups
          .cobDateParam.entries.PANDORA_BUILD_KEY || '';
        targetVersion = pipelineRequest.overriddenParameters.groups
          .cobDateParam.entries.VS_LIBRARY_TAR || '';
      }
      const process = getBatchRequestProgress(pipelineRequest);
      const runBar = (
        <div
          className="progress-bar"
          role="progressbar"
          aria-valuenow={process}
          aria-valuemin="0"
          aria-valuemax="100"
          style={{ width: `${process}%` }}
        />
      );

      let nodeList;
      if (!childSubNodesParam || Object.keys(childSubNodesParam).length === 0) {
        nodeList = <LoadingIndicator />;
      } else if (childSubNodesParam instanceof Error) {
        nodeList = <ErrorAlert error={childSubNodesParam} />;
      } else {
        nodeList = renderPipelineRequestNodes(
          childSubNodesParam[pipelineRequest.uuid], childSubNodesParam,
          null, 1, pipelineRequest.id, dropDownFlagParam, jobRequestsParam,
        );
      }

      let errorGoingNumber = 0;
      if ((pipelineRequest.status === 'ONGOING')
        && (pipelineRequest.failureCount > 0 || (pipelineRequest.ignoreCount > 0)
          || (pipelineRequest.suberrorsCount > 0))) {
        errorGoingNumber = pipelineRequest.suberrorsCount;
      }
      const angle = dropDownFlagParam[pipelineRequest.id] ? 'fa-angle-down' : 'fa-angle-right';

      return (
        <div>
          <div
            className="row request-list-line"
            key={pipelineRequest.id}
          >
            {canExecute && (
              <div className="col-1 text-center">
                <input 
                  type="checkbox" 
                  checked={onChecked(pipelineRequest)} 
                  onChange={event => onSelectScorchRequest(pipelineRequest, event)} 
                />
              </div>
            )}
            <div className="col-6">
              <div className="row">
                <div className="col-3 none-padding-left">
                  <a
                    type="button"
                    className="btn btn-link none-padding-left"
                    data-toggle="collapse"
                    href={`#collapse-${pipelineRequest.id}`}
                    role="button"
                    aria-expanded="false"
                    aria-controls={pipelineRequest.id}
                    onClick={() => onShowSubNodes(pipelineRequest)}
                  >
                    <i className={`fa fa-fw ${angle} ml-1`} />
                    {' Root'}
                  </a>
                </div>
                <div className="col-5">
                  <div className="form-inline">
                    <Link to={`/pipeline-request/detail/${pipelineRequest.id}`}>
                      {truncateChars(pipelineRequest.name, 80)}
                    </Link>
                  </div>
                  <div className="text-muted">
                    UUID: <code>{pipelineRequest.uuid}</code>
                  </div>
                  {pandoraBuildKey && (
                    <div className="text-muted">
                      Pandora Build Key: <code>{pandoraBuildKey}</code>
                    </div>
                  )}
                  {targetVersion && (
                    <div className="text-muted">
                      Tar Vers: <i><small>{targetVersion}</small></i>
                    </div>
                  )}
                  {pipelineRequest.runningSequence > 0 && (
                    <div>
                      <Link to={`/pipeline-request/uuid/${pipelineRequest.ticketId}`}>
                        <strong>Parent:</strong>
                        {` ${pipelineRequest.ticketId}`}
                      </Link>
                    </div>
                  )}
                  {pipelineRequest.runningSequence > 0 && (
                    <div className="text-muted">
                      Seq: <code>{pipelineRequest.runningSequence}</code>
                    </div>
                  )}
                </div>
                <div className="col-4">
                  <div>
                    {`${formatTime(pipelineRequest.startTime)} ~ ${formatTime(pipelineRequest.endTime) || 'N/A'}`}
                  </div>
                  <div className="text-muted">
                    {`Time used: ${formatDuration(pipelineRequest.startTime, pipelineRequest.endTime) || 'N/A'}`}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-5">
              <div className="row">
                <div className="col-2">
                  {pipelineRequest.username}
                </div>
                <div className="col-5">
                  <div className="text-code">
                    <strong>{pipelineRequest.totalCount}</strong>
                    <span className="text-muted px-1">/</span>
                    <span className="text-muted">{pipelineRequest.pendingCount}</span>
                    <span className="text-muted px-1">/</span>
                    <span className="text-muted">{pipelineRequest.ongoingCount}</span>
                    <span className="text-muted px-1">/</span>
                    <span className="text-success">{pipelineRequest.successCount}</span>
                    <span className="text-muted px-1">/</span>
                    <span className="text-danger">{pipelineRequest.failureCount}</span>
                    <span className="text-muted px-1">/</span>
                    <span className="text-warning">{pipelineRequest.ignoreCount}</span>
                  </div>
                  <div
                    className="progress mt-1"
                    style={{ height: '.5rem' }}
                  >
                    {runBar}
                  </div>
                </div>
                <div className="col-2">
                  <RequestStatusBadge status={pipelineRequest.status} errorGoingNumber={errorGoingNumber} />
                </div>
                <div className="col-2">
                  {canExecute && isNotDone(pipelineRequest) && (
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => onCancelRequest(pipelineRequest)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
                <div className="col-1">
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    data-toggle="modal"
                    data-target="#editSupportNotesModal"
                    onClick={() => onClickSupportNotes(pipelineRequest)}
                  >
                    {pipelineRequest.supportNotes
                      ? <i className="fa fa-fw fa-bookmark" />
                      : <i className="fa fa-fw fa-bookmark-o" />
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div
            className="collapse bg-light"
            id={`collapse-${pipelineRequest.id}`}
          >
            {nodeList}
          </div>
        </div>
      );
    });

    return (
      <div>
        <div className="row border-bottom border-dark request-list-line">
          {canExecute && (
            <div className="col-1">
              <div className="btn-group">
                <button
                  data-toggle="dropdown"
                  className="btn btn-primary btn-sm dropdown-toggle"
                  type="button"
                  id="dropdown-menu"
                >
                  ACTIONS
                  <span className="caret" />
                </button>
                <div className="dropdown-menu">
                  <button
                    id="SELECT_ALL_JOBS"
                    className="dropdown-item"
                    type="button"
                    onClick={onSelectScorchRequestAll}
                  >
                    Select All Nodes
                  </button>
                  <button id="CLEAR" className="dropdown-item" type="button" onClick={onClear}>Clear</button>
                  <button id="CANCEL" className="dropdown-item" type="button" onClick={onTriggerCancelButton}>Cancel Request</button>
                  <button id="RERUN_FAILED_JOBS" className="dropdown-item" type="button" onClick={onRerunSelectedFailedRequests}>Rerun Failed Jobs</button>
                  <button id="MARK_SUCCESS" className="dropdown-item" type="button" onClick={onForceOKSelectedRequests}>Mark As Success</button>
                  <button id="RERUN_PIPELINE_REQ" className="dropdown-item" type="button" onClick={onRerunSelectedRequests}>Rerun Pipeline Request</button>
                </div>
              </div>
            </div>
          )}
          <div className="col-6">
            <div className="row">
              <div className="col-3">hierarchy</div>
              <div className="col-5">Name</div>
              <div className="col-4">
                Start Time <span className="px-1">/</span> End Time
              </div>
            </div>
          </div>
          <div className="col-5">
            <div className="row">
              <div className="col-2">User</div>
              <div className="col-5">
                <abbr title="Counts of job requests: total / pending / ongoing / success / failure">
                  Counts
                </abbr>
              </div>
              <div className="col-2">Status</div>
              <div className="col-2">Actions</div>
              <div className="col-1">
                <span role="img" aria-label="notes">
                  <i className="fa fa-fw fa-book" />
                </span>
              </div>
            </div>
          </div>
        </div>
        {rows}
      </div>
    );
  }, [currentUser.canExecute, getBatchRequestProgress, renderPipelineRequestNodes, onChecked, onSelectScorchRequest, onShowSubNodes, isNotDone, onCancelRequest, onClickSupportNotes, onSelectScorchRequestAll, onClear, onTriggerCancelButton, onRerunSelectedFailedRequests, onForceOKSelectedRequests, onRerunSelectedRequests]);

  const renderFilteringOptions = useCallback(() => {
    const filteringOptionsData = Object.assign({}, query, filteringOptions);
    let minCreateTime = null;
    if (filteringOptionsData.minCreateTime) {
      minCreateTime = new Date(filteringOptionsData.minCreateTime);
    }
    let maxCreateTime = null;
    if (filteringOptionsData.maxCreateTime) {
      maxCreateTime = new Date(filteringOptionsData.maxCreateTime);
    }

    if (filteringOptionsData.showRootRequest === 'true') {
      filteringOptionsData.showRootRequest = true;
    }
    if (filteringOptionsData.showRootRequest === 'false') {
      filteringOptionsData.showRootRequest = false;
    }

    return (
      <aside>
        <h2 className="display-6">Filtering Options</h2>
        <div className="card">
          <div className="card-body">
            <div className="form-group">
              <label htmlFor="query-name-keyword">Name Contains:</label>
              <input 
                id="query-name-keyword" 
                className="form-control" 
                value={filteringOptionsData.name || ''} 
                onChange={event => onChangeProperty('name', event)} 
              />
            </div>
            <div className="form-group">
              <label htmlFor="query-batch-uuid">Pipeline UUID:</label>
              <input 
                id="query-batch-uuid" 
                className="form-control" 
                value={filteringOptionsData.pipelineRequestUUID || ''} 
                onChange={event => onChangeProperty('pipelineRequestUUID', event)} 
              />
            </div>
            <div className="form-group">
              <label htmlFor="query-min-create-time">From Time:</label>
              <DatePicker 
                id="query-min-create-time" 
                className="form-control" 
                selected={minCreateTime} 
                onChange={selected => onChangeCreateTimeRange('minCreateTime', selected)} 
                dateFormat="yyyy-MM-dd HH:mm" 
                showTimeSelect 
                timeFormat="HH:mm" 
                timeIntervals={30} 
                timeCaption="time" 
              />
            </div>
            <div className="form-group">
              <label htmlFor="query-max-create-time">Till Time:</label>
              <DatePicker 
                id="query-max-create-time" 
                className="form-control" 
                selected={maxCreateTime} 
                onChange={selected => onChangeCreateTimeRange('maxCreateTime', selected)} 
                dateFormat="yyyy-MM-dd HH:mm" 
                showTimeSelect 
                timeFormat="HH:mm" 
                timeIntervals={30} 
                timeCaption="time" 
              />
            </div>
            <div className="form-group">
              <label htmlFor="query-status">Status :</label>
              <select
                id="query-status"
                className="form-control"
                value={filteringOptionsData.status || ''}
                onChange={event => onChangeProperty('status', event)}
              >
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="ONGOING">Ongoing</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILURE">Failure</option>
                <option value="FAILED_IGNORE">Failed Ignore</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="query-pandora-build">Pandora Build Key:</label>
              <input 
                id="query-pandora-build" 
                className="form-control" 
                value={filteringOptionsData.pandoraBuildKey || ''} 
                onChange={event => onChangeProperty('pandoraBuildKey', event)} 
              />
            </div>
            <div className="form-group form-inline">
              <label htmlFor="query-top-request" className="mr-3">
                Show Root Request Only:
              </label>
              <div className="custom-control custom-checkbox" id="query-top-request">
                <input 
                  type="checkbox" 
                  className="custom-control-input" 
                  id="customCheck1" 
                  checked={!!filteringOptionsData.showRootRequest} 
                  onChange={onChangeShowRootRequestCheck} 
                />
                <label className="custom-control-label" htmlFor="customCheck1" />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="query-username">Launched by:</label>
              <input 
                id="query-username" 
                className="form-control" 
                value={filteringOptionsData.username || ''} 
                onChange={event => onChangeProperty('username', event)} 
              />
              {currentUser.username && (
                <button className="anchor" type="button" onClick={onClickLaunchedByMe}>
                  Launched by me
                </button>
              )}
            </div>
            <div className="form-group">
              <button
                type="button"
                className="btn btn-primary mr-2"
                onClick={onApplyFilteringOptions}
              >
                Apply
              </button>
              <button type="button" className="btn btn-light" onClick={onResetFilteringOptions}>
                Reset
              </button>
            </div>
          </div>
        </div>
      </aside>
    );
  }, [query, filteringOptions, currentUser.username, onChangeProperty, onChangeCreateTimeRange, onChangeShowRootRequestCheck, onClickLaunchedByMe, onApplyFilteringOptions, onResetFilteringOptions]);

  const renderPipelineRequestStats = useCallback(() => {
    if (!pipelineRequestStats) {
      return null;
    }

    let totalCount = 0;
    const chartData = {};

    const items = Object.keys(pipelineRequestStats).map((status) => {
      const count = pipelineRequestStats[status];
      const color = colorForStatus(status);
      chartData[status] = {
        value: count,
        color: color,
      };
      totalCount += count;
      return (
        <li
          key={`stats-${status}`}
          style={{ color: color }}
        >
          <i className="fa fa-fw fa-circle mr-1" />
          {`${status}: `}
          <strong>{count}</strong>
        </li>
      );
    });

    if (totalCount <= 0) {
      return (
        <aside>
          <h2 className="display-6">Stats</h2>
          <div className="alert alert-warning">No pipeline requests found using this query.</div>
        </aside>
      );
    }

    return (
      <aside>
        <h2 className="display-6">Stats</h2>
        <div className="card">
          <div className="card-body">
            <div className="row">
              <div className="col my-2 d-flex justify-content-center">
                <Doughnut data={chartData} size="10rem" />
              </div>
              <div className="col my-2">
                <ul className="list-unstyled">{items}</ul>
              </div>
            </div>
          </div>
          <div className="card-footer text-muted">
            Total <strong>{totalCount}</strong> batch requests
          </div>
        </div>
      </aside>
    );
  }, [pipelineRequestStats, colorForStatus]);

  if (pipelineRequestPage === null) {
    return <LoadingIndicator />;
  }
  if (pipelineRequestPage instanceof Error) {
    return <ErrorAlert error={pipelineRequestPage} />;
  }

  const pipelineRequestListComponent = renderPipelineRequestList(
    pipelineRequestPage, childSubNodes, dropDownFlag, jobRequests,
  );
  const filteringOptionsComponent = renderFilteringOptions();
  const pipelineRequestStatsComponent = renderPipelineRequestStats();

  return (
    <div style={{ fontSize: '15px' }}>
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/">Monitoring</Link>
          </li>
          <li className="breadcrumb-item active">Pipeline Requests</li>
        </ol>
      </nav>
      <h2 className="display-4">Pipeline Requests</h2>
      <div className="row">
        <div
          className="col-9"
          style={{ wordBreak: 'break-all' }}
        >
          {pipelineRequestListComponent}
          <Paginator page={pipelineRequestPage} onClickPage={onClickPage} />
        </div>
        <div className="col-3">
          {filteringOptionsComponent}
          {pipelineRequestStatsComponent}
        </div>
      </div>
      <div
        className="modal fade"
        id="editSupportNotesModal"
        tabIndex="-1"
        role="dialog"
        aria-labelledby="Update-Support-Notes"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4
                className="modal-title"
                id="Update-SupportNotes"
              >
                Update Support Notes
              </h4>
              <button
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="modal-body">
              <h4
                className="modal-title"
                id="SupportNotesPipelineName"
              >
                {currentlySupportingPipeline.name || ''}
              </h4>
              <div className="form-group">
                <textarea 
                  className="form-control" 
                  id="event-description" 
                  name="description" 
                  rows="6" 
                  value={currentlySupportingPipeline.supportNotes || ''} 
                  onChange={event => onChangeSupportNote('supportNotes', event)} 
                />
              </div>
              <h4>Choose from following tags to improve stats</h4>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-dismiss="modal"
                >
                  Close
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  data-dismiss="modal" 
                  onClick={onSubmitSupportNotes}
                >
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

PipelineRequestList.propTypes = {
  currentUser: ScorchPropTypes.currentUser().isRequired,
};

export default withCurrentUser(PipelineRequestList);
