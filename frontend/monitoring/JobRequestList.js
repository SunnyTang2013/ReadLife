import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import { isEqual } from 'lodash';
import queryString from 'query-string';
import DatePicker from 'react-datepicker';

import { toast } from 'react-toastify';
import monitoring from '../backend/monitoring';
import jobExecution from '../backend/jobExecution';
import globalConfig from '../backend/globalConfig';
import RouterPropTypes from '../proptypes/router';
import ScorchPropTypes from '../proptypes/scorch';
import colors from '../utils/colors';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';
import Doughnut from '../components/Doughnut';
import { withCurrentUser } from '../components/currentUser';

import 'react-datepicker/dist/react-datepicker.css';

import JobRequestPage, { isJobRequestDone } from './components/JobRequestPage';
import ParametersTable from '../components/ParametersTable';
import { getAssignmentGroupFromLocalStorage, sortDataArray } from '../utils/utilities';
import Alert from '../components/Alert';
import AssignmentGroupChooseModal from './components/AssignmentGroupChooseModal';

function JobRequestList({ currentUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  // Static helper functions
  const last24Hours = useCallback(() => {
    let currentTime = new Date().getTime();
    currentTime -= currentTime % 1000;
    return new Date(currentTime - 24 * 60 * 60 * 1000);
  }, []);

  const getDefaultQuery = useCallback(() => {
    return {
      nameKeyword: '',
      nameNotLike: '',
      jobUri: '',
      batchUuid: '',
      minCreateTime: last24Hours().toISOString(),
      maxCreateTime: '',
      status: '',
      username: '',
      executionSystemId: '',
      overrun: false,
      enableFilterByParameters: false,
      resolvedParameters: { entries: {} },
      extraInfo: { entries: {} },
      sort: 'createTime,desc',
      page: 0,
      size: 50,
      jobScope: '',
      jobConsumer: '',
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

  const isUndetermined = useCallback((jobRequest) => {
    return jobRequest.status === 'SUBMITTED' || jobRequest.status === 'RUNNING';
  }, []);

  const onRerunJobRequest = useCallback((jobRequest) => {
    if (!isJobRequestDone(jobRequest)) {
      return;
    }

    jobExecution.resubmitJobRequest(jobRequest.id)
      .then((retJobRequest) => {
        toast.success(`Job has been submitted, status is: ${retJobRequest.status}`);
      })
      .catch((error) => {
        toast.error(`Failed to submit job: ${error}`);
      });
  }, []);

  // State management
  const [filteringOptions, setFilteringOptions] = useState({});
  const [data, setData] = useState(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState('');
  const [queryName, setQueryName] = useState('');
  const [localSavedQuery, setLocalSavedQuery] = useState([]);
  const [executionSystemList, setExecutionSystemList] = useState([]);
  const [showAssignmentGroupModal, setShowAssignmentGroupModal] = useState(false);

  // Memoized query object
  const query = useMemo(() => {
    const defaultQuery = getDefaultQuery();
    const assignmentGroup = getAssignmentGroupFromLocalStorage();
    if (assignmentGroup === '') {
      defaultQuery.assignmentGroup = 'GDM';
    } else {
      defaultQuery.assignmentGroup = assignmentGroup;
    }
    const parsedQuery = queryString.parse(location.search);
    return Object.assign({}, defaultQuery, parsedQuery);
  }, [location.search, getDefaultQuery]);

  // Helper functions
  const getQueryUrl = useCallback((overrides) => {
    const nextQuery = Object.assign({}, query, overrides);
    // Remove empty values from the query.
    Object.keys(nextQuery).forEach((key) => {
      if (nextQuery[key] === null || nextQuery[key] === '') {
        delete nextQuery[key];
      } else if (key === 'resolvedParameters' && typeof nextQuery[key] === 'object') {
        nextQuery[key] = JSON.stringify(nextQuery.resolvedParameters);
      }
    });
    return `${location.pathname}?${queryString.stringify(nextQuery)}`;
  }, [query, location.pathname]);

  const onKeyDown = useCallback((e) => {
    if (e.keyCode === 13 && e.target.id && e.target.id.indexOf('query-') !== -1) {
      onApplyFilteringOptions();
    }
  }, []);

  const onChangeSortingOrdering = useCallback(({ sorting, ordering }) => {
    if (data === null || data instanceof Error) {
      console.log('Content is not yet loaded: cannot toggle ordering.');
      return;
    }
    const queryOverrides = {
      sort: `${sorting},${ordering}`,
      page: 0,
    };
    const url = getQueryUrl(queryOverrides);
    navigate(url);
  }, [data, getQueryUrl, navigate]);

  const onClickPage = useCallback((page) => {
    const url = getQueryUrl({ page });
    navigate(url);
  }, [getQueryUrl, navigate]);

  const onSaveFilteringOptions = useCallback(() => {
    if (!queryName) {
      setSaveErrorMessage('Please Input Query Name!');
      return;
    }

    const queryOverrides = Object.assign({}, filteringOptions);
    Object.keys(queryOverrides).forEach((key) => {
      if (key !== 'overrun' && key !== 'enableFilterByParameters' && key !== 'resolvedParameters') {
        queryOverrides[key] = (queryOverrides[key] || '').trim();
      }
    });
    queryOverrides.page = 0;
    const url = getQueryUrl(queryOverrides);

    const labelNew = { displayName: queryName, url: url, createTime: new Date().toISOString() };
    let jobReqQueryLabels = localStorage.jobReqQueryLabels;
    if (!jobReqQueryLabels) {
      jobReqQueryLabels = [];
    } else {
      jobReqQueryLabels = JSON.parse(jobReqQueryLabels);
    }
    const index = jobReqQueryLabels.indexOf(
      jobReqQueryLabels.find(query => query.displayName === queryName),
    );
    if (index > -1) {
      jobReqQueryLabels.splice(index, 1);
    }
    if (jobReqQueryLabels.length > 5) {
      const copyErdQueries = sortDataArray([...jobReqQueryLabels], item => item.createTime);
      const outDateIndex = jobReqQueryLabels.indexOf(
        jobReqQueryLabels.find(query => query.displayName === copyErdQueries[0].displayName),
      );
      jobReqQueryLabels.splice(outDateIndex, 1);
    }
    jobReqQueryLabels.push(labelNew);

    localStorage.jobReqQueryLabels = JSON.stringify(jobReqQueryLabels);
    setLocalSavedQuery(jobReqQueryLabels);
  }, [queryName, filteringOptions, getQueryUrl]);

  const onChangeQueryName = useCallback((event) => {
    setQueryName(event.target.value);
  }, []);

  const onChangeNameKeyword = useCallback((event) => {
    const nameKeyword = event.target.value;
    setFilteringOptions(prevState => ({ ...prevState, nameKeyword }));
  }, []);

  const onChangeNameNotLikeKeyword = useCallback((event) => {
    const nameNotLike = event.target.value;
    setFilteringOptions(prevState => ({ ...prevState, nameNotLike }));
  }, []);

  const onChangeJobUri = useCallback((event) => {
    const jobUri = event.target.value;
    setFilteringOptions(prevState => ({ ...prevState, jobUri }));
  }, []);

  const onChangeBatchUuid = useCallback((event) => {
    const batchUuid = event.target.value;
    setFilteringOptions(prevState => ({ ...prevState, batchUuid }));
  }, []);

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

  const onChangeStatus = useCallback((event) => {
    const status = event.target.value;
    setFilteringOptions(prevState => ({ ...prevState, status }));
  }, []);

  const onChangeUsername = useCallback((event) => {
    const username = event.target.value;
    setFilteringOptions(prevState => ({ ...prevState, username }));
  }, []);

  const onSelectExecutionSystem = useCallback((event) => {
    const executionSystemId = event.target.value;
    setFilteringOptions(prevState => ({ ...prevState, executionSystemId }));
  }, []);

  const onSelectJobScope = useCallback((event) => {
    const jobScope = event.target.value;
    setFilteringOptions(prevState => ({ ...prevState, jobScope }));
  }, []);

  const onChangeJobConsumer = useCallback((event) => {
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
    setFilteringOptions(prevState => ({ ...prevState, jobConsumer }));
  }, []);

  const onChangeOverrunChecked = useCallback((event) => {
    const overrun = event.target.checked;
    setFilteringOptions(prevState => ({ ...prevState, overrun }));
  }, []);

  const onChangeParametersFilterChecked = useCallback((event) => {
    const enableFilterByParameters = event.target.checked;
    setFilteringOptions(prevState => ({ ...prevState, enableFilterByParameters }));
  }, []);

  const onChangeResolvedParameters = useCallback((resolvedParameters) => {
    setFilteringOptions(prevState => ({ ...prevState, resolvedParameters }));
  }, []);

  const onClickLaunchedByMe = useCallback(() => {
    if (currentUser && currentUser.username) {
      const username = currentUser.username;
      setFilteringOptions(prevState => ({ ...prevState, username }));
    }
  }, [currentUser]);

  const onApplyFilteringOptions = useCallback(() => {
    const queryOverrides = Object.assign({}, filteringOptions);
    Object.keys(queryOverrides).forEach((key) => {
      if (key !== 'overrun' && key !== 'enableFilterByParameters' && key !== 'resolvedParameters') {
        queryOverrides[key] = (queryOverrides[key] || '').trim();
      }
    });
    queryOverrides.page = 0; // Need to reset page number to 0.
    const url = getQueryUrl(queryOverrides);
    navigate(url);
  }, [filteringOptions, getQueryUrl, navigate]);

  const onFilterByStatus = useCallback((status) => {
    const nextQuery = getQueryUrl({ status });
    navigate(nextQuery);
  }, [getQueryUrl, navigate]);

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
    const url = getQueryUrl(queryOverrides);
    navigate(url);
  }, [getDefaultQuery, getQueryUrl, navigate]);

  const onCancelJobRequest = useCallback((jobRequest) => {
    if (jobRequest.stage === 'FAILED' || jobRequest.stage === 'SUCCEEDED') {
      return;
    }
    jobExecution.cancelJobRequest(jobRequest.id)
      .then((cancelledJobRequest) => {
        const jobRequestPage = data.jobRequestPage;
        const jobRequestList = jobRequestPage.content;
        const newJobRequestList = jobRequestList.map((request) => {
          if (request.id === cancelledJobRequest.id) {
            return cancelledJobRequest;
          }
          return request;
        });
        const newJobRequestPage = Object.assign({}, jobRequestPage, { content: newJobRequestList });
        const newData = Object.assign({}, data, { jobRequestPage: newJobRequestPage });
        setData(newData);
      });
  }, [data]);

  const onResetJobRequestPage = useCallback((jobRequest) => {
    const jobRequestPage = data.jobRequestPage;
    const jobRequestList = jobRequestPage.content;
    const newJobRequestList = jobRequestList.map((request) => {
      if (request.id === jobRequest.id) {
        return jobRequest;
      }
      return request;
    });
    const newJobRequestPage = Object.assign({}, jobRequestPage, { content: newJobRequestList });
    const newData = Object.assign({}, data, { jobRequestPage: newJobRequestPage });
    setData(newData);
  }, [data]);

  const onRerunConsumerPiece = useCallback((jobRequest) => {
    let allowRerunConsumer = null;
    Object.values(jobRequest.stageTransition).forEach(stage => {
      if (stage === 'FETCHING_OUTPUTS_DONE') {
        allowRerunConsumer = true;
      }
    });

    if (!allowRerunConsumer) {
      toast.warn(`This job has nothing to consumer: #${jobRequest.id}:${jobRequest.name}`);
    } else {
      jobExecution.rerunConsumerPiece(jobRequest.id)
        .then((rerunSelectedJobRequest) => {
          onResetJobRequestPage(rerunSelectedJobRequest);
        });
    }
  }, [onResetJobRequestPage]);

  const onRerunJobRequestList = useCallback((onRerunJobRequestListParam) => {
    if (onRerunJobRequestListParam) {
      const jobRequestListWithBatchRequest = onRerunJobRequestListParam.filter(
        jobRequest => jobRequest.batchUuid !== '00000000-0000-0000-0000-000000000000',
      );
      let batchUUIDs = [];
      if (jobRequestListWithBatchRequest && jobRequestListWithBatchRequest.length > 0) {
        batchUUIDs = jobRequestListWithBatchRequest.map(jobRequest => jobRequest.batchUuid);
      }
      Promise.all(onRerunJobRequestListParam.map((jobRequest) => {
        if (!isJobRequestDone(jobRequest)) {
          return jobRequest;
        }

        return jobExecution.resubmitJobRequest(jobRequest.id);
      }))
        .then((resultList) => {
          resultList.forEach((retJobRequest) => {
            toast.success(`Job has been submitted, status is: ${retJobRequest.status}`);
            onResetJobRequestPage(retJobRequest);
          });
          forceUpdateBatchRequestStatus(batchUUIDs);
        }).catch((error) => {
          setData(error);
        });
    }
  }, [onResetJobRequestPage]);

  const onForceOKSelectedJobRequests = useCallback((selectedJobRequestList) => {
    if (selectedJobRequestList) {
      const jobRequestListWithBatchRequest = selectedJobRequestList.filter(
        jobRequest => jobRequest.batchUuid !== '00000000-0000-0000-0000-000000000000',
      );
      let batchUUIDs = [];
      if (jobRequestListWithBatchRequest && jobRequestListWithBatchRequest.length > 0) {
        batchUUIDs = jobRequestListWithBatchRequest.map(jobRequest => jobRequest.batchUuid);
      }
      Promise.all(selectedJobRequestList.map((jobRequest) => {
        if (isJobRequestDone(jobRequest)) {
          return jobRequest;
        }

        return jobExecution.forceSuccessJobRequest(jobRequest.id);
      }))
        .then((resultList) => {
          resultList.forEach((retJobRequest) => {
            toast.success(`Job has been forced, status is: ${retJobRequest.status}`);
            onResetJobRequestPage(retJobRequest);
          });
          forceUpdateBatchRequestStatus(batchUUIDs);
        }).catch((error) => {
          setData(error);
        });
    }
  }, [onResetJobRequestPage]);

  const onForceExecuteRequestList = useCallback((forceExecuteRequestList) => {
    if (forceExecuteRequestList) {
      const jobRequestListWithBatchRequest = forceExecuteRequestList.filter(
        jobRequest => jobRequest.batchUuid !== '00000000-0000-0000-0000-000000000000',
      );
      let batchUUIDs = [];
      if (jobRequestListWithBatchRequest && jobRequestListWithBatchRequest.length > 0) {
        batchUUIDs = jobRequestListWithBatchRequest.map(jobRequest => jobRequest.batchUuid);
      }
      Promise.all(forceExecuteRequestList.map((jobRequest) => {
        if (jobRequest.status !== 'PENDING') {
          return jobRequest;
        }

        return jobExecution.forceExecuteJobRequest(jobRequest.id);
      }))
        .then((resultList) => {
          resultList.forEach((retJobRequest) => {
            toast.success(`Job has been submitted, status is: ${retJobRequest.status}`);
            onResetJobRequestPage(retJobRequest);
          });
          forceUpdateBatchRequestStatus(batchUUIDs);
        }).catch((error) => {
          setData(error);
        });
    }
  }, [onResetJobRequestPage]);

  const onShowAssignmentGroupModal = useCallback((flag) => {
    setShowAssignmentGroupModal(flag);
    setData(null);
    // loadData will be called in useEffect
  }, []);

  const onChooseAssignmentGroup = useCallback((event) => {
    const assignmentGroup = event.target.value;
    localStorage.setItem('assignmentGroupOnScorchRequest', assignmentGroup);
    setFilteringOptions(prevState => ({ ...prevState, assignmentGroup }));
  }, []);


  const loadData = useCallback(() => {
    console.log('Loading job requests and stats...');
    const assignmentGroup = getAssignmentGroupFromLocalStorage();
    if (assignmentGroup === '') {
      setShowAssignmentGroupModal(true);
    } else {
      setShowAssignmentGroupModal(false);
    }

    let jobReqQueryLabels = localStorage.jobReqQueryLabels;
    if (!jobReqQueryLabels) {
      jobReqQueryLabels = [];
    } else {
      jobReqQueryLabels = JSON.parse(jobReqQueryLabels);
    }
    setLocalSavedQuery(jobReqQueryLabels);

    const jobRequestPagePromise = monitoring.getJobRequestList(query);
    const jobRequestStatsPromise = monitoring.getJobRequestStats(query);
    const executionSystemListPromise = globalConfig.getExecutionSystemList();
    Promise.all([jobRequestPagePromise, jobRequestStatsPromise, executionSystemListPromise])
      .then(([jobRequestPage, jobRequestStats, executionSystemListResult]) => {
        setData({ jobRequestPage, jobRequestStats });
        setExecutionSystemList(executionSystemListResult);
      })
      .catch((error) => {
        setData(error);
      });
  }, [query]);

  const forceUpdateBatchRequestStatus = useCallback((batchRequestIds) => {
    if (batchRequestIds) {
      monitoring.forceUpdateBatchRequestListByUUIDList(batchRequestIds)
        .then(() => {
          toast.success('Related batches updated');
        });
    }
  }, []);

  const clearAndLoadData = useCallback(() => {
    setFilteringOptions({});
    setData(null);
  }, []);

  const queryAndUpdateJobRequests = useCallback(() => {
    if (data === null || data instanceof Error) {
      return;
    }
    const { jobRequestPage } = data;
    if (!jobRequestPage) {
      return;
    }

    const jobRequestList = jobRequestPage.content;
    const found = jobRequestList.find(jobRequest => isUndetermined(jobRequest));
    if (!found) {
      return;
    }

    const jobRequestIds = jobRequestList.map(jobRequest => jobRequest.id);
    monitoring.queryAndUpdateJobRequestList(jobRequestIds)
      .then((content) => {
        const updatedJobRequestPage = Object.assign({}, jobRequestPage, { content });
        setData(prevState => ({
          ...prevState,
          jobRequestPage: updatedJobRequestPage
        }));
      });
  }, [data, isUndetermined]);

  const renderJobRequestStats = useCallback(() => {
    if (data === null || data instanceof Error) {
      return null;
    }
    const { jobRequestStats } = data;
    if (!jobRequestStats) {
      return null;
    }

    let totalCount = 0;
    const chartData = {};

    const $items = Object.keys(jobRequestStats).map((status) => {
      const count = jobRequestStats[status];
      const color = colorForStatus(status);
      chartData[status] = {
        value: count,
        color: color,
      };
      totalCount += count;
      return (
        <li key={`stats-${status}`} style={{ color: color }}>
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
          <div className="alert alert-warning">No job requests found using this query.</div>
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
                <ul className="list-unstyled">{$items}</ul>
              </div>
            </div>
          </div>
          <div className="card-footer text-muted">
            Total <strong>{totalCount}</strong> job requests
          </div>
        </div>
      </aside>
    );
  }, [data, colorForStatus]);

  const renderFilteringOptions = useCallback(() => {
    const $savedQuery = localSavedQuery.map(savedQuery =>
      <Link 
        key={savedQuery.displayName} 
        className="badge badge-primary mr-1" 
        to={savedQuery.url}
      >
        {savedQuery.displayName}
      </Link>
    );

    const $executionSystemsOptions = executionSystemList.map(executionSystem =>
      <option 
        key={executionSystem.id} 
        value={executionSystem.id}
      >
        {executionSystem.name}
      </option>
    );
    $executionSystemsOptions.unshift(
      <option key="" value="">----</option>
    );

    const filtering = Object.assign({}, query, filteringOptions);

    const assignmentGroup = getAssignmentGroupFromLocalStorage();

    const badge = (
      <span className="badge badge-success ml-2">
        <i className="fa fa-check-circle-o fa-2x" />
      </span>
    );

    let minCreateTime = null;
    if (filtering.minCreateTime) {
      minCreateTime = new Date(filtering.minCreateTime);
    }
    let maxCreateTime = null;
    if (filtering.maxCreateTime) {
      maxCreateTime = new Date(filtering.maxCreateTime);
    }

    if (filtering.overrun === 'true') {
      filtering.overrun = true;
    }
    if (filtering.overrun === 'false') {
      filtering.overrun = false;
    }
    if (filtering.enableFilterByParameters === 'true') {
      filtering.enableFilterByParameters = true;
    }
    if (filtering.enableFilterByParameters === 'false') {
      filtering.enableFilterByParameters = false;
    }
    let $filterByParameters = null;
    if (filtering.enableFilterByParameters === true) {
      if (typeof filtering.resolvedParameters === 'string') {
        filtering.resolvedParameters = JSON.parse(filtering.resolvedParameters);
      }
      $filterByParameters = (
        <ParametersTable
          parameters={filtering.resolvedParameters || { entries: {} }}
          onChange={onChangeResolvedParameters}
        />
      );
    }

    return (
      <aside>
        <h2 className="display-6">Filtering Options</h2>
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Quick Search</h5>
            <div className="form-group">{$savedQuery}</div>
            <h5 className="card-title">Custom Search</h5>
            <div className="form-group">
              <label htmlFor="query-name-keyword">Name Contains:</label>
              <input
                id="query-name-keyword"
                className="form-control"
                value={filtering.nameKeyword}
                onChange={onChangeNameKeyword}
              />
            </div>
            <div className="form-group">
              <label htmlFor="query-name-keyword">Name Not Contains:</label>
              <input
                id="query-name-not-like"
                className="form-control"
                value={filtering.nameNotLike}
                onChange={onChangeNameNotLikeKeyword}
              />
            </div>
            <div className="form-group">
              <label htmlFor="query-batch-uuid">Job URI/Job UUID:</label>
              <input
                id="query-job-uri"
                className="form-control"
                value={filtering.jobUri}
                onChange={onChangeJobUri}
              />
            </div>
            <div className="form-group">
              <label htmlFor="query-batch-uuid">Batch UUID:</label>
              <input
                id="query-batch-uuid"
                className="form-control"
                value={filtering.batchUuid}
                onChange={onChangeBatchUuid}
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
                onChange={onChangeStatus}
                value={filtering.status}
              >
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="ONGOING">Ongoing</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILURE">Failure</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="query-execution">Execution System :</label>
              <select
                id="query-execution"
                className="form-control"
                value={filtering.executionSystemId}
                onChange={onSelectExecutionSystem}
              >
                {$executionSystemsOptions}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="query-job-scope">Job scope :</label>
              <select
                id="job-scope"
                className="form-control"
                value={filtering.jobScope}
                onChange={onSelectJobScope}
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
            <div className="form-group">
              <span>
                <label htmlFor="query-job-consumer">Job Consumer :</label>
                <small className="text-muted"> (Will apply AND on all selected consumers)</small>
              </span>
              <select
                id="job-consumer"
                className="form-control"
                onChange={onChangeJobConsumer}
                multiple
              >
                <option value="">----</option>
                <option value="FO" selected={filtering.jobConsumer.indexOf('FO') > -1}>FO</option>
                <option value="TR" selected={filtering.jobConsumer.indexOf('TR') > -1}>TR</option>
                <option value="PC" selected={filtering.jobConsumer.indexOf('PC') > -1}>PC</option>
                <option value="Collateral" selected={filtering.jobConsumer.indexOf('Collateral') > -1}>Collateral</option>
                <option value="BondPrice" selected={filtering.jobConsumer.indexOf('BondPrice') > -1}>BondPrice</option>
                <option value="Credit_Risks" selected={filtering.jobConsumer.indexOf('Credit_Risks') > -1}>Credit_Risks</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="query-username">Launched by:</label>
              <input
                id="query-username"
                className="form-control"
                value={filtering.username}
                onChange={onChangeUsername}
              />
              {currentUser.username && (
                <button
                  className="anchor"
                  type="button"
                  onClick={onClickLaunchedByMe}
                >
                  Launched by me
                </button>
              )}
            </div>
            <div className="form-group form-inline">
              <label htmlFor="query-overrun" className="mr-3">Overrun:</label>
              <div className="custom-control custom-checkbox" id="query-overrun">
                <input
                  type="checkbox"
                  className="custom-control-input"
                  id="query-overrun-input"
                  checked={filtering.overrun}
                  onChange={onChangeOverrunChecked}
                />
                <label className="custom-control-label" htmlFor="query-overrun-input" />
              </div>
            </div>
            <div className="form-group form-inline">
              <label htmlFor="filter-by-parameters" className="mr-3">Resolved Parameters:</label>
              <div className="custom-control custom-checkbox" id="filter-by-parameters">
                <input
                  type="checkbox"
                  className="custom-control-input"
                  id="filter-by-parameters-input"
                  checked={filtering.enableFilterByParameters}
                  onChange={onChangeParametersFilterChecked}
                />
                <label className="custom-control-label" htmlFor="filter-by-parameters-input" />
              </div>
            </div>
            {$filterByParameters}
            <div className="form-group form-inline">
              <label htmlFor="filter-by-group" className="mr-3">Group:</label>
              <div className="btn-group btn-group-toggle" data-toggle="buttons">
                <label
                  className={`btn btn-info  ${assignmentGroup === '' || assignmentGroup === 'GDM' ? 'active' : ''}`}
                  htmlFor="optionGDM"
                >
                  <input
                    type="radio"
                    name="options"
                    id="optionGDM"
                    value="GDM"
                    autoComplete="off"
                    defaultChecked="true"
                    onClick={onChooseAssignmentGroup}
                  />
                  GDM
                  {(assignmentGroup === '' || assignmentGroup === 'GDM') && badge}
                </label>
                <label
                  className={`btn btn-info  ${assignmentGroup === 'MKTY' ? 'active' : ''}`}
                  htmlFor="optionMKTY"
                >
                  <input
                    type="radio"
                    name="options"
                    id="optionMKTY"
                    value="MKTY"
                    autoComplete="off"
                    defaultChecked="true"
                    onClick={onChooseAssignmentGroup}
                  />
                  MKTY
                  {assignmentGroup === 'MKTY' && badge}
                </label>
              </div>
            </div>
            <div className="form-group">
              <button
                type="button"
                className="btn btn-primary mr-2"
                onClick={onApplyFilteringOptions}
              >
                Apply
              </button>
              <button
                type="button"
                className="btn btn-light"
                onClick={onResetFilteringOptions}
              >
                Reset
              </button>
              <button
                type="button"
                className="btn btn-outline-info"
                data-toggle="modal"
                data-target="#saveQueryModa"
              >
                Save Query
              </button>
            </div>
          </div>
        </div>
      </aside>
    );
  }, [localSavedQuery, executionSystemList, query, filteringOptions, currentUser, onChangeNameKeyword, onChangeNameNotLikeKeyword, onChangeJobUri, onChangeBatchUuid, onChangeCreateTimeRange, onChangeStatus, onSelectExecutionSystem, onSelectJobScope, onChangeJobConsumer, onChangeUsername, onClickLaunchedByMe, onChangeOverrunChecked, onChangeParametersFilterChecked, onChangeResolvedParameters, onChooseAssignmentGroup, onApplyFilteringOptions, onResetFilteringOptions]);

  // Effects
  useEffect(() => {
    loadData();
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (data && !(data instanceof Error)) {
      queryAndUpdateJobRequests();
    }
  }, [data, queryAndUpdateJobRequests]);

  useEffect(() => {
    console.log('Reloading data...');
    clearAndLoadData();
    loadData();
  }, [location.search, clearAndLoadData, loadData]);

  // Render
  if (data === null) {
    return <LoadingIndicator />;
  }
  if (data instanceof Error) {
    return <ErrorAlert error={data} />;
  }

  const { jobRequestPage } = data;
  const [sorting, ordering] = query.sort.split(',');
  const filteringStage = query.status;
  const $jobRequestStats = renderJobRequestStats();
  const $filteringOptions = renderFilteringOptions();

  let $AssignmentGroupChooseModal = null;
  if (showAssignmentGroupModal) {
    $AssignmentGroupChooseModal = (
      <AssignmentGroupChooseModal onClose={onShowAssignmentGroupModal} />
    );
  }

  return (
    <div>
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/">Monitoring</Link>
          </li>
          <li className="breadcrumb-item active">Job Requests</li>
        </ol>
      </nav>
      <h2 className="display-4">Job Requests</h2>
      <div className="row">
        <div className="col-9">
          <JobRequestPage
            jobRequestPage={jobRequestPage}
            sorting={sorting}
            currentUser={currentUser}
            ordering={ordering}
            filteringStage={filteringStage}
            onChangeSortingOrdering={onChangeSortingOrdering}
            onClickPage={onClickPage}
            onCancelJobRequest={onCancelJobRequest}
            onRerunJobRequest={onRerunJobRequest}
            onRerunConsumerPiece={onRerunConsumerPiece}
            onRerunJobRequestList={onRerunJobRequestList}
            onForceOKJobRequestList={onForceOKSelectedJobRequests}
            onForceExecuteRequestList={onForceExecuteRequestList}
            onFilterByStatus={onFilterByStatus}
          />
        </div>
        <div className="col-3">
          {$filteringOptions}
          {$jobRequestStats}
        </div>
      </div>
      <div
        className="modal fade"
        id="saveQueryModa"
        tabIndex="-1"
        role="dialog"
        aria-labelledby="saveQueryModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title" id="saveQueryModalLabel">
                Save Query
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
              <div className="form-group">
                <label htmlFor="save-query-name">Query Name:</label>
                <input
                  id="save-query-name"
                  className="form-control"
                  value={queryName}
                  onChange={onChangeQueryName}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                data-dismiss="modal"
                onClick={onSaveFilteringOptions}
              >
                Save
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                data-dismiss="modal"
              >
                Cancel
              </button>
            </div>
            {saveErrorMessage && <Alert type="warning" text={saveErrorMessage} />}
          </div>
        </div>
      </div>
      {$AssignmentGroupChooseModal}
    </div>
  );
}

JobRequestList.propTypes = {
  currentUser: ScorchPropTypes.currentUser().isRequired,
};

export default withCurrentUser(JobRequestList);
