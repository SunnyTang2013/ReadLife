import React from 'react';
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
import LoadingIndicator from '../components/LoadingIndicator';
import { withCurrentUser } from '../components/currentUser';

import 'react-datepicker/dist/react-datepicker.css';
import Doughnut from '../components/Doughnut';
import colors from '../utils/colors';
import ScorchPropTypes from '../proptypes/scorch';
import BatchRequestPage from './components/BatchRequestPage';
import pipelineRequestService from '../backend/pipelineRequestService';
import AssignmentGroupChooseModal from './components/AssignmentGroupChooseModal';

class BatchRequestListBak extends React.Component {
  static isNotDone(batchRequest) {
    return batchRequest.status !== 'SUCCESS' && batchRequest.status !== 'FAILURE'
      && batchRequest.status !== 'FAILURE';
  }

  static last24Hours() {
    let currentTime = new Date().getTime();
    currentTime -= currentTime % 1000;
    return new Date(currentTime - 24 * 60 * 60 * 1000);
  }

  static getDefaultQuery() {
    return {
      nameKeyword: '',
      batchUuid: '',
      minCreateTime: BatchRequestListBak.last24Hours().toISOString(),
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

  static colorForStatus(status) {
    const mappings = {
      PENDING: colors.GRAY,
      ONGOING: colors.BLUE,
      SUCCESS: colors.GREEN,
      FAILURE: colors.RED,
    };
    return mappings[status] || colors.DEEP_ORANGE;
  }

  constructor(props) {
    super(props);
    this.state = {
      batchRequestPage: null,
      batchAvgElapsedTimeList: [],
      executionSystemList: [],
      batchRequestStats: null,
      filteringOptions: {},
      showAssignmentGroupModal: false,
    };
    this.onClickPage = this.onClickPage.bind(this);
    this.onChangeNameKeyword = this.onChangeNameKeyword.bind(this);
    this.onChangeBatchUuid = this.onChangeBatchUuid.bind(this);
    this.onChangeCreateTimeRange = this.onChangeCreateTimeRange.bind(this);
    this.onChangeStatus = this.onChangeStatus.bind(this);
    this.onChangeUsername = this.onChangeUsername.bind(this);
    this.onSelectExecutionSystem = this.onSelectExecutionSystem.bind(this);
    this.onClickLaunchedByMe = this.onClickLaunchedByMe.bind(this);
    this.onChangeOverrunChecked = this.onChangeOverrunChecked.bind(this);
    this.onApplyFilteringOptions = this.onApplyFilteringOptions.bind(this);
    this.onResetFilteringOptions = this.onResetFilteringOptions.bind(this);
    this.onToggleOrdering = this.onToggleOrdering.bind(this);
    this.onRerunConsumerPiece = this.onRerunConsumerPiece.bind(this);
    this.onForceOK = this.onForceOK.bind(this);
    this.onRerunBatch = this.onRerunBatch.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onShowAssignmentGroupModal = this.onShowAssignmentGroupModal.bind(this);
    this.onChooseAssignmentGroup = this.onChooseAssignmentGroup.bind(this);
  }

  // const location = useLocation();
  // useEffect(() => {
  //
  // }, []);

  componentDidMount() {
    this._loadBatchRequestPage();
    document.addEventListener('keydown', this.onKeyDown);
    document.title = 'Batch Request';
  }

  componentDidUpdate(prevProps) {
    if (!isEqual(prevProps.location.search, this.props.location.search)) {
      this._clearAndLoadBatchRequestPage();
    }
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.onKeyDown);
  }

  onKeyDown(e) {
    if (e.keyCode === 13 && e.target.id && e.target.id.indexOf('query-') !== -1) {
      this.onApplyFilteringOptions();
    }
  }

  onClickPage(page) {
    const url = this._getQueryUrl({ page });
    const navigate = useNavigate();
    navigate(url);
  }

  onChangeNameKeyword(event) {
    const nameKeyword = event.target.value;
    this.setState((prevState) => {
      const filteringOptions = Object.assign({}, prevState.filteringOptions, { nameKeyword });
      return { filteringOptions };
    });
  }

  onChangeBatchUuid(event) {
    const batchUuid = event.target.value;
    this.setState((prevState) => {
      const filteringOptions = Object.assign({}, prevState.filteringOptions, { batchUuid });
      return { filteringOptions };
    });
  }

  onChangeCreateTimeRange(name, dateTime) {
    this.setState((prevState) => {
      const filteringOptions = Object.assign({}, prevState.filteringOptions);
      if (!dateTime) {
        filteringOptions[name] = null;
      } else {
        filteringOptions[name] = dateTime.toISOString();
      }
      return { filteringOptions };
    });
  }

  onChangeStatus(event) {
    const status = event.target.value;
    this.setState((prevState) => {
      const filteringOptions = Object.assign({}, prevState.filteringOptions, { status });
      return { filteringOptions };
    });
  }

  onSelectExecutionSystem(event) {
    const executionSystemId = event.target.value;
    this.setState((prevState) => {
      const filteringOptions = Object.assign({}, prevState.filteringOptions,
        { executionSystemId });
      return { filteringOptions };
    });
  }

  onChangeUsername(event) {
    const username = event.target.value;
    this.setState((prevState) => {
      const filteringOptions = Object.assign({}, prevState.filteringOptions, { username });
      return { filteringOptions };
    });
  }

  onClickLaunchedByMe() {
    const { currentUser } = this.props;
    if (currentUser && currentUser.username) {
      this.setState((prevState) => {
        const username = currentUser.username;
        const filteringOptions = Object.assign({}, prevState.filteringOptions, { username });
        return { filteringOptions };
      });
    }
  }

  onChangeOverrunChecked(event) {
    const overrun = event.target.checked;
    this.setState((prevState) => {
      const filteringOptions = Object.assign({}, prevState.filteringOptions, { overrun });
      return { filteringOptions };
    });
  }

  onApplyFilteringOptions() {
    const queryOverrides = Object.assign({}, this.state.filteringOptions);
    Object.keys(queryOverrides).forEach((key) => {
      if (key !== 'overrun') {
        queryOverrides[key] = (queryOverrides[key] || '').trim();
      }
    });
    queryOverrides.page = 0; // Need to reset page number to 0.
    const url = this._getQueryUrl(queryOverrides);
    this.props.history.push(url);
  }

  onResetFilteringOptions() {
    const defaultQuery = BatchRequestListBak.getDefaultQuery();
    const queryOverrides = {
      nameKeyword: defaultQuery.nameKeyword,
      batchUuid: defaultQuery.batchUuid,
      minCreateTime: defaultQuery.minCreateTime,
      maxCreateTime: defaultQuery.maxCreateTime,
      status: defaultQuery.status,
      overrun: defaultQuery.overrun,
      page: 0,
    };
    const url = this._getQueryUrl(queryOverrides);
    this.props.history.push(url);
  }

  onToggleOrdering(sorting) {
    const [currentSorting, currentOrdering] = this.query.sort.split(',');
    let ordering = 'asc';
    if (sorting === currentSorting) {
      ordering = currentOrdering === 'asc' ? 'desc' : 'asc';
    }
    const url = this._getQueryUrl({
      sort: `${sorting},${ordering}`,
      page: 0,
    });
    this.props.history.push(url);
  }

  onCancelBatchRequest(batchRequest) {
    jobExecution.cancelBatchRequest(batchRequest.uuid)
      .then((cancelledBatchRequest) => {
        const { batchRequestPage } = this.state;
        const batchRequestList = batchRequestPage.content;
        const newBatchRequestList = batchRequestList.map((batch) => {
          if (batch.id === cancelledBatchRequest.id) {
            return cancelledBatchRequest;
          }
          return batch;
        });
        const newJobRequestPage = Object
          .assign({}, batchRequestPage, { content: newBatchRequestList });
        this.setState({ batchRequestPage: newJobRequestPage });
      })
      .catch((error) => {
        console.log(`Failed to cancel batch request : ${error}`);
      });
  }

  onRerunConsumerPiece(selectedBatchRequests) {
    if (selectedBatchRequests) {
      const ids = selectedBatchRequests.map(batchRequest => batchRequest.id);
      jobExecution.rerunBatchConsumerPiece(ids).then((batchRequestList) => {
        this._updateBatchRequestPage(batchRequestList);
      }).catch((error) => {
        console.log(`Failed to submit rerun consumer piece : ${error}`);
      });
    }
  }

  onRerunBatch(selectedBatchRequests) {
    const batchRequestIdsIsNotDone = selectedBatchRequests.filter(
      batchRequest => BatchRequestListBak.isNotDone(batchRequest),
    ).map(batchRequest => batchRequest.id);
    if (batchRequestIdsIsNotDone && batchRequestIdsIsNotDone.length > 0) {
      toast.warn(`Batch Request couldn't rerun: ${batchRequestIdsIsNotDone}`);
      return;
    }
    if (selectedBatchRequests) {
      const ids = selectedBatchRequests.map(batchRequest => batchRequest.id);
      jobExecution.rerunBatch(ids).then((batchRequestList) => {
        this._updateBatchRequestPage(batchRequestList);
      }).catch((error) => {
        console.log(`Failed to rerun batch request: ${error}`);
      });
    }
  }

  onForceOK(selectedBatchRequests) {
    selectedBatchRequests.filter(
      batchRequest => batchRequest.status === 'FAILURE',
    ).forEach(batchRequest => {
      pipelineRequestService.markAsSuccess(batchRequest).then(() => {
        this._queryAndUpdateBatchRequestStatus();
        toast.success(`${batchRequest.name} marked as Success`);
      }).catch((e) => {
        toast.error(`Failed to overwrite ${batchRequest.name} status: ${e}`);
      });
    });
  }

  onShowAssignmentGroupModal(flag) {
    this.setState({ showAssignmentGroupModal: flag, batchRequestPage: null },
      () => this._loadBatchRequestPage());
  }

  onChooseAssignmentGroup(event) {
    const assignmentGroup = event.target.value;
    localStorage.setItem('assignmentGroupOnScorchRequest', assignmentGroup);

    this.setState((prevState) => {
      const filteringOptions = Object.assign({}, prevState.filteringOptions, { assignmentGroup });
      return { filteringOptions };
    });
  }


  get query() {
    const defaultQuery = BatchRequestListBak.getDefaultQuery();
    const query = queryString.parse(this.props.location.search);

    const assignmentGroup = getAssignmentGroupFromLocalStorage();
    if (assignmentGroup === '') {
      defaultQuery.assignmentGroup = 'GDM';
    } else {
      defaultQuery.assignmentGroup = assignmentGroup;
    }
    return Object.assign({}, defaultQuery, query);
  }

  _getQueryUrl(overrides) {
    const nextQuery = Object.assign({}, this.query, overrides);
    return `${this.props.location.pathname}?${queryString.stringify(nextQuery)}`;
  }

  _loadBatchRequestPage() {
    console.log('Loading batch requests and stats...');
    const assignmentGroup = getAssignmentGroupFromLocalStorage();
    if (assignmentGroup === '') {
      this.setState({ showAssignmentGroupModal: true });
    } else {
      this.setState({ showAssignmentGroupModal: false });
    }

    const batchRequestPagePromise = monitoring.getBatchRequestList(this.query);
    const batchRequestStatsPromise = monitoring.getBatchRequestStats(this.query);
    const executionSystemListPromise = globalConfig.getExecutionSystemList();
    Promise.all([batchRequestPagePromise, batchRequestStatsPromise, executionSystemListPromise])
      .then(([batchRequestPage, batchRequestStats, executionSystemList]) => {
        this.setState({ batchRequestPage, batchRequestStats, executionSystemList },
          () => {
            this._queryAndUpdateBatchRequests();
            this._queryBatchAvgElapsedTime();
          });
      })
      .catch((error) => {
        this.setState({ batchRequestPage: error, batchRequestStats: error });
      });
  }

  _clearAndLoadBatchRequestPage() {
    this.setState({ filteringOptions: {}, batchRequestPage: null },
      () => this._loadBatchRequestPage());
  }

  _queryAndUpdateBatchRequests() {
    const { batchRequestPage } = this.state;

    if (batchRequestPage === null || batchRequestPage instanceof Error) {
      return;
    }

    const batchRequestList = batchRequestPage.content;
    const found = batchRequestList.find(batchRequest => BatchRequestListBak.isNotDone(batchRequest));
    if (!found) {
      return;
    }

    const batchRequestIds = batchRequestList.filter(
      batchRequest => BatchRequestListBak.isNotDone(batchRequest),
    ).map(batchRequest => batchRequest.id);
    monitoring.queryAndUpdateBatchRequestList(batchRequestIds)
      .then((content) => {
        this._updateBatchRequestPage(content);
      });
  }

  _updateBatchRequestPage(batchRequestList) {
    if (batchRequestList) {
      this.setState((prevState) => {
        const { batchRequestPage } = prevState;
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
        return { batchRequestPage };
      });
    }
  }

  _queryBatchAvgElapsedTime() {
    const { batchRequestPage } = this.state;

    if (batchRequestPage === null || batchRequestPage instanceof Error) {
      return;
    }

    const batchRequestList = batchRequestPage.content;
    const found = batchRequestList.find(batchRequest => BatchRequestListBak.isNotDone(batchRequest));
    if (!found) {
      return;
    }

    const batchRequestNames = batchRequestList.map(batchRequest => batchRequest.name);
    monitoring.getBatchAvgElapsedTimeList(batchRequestNames)
      .then((batchAvgElapsedTimeList) => {
        this.setState({ batchAvgElapsedTimeList });
      });
  }

  _renderFilteringOptions() {
    const { executionSystemList } = this.state;
    const filteringOptions = Object.assign({}, this.query, this.state.filteringOptions);

    const $executionSystemsOptions = executionSystemList.map(executionSystem => (
      <option key={executionSystem.id} value={executionSystem.id}>
        {executionSystem.name}
      </option>
    ));
    $executionSystemsOptions.unshift((
      <option key="" value="">----</option>
    ));

    let minCreateTime = null;
    if (filteringOptions.minCreateTime) {
      minCreateTime = new Date(filteringOptions.minCreateTime);
    }
    let maxCreateTime = null;
    if (filteringOptions.maxCreateTime) {
      maxCreateTime = new Date(filteringOptions.maxCreateTime);
    }

    if (filteringOptions.overrun === 'true') {
      filteringOptions.overrun = true;
    }
    if (filteringOptions.overrun === 'false') {
      filteringOptions.overrun = false;
    }

    const assignmentGroup = getAssignmentGroupFromLocalStorage();

    const badge = (
      <span className="badge badge-success ml-2">
        <i className="fa fa-check-circle-o fa-2x" />
      </span>
    );

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
                value={filteringOptions.nameKeyword}
                onChange={this.onChangeNameKeyword}
              />
            </div>
            <div className="form-group">
              <label htmlFor="query-batch-uuid">Batch UUID:</label>
              <input
                id="query-batch-uuid"
                className="form-control"
                value={filteringOptions.batchUuid}
                onChange={this.onChangeBatchUuid}
              />
            </div>
            <div className="form-group">
              <label htmlFor="query-min-create-time">From Time:</label>
              <DatePicker
                id="query-min-create-time"
                className="form-control"
                selected={minCreateTime}
                onChange={selected => this.onChangeCreateTimeRange('minCreateTime', selected)}
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
                onChange={selected => this.onChangeCreateTimeRange('maxCreateTime', selected)}
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
                onChange={this.onChangeStatus}
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
              <select
                id="query-execution"
                className="form-control"
                value={filteringOptions.executionSystemId}
                onChange={this.onSelectExecutionSystem}
              >
                {$executionSystemsOptions}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="query-username">Launched by:</label>
              <input
                id="query-username"
                className="form-control"
                value={filteringOptions.username}
                onChange={this.onChangeUsername}
              />
              {this.props.currentUser.username && (
                <button
                  className="anchor"
                  type="button"
                  onClick={this.onClickLaunchedByMe}
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
                  id="customCheck1"
                  checked={filteringOptions.overrun}
                  onChange={this.onChangeOverrunChecked}
                />
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
                  <input
                    type="radio"
                    name="options"
                    id="optionGDM"
                    value="GDM"
                    autoComplete="off"
                    defaultChecked="true"
                    onClick={(event) => this.onChooseAssignmentGroup(event)}
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
                    onClick={(event) => this.onChooseAssignmentGroup(event)}
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
                onClick={this.onApplyFilteringOptions}
              >
                Apply
              </button>
              <button
                type="button"
                className="btn btn-light"
                onClick={this.onResetFilteringOptions}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  _renderBatchRequestStats() {
    const { batchRequestStats } = this.state;

    if (!batchRequestStats) {
      return null;
    }

    let totalCount = 0;
    const chartData = {};

    const $items = Object.keys(batchRequestStats).map((status) => {
      const count = batchRequestStats[status];
      const color = BatchRequestListBak.colorForStatus(status);
      chartData[status] = {
        value: count,
        color: color,
      };
      totalCount += count;
      return (
        <li key={`stats-${status}`} style={{ color: color }}>
          <i className="fa fa-fw fa-circle mr-1" />
          {status}: <strong>{count}</strong>
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

  render() {
    const { batchRequestPage, batchAvgElapsedTimeList,
      executionSystemList, showAssignmentGroupModal } = this.state;
    if (batchRequestPage === null) {
      return <LoadingIndicator />;
    }
    if (batchRequestPage instanceof Error) {
      return <ErrorAlert error={batchRequestPage} />;
    }

    let $AssignmentGroupChooseModal = null;
    if (showAssignmentGroupModal) {
      $AssignmentGroupChooseModal = (
        <AssignmentGroupChooseModal
          onClose={this.onShowAssignmentGroupModal}
        />
      );
    }

    const $filteringOptions = this._renderFilteringOptions();
    const $batchRequestStats = this._renderBatchRequestStats();

    const [sorting, ordering] = this.query.sort.split(',');

    return (
      <div>
        <nav>
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/">Monitoring</Link></li>
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
              onToggleOrdering={this.onToggleOrdering}
              onClickPage={this.onClickPage}
              onCancelBatchRequest={this.onCancelBatchRequest}
              onRerunConsumerPiece={this.onRerunConsumerPiece}
              onRerunBatch={this.onRerunBatch}
              onForceOK={this.onForceOK}
              sorting={sorting}
              ordering={ordering}
              currentUser={this.props.currentUser}
            />
          </div>
          <div className="col-3">
            {$filteringOptions}
            {$batchRequestStats}
          </div>
        </div>
        {$AssignmentGroupChooseModal}
      </div>
    );
  }
}

BatchRequestListBak.propTypes = {
  location: RouterPropTypes.location().isRequired,
  currentUser: ScorchPropTypes.currentUser().isRequired,
};

export default withCurrentUser(BatchRequestListBak);
