import React, {useEffect, useState} from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import { toast } from 'react-toastify';
import { isEqual } from 'lodash';
import queryString from 'query-string';

import DatePicker from 'react-datepicker';
import monitoring from '../backend/monitoring';
import globalConfig from '../backend/globalConfig';
import jobExecution from '../backend/jobExecution';
import RouterPropTypes from '../proptypes/router';
import { getAssignmentGroupFromLocalStorage } from '../utils/utilities';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicatorNew from '../components/LoadingIndicatorNew';
import { withCurrentUser } from '../components/currentUser';

import 'react-datepicker/dist/react-datepicker.css';
import Doughnut from '../components/Doughnut';
import colors from '../utils/colors';
import ScorchPropTypes from '../proptypes/scorch';
import BatchRequestPage from './components/BatchRequestPage';
import pipelineRequestService from '../backend/pipelineRequestService';
import AssignmentGroupChooseModal from './components/AssignmentGroupChooseModal';

function isNotDone(batchRequest) {
  return batchRequest.status !== 'SUCCESS' && batchRequest.status !== 'FAILURE'
    && batchRequest.status !== 'FAILURE';
}

function last24Hours() {
  let currentTime = new Date().getTime();
  currentTime -= currentTime % 1000;
  return new Date(currentTime - 24 * 60 * 60 * 1000);
}

function getDefaultQuery() {
  return {
    nameKeyword: '',
    batchUuid: '',
    minCreateTime: last24Hours().toISOString(),
    maxCreateTime: '',
    status: '',
    executionSystemId: '',
    username: '',
    overrun: false,
    sort: 'startTime,desc',
    page: 0,
    size: 50,
  };
}

function colorForStatus(status) {
  const mappings = {
    PENDING: colors.GRAY,
    ONGOING: colors.BLUE,
    SUCCESS: colors.GREEN,
    FAILURE: colors.RED,
  };
  return mappings[status] || colors.DEEP_ORANGE;
}


const BatchRequestList = () => {
  const [batchRequestPage, setBatchRequestPage] = useState(null);
  const [batchAvgElapsedTimeList, setBatchAvgElapsedTimeList] = useState([]);
  const [executionSystemList, setExecutionSystemList] = useState([]);
  const [batchRequestStats, setBatchRequestStats] = useState({});
  const [filteringOptions, setFilteringOptions] = useState({});
  const [showAssignmentGroupModal, setShowAssignmentGroupModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const assignmentGroup = getAssignmentGroupFromLocalStorage();
    if (assignmentGroup === '') {
      setShowAssignmentGroupModal(true);
    } else {
      setShowAssignmentGroupModal(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!isInitialLoad && batchRequestPage && !(batchRequestPage instanceof Error)) {
      queryAndUpdateBatchRequests();
      queryBatchAvgElapsedTime();
    }
  }, [batchRequestPage, isInitialLoad]);

  useEffect(() => {
    if (!isInitialLoad) {
      return;
    }
    console.log('Loading batch requests and stats...');
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const defaultQuery = getDefaultQuery();
        
        const assignmentGroup = getAssignmentGroupFromLocalStorage();
        if (assignmentGroup === '') {
          defaultQuery.assignmentGroup = 'GDM';
        } else {
          defaultQuery.assignmentGroup = assignmentGroup;
        }
        
        const query = Object.assign({}, defaultQuery, queryString.parse(location.search));
        
        const [batchRequestPageResult, batchRequestStatsResult, executionSystemListResult] = await Promise.all([
          monitoring.getBatchRequestList(query),
          monitoring.getBatchRequestStats(query),
          globalConfig.getExecutionSystemList()
        ]);
        
        setBatchRequestPage(batchRequestPageResult);
        setBatchRequestStats(batchRequestStatsResult);
        setExecutionSystemList(executionSystemListResult);
        setIsInitialLoad(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setBatchRequestPage(error);
        setBatchRequestStats(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isInitialLoad, location.search]);

  useEffect(() => {
    onShowAssignmentGroupModal();
  }, [showAssignmentGroupModal]);

  function query() {
    const defaultQuery = getDefaultQuery();
    const searchQuery = queryString.parse(location.search);

    const assignmentGroup = getAssignmentGroupFromLocalStorage();
    if (assignmentGroup === '') {
      defaultQuery.assignmentGroup = 'GDM';
    } else {
      defaultQuery.assignmentGroup = assignmentGroup;
    }
    return Object.assign({}, defaultQuery, searchQuery);
  }

  function getQueryUrl(overrides) {
    const nextQuery = Object.assign({}, query(), overrides);
    return `${location.pathname}?${queryString.stringify(nextQuery)}`;
  }

  function onKeyDown(e) {
    if (e.keyCode === 13 && e.target.id && e.target.id.indexOf('query-') !== -1) {
      onApplyFilteringOptions();
    }
  }

  function onClickPage(page) {
    const url = getQueryUrl({ page });
    navigate(url);
  }

  function onChangeFilterOption(event) {
    const nameKeyword = event.target.value;
    const name = event.target.name;

    const filterOptions = Object.assign({}, filteringOptions, { [name]: nameKeyword });
    setFilteringOptions(filterOptions);
  }

  function onChangeCreateTimeRange(name, dateTime) {

    const filterOptions = Object.assign({}, filteringOptions);
    if (!dateTime) {
      filterOptions[name] = null;
    } else {
      filterOptions[name] = dateTime.toISOString();
    }
    setFilteringOptions(filterOptions);
  }

  function onClickLaunchedByMe() {
    // const { currentUser } = props;
    // if (currentUser && currentUser.username) {
    //
    //   const username = currentUser.username;
    //   const filterOptions = Object.assign({}, filteringOptions, { username });
    //   setFilteringOptions(filterOptions);
    // }
  }

  function onChangeOverrunChecked(event) {
    const overrun = event.target.checked;
    const newFilteringOptions = Object.assign({}, filteringOptions, { overrun });
    setFilteringOptions(newFilteringOptions);
  }

  function onApplyFilteringOptions() {
    const queryOverrides = Object.assign({}, filteringOptions);
    Object.keys(queryOverrides).forEach((key) => {
      if (key !== 'overrun') {
        queryOverrides[key] = (queryOverrides[key] || '').trim();
      }
    });
    queryOverrides.page = 0;
    const url = getQueryUrl(queryOverrides);
    navigate(url);
  }

  function onResetFilteringOptions() {
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
  }

  function onToggleOrdering(sorting) {
    const [currentSorting, currentOrdering] = query().sort.split(',');
    let ordering = 'asc';
    if (sorting === currentSorting) {
      ordering = currentOrdering === 'asc' ? 'desc' : 'asc';
    }
    const url = getQueryUrl({
      sort: `${sorting},${ordering}`,
      page: 0,
    });
    navigate(url);
  }

  async function onCancelBatchRequest(batchRequest) {
    try {
      const cancelledBatchRequest = await jobExecution.cancelBatchRequest(batchRequest.uuid);
      const batchRequestList = batchRequestPage.content;
      const newBatchRequestList = batchRequestList.map((batch) => {
        if (batch.id === cancelledBatchRequest.id) {
          return cancelledBatchRequest;
        }
        return batch;
      });
      const newJobRequestPage = Object
        .assign({}, batchRequestPage, { content: newBatchRequestList });
      setBatchRequestPage(newJobRequestPage);
    } catch (error) {
      console.error(`Failed to cancel batch request: ${error}`);
      toast.error(`Failed to cancel batch request: ${error.message || error}`);
    }
  }

  async function onRerunConsumerPiece(selectedBatchRequests) {
    if (selectedBatchRequests) {
      const ids = selectedBatchRequests.map(batchRequest => batchRequest.id);
      jobExecution.rerunBatchConsumerPiece(ids).then((batchRequestList) => {
        updateBatchRequestPage(batchRequestList);
      }).catch((error) => {
        console.log(`Failed to submit rerun consumer piece : ${error}`);
      });
    }
  }

  function onRerunBatch(selectedBatchRequests) {
    const batchRequestIdsIsNotDone = selectedBatchRequests.filter(
      batchRequest => isNotDone(batchRequest),
    ).map(batchRequest => batchRequest.id);
    if (batchRequestIdsIsNotDone && batchRequestIdsIsNotDone.length > 0) {
      toast.warn(`Batch Request couldn't rerun: ${batchRequestIdsIsNotDone}`);
      return;
    }
    if (selectedBatchRequests) {
      const ids = selectedBatchRequests.map(batchRequest => batchRequest.id);
      jobExecution.rerunBatch(ids).then((batchRequestList) => {
        updateBatchRequestPage(batchRequestList);
      }).catch((error) => {
        console.log(`Failed to rerun batch request: ${error}`);
      });
    }
  }

  function onForceOK(selectedBatchRequests) {
    selectedBatchRequests.filter(
      batchRequest => batchRequest.status === 'FAILURE',
    ).forEach(batchRequest => {
      pipelineRequestService.markAsSuccess(batchRequest).then(() => {
        queryAndUpdateBatchRequests();
        toast.success(`${batchRequest.name} marked as Success`);
      }).catch((e) => {
        toast.error(`Failed to overwrite ${batchRequest.name} status: ${e}`);
      });
    });
  }


  function onShowAssignmentGroupModal(flag) {
    if (showAssignmentGroupModal) {
      setShowAssignmentGroupModal(flag);
      setBatchRequestPage(null);
      setIsInitialLoad(true);
    }
  }

  function onChooseAssignmentGroup(event) {
    const assignmentGroup = event.target.value;
    localStorage.setItem('assignmentGroupOnScorchRequest', assignmentGroup);

    const filterOptions = Object.assign({}, filteringOptions, { assignmentGroup });
    return { filterOptions };
  }

  function clearAndLoadBatchRequestPage() {
    setFilteringOptions({});
    setBatchRequestPage(null);
    setIsInitialLoad(true);
  }

  function queryAndUpdateBatchRequests() {
    if (batchRequestPage === null || batchRequestPage instanceof Error) {
      return;
    }

    const batchRequestList = batchRequestPage.content;
    const found = batchRequestList.find(batchRequest => isNotDone(batchRequest));
    if (!found) {
      return;
    }

    const batchRequestIds = batchRequestList.filter(
      batchRequest => isNotDone(batchRequest),
    ).map(batchRequest => batchRequest.id);
    monitoring.queryAndUpdateBatchRequestList(batchRequestIds)
      .then((content) => {
        updateBatchRequestPage(content);
      });
  }

  function updateBatchRequestPage(batchRequestList) {
    if (batchRequestList) {
      setBatchRequestPage((previousState) => {
        if (batchRequestPage) {
          const currentContent = batchRequestPage.content;
          batchRequestPage.content = currentContent.map(currentBatchRequest => {
            let batchRequest = currentBatchRequest;
            batchRequestList.map(updatedBatchRequest => {
              if (batchRequest.id === updatedBatchRequest.id) {
                batchRequest = updatedBatchRequest;
              }
              return updatedBatchRequest;
            });
            return batchRequest;
          });
        }
        return { ...previousState, batchRequestPage };
      });
    }
  }

  function queryBatchAvgElapsedTime() {
    if (batchRequestPage === null || batchRequestPage instanceof Error) {
      return;
    }

    const batchRequestList = batchRequestPage.content;
    const found = batchRequestList.find(batchRequest => isNotDone(batchRequest));
    if (!found) {
      return;
    }

    const batchRequestNames = batchRequestList.map(batchRequest => batchRequest.name);
    monitoring.getBatchAvgElapsedTimeList(batchRequestNames)
      .then((batchAvgElapsedTimeList) => {
        setBatchAvgElapsedTimeList(batchAvgElapsedTimeList);
      });
  }

  function renderFilteringOptions() {
    const filterOptions = Object.assign({}, query(), filteringOptions);

    const $executionSystemsOptions = executionSystemList.map(executionSystem => 
      <option key={executionSystem.id} value={executionSystem.id}>{executionSystem.name}</option>
    );
    $executionSystemsOptions.unshift(
      <option key="" value="">----</option>
    );

    let minCreateTime = null;
    if (filterOptions.minCreateTime) {
      minCreateTime = new Date(filterOptions.minCreateTime);
    }
    let maxCreateTime = null;
    if (filterOptions.maxCreateTime) {
      maxCreateTime = new Date(filterOptions.maxCreateTime);
    }

    if (filterOptions.overrun === 'true') {
      filteringOptions.overrun = true;
    }
    if (filterOptions.overrun === 'false') {
      filterOptions.overrun = false;
    }

    const assignmentGroup = getAssignmentGroupFromLocalStorage();

    const badge = <span className="badge badge-success ml-2">{<i className="fa fa-check-circle-o fa-2x" />}</span>;

    return (
      <>
        <aside>
          <h2 className="display-6">Filtering Options</h2>
          <div className="card">
            <div className="card-body">
              <div className="form-group">
                <label htmlFor="query-name-keyword">Name Contains:</label>
                <input id="query-name-keyword" className="form-control" value={filteringOptions.nameKeyword} name="nameKeyword" onChange={onChangeFilterOption} />
              </div>
              <div className="form-group">
                <label htmlFor="query-batch-uuid">Batch UUID:</label>
                <input id="query-batch-uuid" className="form-control" value={filteringOptions.batchUuid} name="batchUuid" onChange={onChangeFilterOption} />
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
                  showMonthYearDropdown 
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
                  showMonthYearDropdown 
                />
              </div>
              <div className="form-group">
                <label htmlFor="query-status">Status :</label>
                <select
                  id="query-status"
                  className="form-control"
                  onChange={onChangeFilterOption}
                  name="status"
                  value={filteringOptions.status}
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
                <label htmlFor="query-execution">Execution System :</label>
                <select id="query-execution" className="form-control" value={filteringOptions.executionSystemId} name="executionSystemId" onChange={onChangeFilterOption}>
                  {$executionSystemsOptions}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="query-username">Launched by:</label>
                <input id="query-username" className="form-control" value={filteringOptions.username} name="username" onChange={onChangeFilterOption} />
                {filteringOptions.username && <button className="anchor" type="button" onClick={onClickLaunchedByMe}>Launched by me</button>}
              </div>
              <div className="form-group form-inline">
                <label htmlFor="query-overrun" className="mr-3">Overrun:</label>
                <div className="custom-control custom-checkbox" id="query-overrun">
                  <input type="checkbox" className="custom-control-input" id="customCheck1" checked={filteringOptions.overrun} onChange={onChangeOverrunChecked} />
                  <label className="custom-control-label" htmlFor="customCheck1" />
                </div>
              </div>
              <div className="form-group form-inline">
                <label htmlFor="filter-by-group" className="mr-3">Group:</label>
                <div className="btn-group btn-group-toggle" data-toggle="buttons">
                  <label
                    className={`btn btn-info  ${assignmentGroup === '' || assignmentGroup === 'GDM' ? 'active' : ''}`}
                    htmlFor="optionGDM"
                  >
                    <input type="radio" name="options" id="optionGDM" value="GDM" autoComplete="off" defaultChecked="true" onClick={(event) => onChooseAssignmentGroup(event)} />
                    GDM
                    {(assignmentGroup === '' || assignmentGroup === 'GDM') && badge}
                  </label>
                  <label
                    className={`btn btn-info  ${assignmentGroup === 'MKTY' ? 'active' : ''}`}
                    htmlFor="optionMKTY"
                  >
                    <input type="radio" name="options" id="optionMKTY" value="MKTY" autoComplete="off" defaultChecked="true" onClick={(event) => onChooseAssignmentGroup(event)} />
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
                <button type="button" className="btn btn-light" onClick={onResetFilteringOptions}>Reset</button>
              </div>
            </div>
          </div>
        </aside>
      </>
    );
  }

  function renderBatchRequestStats() {
    if (!batchRequestStats) {
      return null;
    }

    let totalCount = 0;
    const chartData = {};
    const batchRequestStatList = Object.assign({}, batchRequestStats);

    const $items = Object.keys(batchRequestStatList).map((status) => {
      const count = batchRequestStatList[status];
      const color = colorForStatus(status);
      chartData[status] = {
        value: count,
        color: color,
      };
      totalCount += count;
      return (
        <li key={`stats-${status}`} style={{color: color}}>
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
          <div className="alert alert-warning">No batch requests found using this query.</div>
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
            Total <strong>{totalCount}</strong> batch requests
          </div>
        </div>
      </aside>
    );
  }

  if (isLoading || batchRequestPage === null) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <LoadingIndicatorNew />
          <div className="mt-3">
            <h5>Loading batch requests...</h5>
            <p className="text-muted">Please wait while we fetch the data</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (batchRequestPage instanceof Error) {
    return <ErrorAlert error={batchRequestPage} />;
  }

  let $AssignmentGroupChooseModal = null;
  if (showAssignmentGroupModal) {
    $AssignmentGroupChooseModal = (
      <AssignmentGroupChooseModal onClose={onShowAssignmentGroupModal} />
    );
  }

  const [sorting, ordering] = query().sort.split(',');
  const $filteringOptions = renderFilteringOptions();
  const $batchRequestStats = renderBatchRequestStats();
  const currentUser = {username: 'admin', canRead: true};

  return (
    <div>
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/">Monitoring</Link>
          </li>
          <li className="breadcrumb-item active">Batch Requests</li>
        </ol>
      </nav>
      <h2 className="display-4">Batch Requests</h2>
      <div className="row">
        <div className="col-9">
          <BatchRequestPage
            batchRequestPage={batchRequestPage}
            batchAvgElapsedTimeList={batchAvgElapsedTimeList}
            executionSystemList={executionSystemList}
            onToggleOrdering={onToggleOrdering}
            onClickPage={onClickPage}
            onCancelBatchRequest={onCancelBatchRequest}
            onRerunConsumerPiece={onRerunConsumerPiece}
            onRerunBatch={onRerunBatch}
            onForceOK={onForceOK}
            sorting={sorting}
            ordering={ordering}
            currentUser={currentUser}
          />
        </div>
        <div className="col-3">
          {$filteringOptions}
        </div>
      </div>
      {$AssignmentGroupChooseModal}
    </div>
  );
}

// BatchRequestListBak.propTypes = {
//   location: RouterPropTypes.location().isRequired,
//   currentUser: ScorchPropTypes.currentUser().isRequired,
// };

// export default withCurrentUser(BatchRequestList);
export default BatchRequestList;
