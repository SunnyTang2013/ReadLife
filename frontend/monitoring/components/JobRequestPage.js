import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import moment from 'moment';
import { toast } from 'react-toastify';

import { formatDuration, formatTime, truncateChars } from '../../utils/utilities';
import Paginator from '../../components/Paginator';
import RequestStatusBadge from '../../components/RequestStatusBadge';
import ErrorAlert from '../../components/ErrorAlert';
import StaticModal from '../../components/StaticModal';
import ScorchPropTypes from '../../proptypes/scorch';
import AlertCountBadge from '../../components/AlertCountBadge';
import monitoring from '../../backend/monitoring';
import RunSComparatorModal from './RunSComparatorModal';
import appInfoService from '../../backend/appInfoService';

export function isJobRequestDone(jobRequest) {
  return jobRequest.status === 'SUCCESS' || jobRequest.status === 'FAILURE';
}

export default class JobRequestPage extends React.Component {
  constructor(props) {
    super(props);
    this.onToggleSorting = this.onToggleSorting.bind(this);
    this.state = {
      selectedJobRequests: [],
      jobAvgElapsedTimeList: [],
      isModalOpen: false,
      isRerunModalOpen: false,
      isForceExecuteModalOpen: false,
      showRunSComparatorModal: false,
      sComparatorOptions: {},
      appInfo: {},
    };
    this.handleClickEvent = this.handleClickEvent.bind(this);
    this.onRerunJobRequest = this.onRerunJobRequest.bind(this);
    this.onCancelJobRequest = this.onCancelJobRequest.bind(this);
    this.onSelectJobRequestAll = this.onSelectJobRequestAll.bind(this);
    this.onForceOKSelectedJobRequests = this.onForceOKSelectedJobRequests.bind(this);
    this.onRunSComparator = this.onRunSComparator.bind(this);
    this.onCompleteComparision = this.onCompleteComparision.bind(this);
    this.onCloseComparision = this.onCloseComparision.bind(this);
    this.onRerunConsumerPiece = this.onRerunConsumerPiece.bind(this);
  }

  componentDidMount() {
    this._loadJobRequestBundleList();
    this._loadAppInfo();
  }

  onToggleSorting(sorting) {
    let ordering = 'asc';
    if (sorting === this.props.sorting) {
      ordering = (this.props.ordering === 'asc' ? 'desc' : 'asc');
    }
    this.props.onChangeSortingOrdering({ sorting, ordering });
  }

  onSelectJobRequestAll() {
    const jobRequestPage = this.props.jobRequestPage;
    const jobRequestList = jobRequestPage.content;
    const selectedJobRequests = jobRequestList.slice();
    this.setState({ selectedJobRequests });
  }

  onClear() {
    this.setState({ selectedJobRequests: [] });
  }

  onSelectJobRequest(jobRequest, event) {
    const { selectedJobRequests } = this.state;
    const newSelectionJobs = selectedJobRequests.slice();
    if (event.target.checked) {
      newSelectionJobs.push(jobRequest);
    } else {
      const selectedJobRequestIds = selectedJobRequests.map(jobReq => jobReq.id);
      const index = selectedJobRequestIds.indexOf(jobRequest.id);
      if (index > -1) {
        newSelectionJobs.splice(index, 1);
      }
    }

    this.setState({
      selectedJobRequests: newSelectionJobs,
    });
  }

  onCancelJobRequest(jobRequest) {
    this.props.onCancelJobRequest(jobRequest);
  }

  onRerunJobRequest(jobRequest) {
    this.props.onRerunJobRequest(jobRequest);
  }

  onCancelSelectedJobRequests() {
    const { selectedJobRequests } = this.state;
    selectedJobRequests.forEach(jobRequest => this.onCancelJobRequest(jobRequest));
    this.onClear();
  }

  onRerunSelectedJobRequests() {
    const { selectedJobRequests } = this.state;
    this.props.onRerunJobRequestList(selectedJobRequests);
    this.onClear();
  }

  onForceOKSelectedJobRequests() {
    const { selectedJobRequests } = this.state;
    this.props.onForceOKJobRequestList(selectedJobRequests);
    this.onClear();
  }

  onForceExecuteRequestList() {
    const { selectedJobRequests } = this.state;
    this.props.onForceExecuteRequestList(selectedJobRequests);
    this.onClear();
  }

  onRunSComparator() {
    const { selectedJobRequests } = this.state;

    if (selectedJobRequests.length < 2) {
      toast.warn('please select at least two job requests.');
      return;
    }

    const found = selectedJobRequests.find(jobRequest => jobRequest.status !== 'SUCCESS');
    if (found) {
      toast.warn('only successful job request can be compared');
      return;
    }

    const idList = selectedJobRequests.map(jobRequest => jobRequest.id);
    monitoring.getSComparatorOptions(idList).then((result) => {
      this.setState({ sComparatorOptions: result, showRunSComparatorModal: true });
    }).catch(error => {
      toast.error(`fail to prepare parameters for SComparator: ${error}`);
    });
  }

  onRerunConsumerPiece() {
    const { selectedJobRequests } = this.state;
    selectedJobRequests.forEach(jobRequest => this.props.onRerunConsumerPiece(jobRequest));
    this.onClear();
  }

  onCompleteComparision() {
    this.setState({ showRunSComparatorModal: false });
  }

  onCloseComparision() {
    this.setState({ showRunSComparatorModal: false });
  }

  handleClickEvent(event) {
    const id = event.target.id;
    if (id === 'CLEAR') {
      this.onClear();
    }
    if (id === 'CANCEL') {
      this.setState({ isModalOpen: true });
    }
    if (id === 'RERUN') {
      this.setState({ isRerunModalOpen: true });
    }
    if (id === 'FORCE_EXECUTE') {
      this.setState({ isRerunModalOpen: true });
    }
  }

  _sortingIcon(sorting) {
    if (sorting !== this.props.sorting) {
      return null; // We are not sorting by this field.
    }
    switch (this.props.ordering) {
      case 'asc':
        return <i className="fa fa-fw fa-sort-alpha-asc ml-1" />;
      case 'desc':
        return <i className="fa fa-fw fa-sort-alpha-desc ml-1" />;
      default:
        return null;
    }
  }

  isChecked(jobRequest) {
    let $selectedIdExists = false;
    const { selectedJobRequests } = this.state;
    if (selectedJobRequests.length > 0) {
      selectedJobRequests.map((selectedJobRequest) => {
        if (selectedJobRequest.id === jobRequest.id) {
          $selectedIdExists = true;
        }
        return null;
      });
    }

    return $selectedIdExists;
  }

  forceExecuteModal() {
    const { isForceExecuteModalOpen } = this.state;
    return (
      <StaticModal isOpen={isForceExecuteModalOpen}>
        <h2 className="lighter">Force execute job requests</h2>

        <ErrorAlert error={null} />

        <div className="alert alert-warning my-2" role="alert">
          <i className="fa fa-fw fa-exclamation-triangle mr-1" />
          Confirm to force execute all selected job requests, this only will trigger pending jobs!
        </div>

        <div className="form-group mt-4">
          <button
            className="btn btn-danger mr-2"
            type="button"
            onClick={() => this.setState(
              { isForceExecuteModalOpen: false }, () => this.onForceExecuteRequestList(),
            )}
          >
            Yes
          </button>
          <button
            className="btn btn-default"
            type="button"
            onClick={() => this.setState(
              { isForceExecuteModalOpen: false, selectedJobRequests: [] },
            )}
          >
            No
          </button>
        </div>
      </StaticModal>
    );
  }

  _loadJobRequestBundleList() {
    const jobRequestPage = this.props.jobRequestPage;
    const jobRequestList = jobRequestPage.content;
    const jobIdList = jobRequestList.map(jobRequest => jobRequest.jobId);
    monitoring.getJobAvgElapsedTimeList(jobIdList).then((jobAvgElapsedTimeList) => {
      this.setState({
        jobAvgElapsedTimeList: jobAvgElapsedTimeList,
      });
    })
      .catch((error) => {
        this.setState({ jobAvgElapsedTimeList: error });
      });
  }

  _loadAppInfo() {
    appInfoService.getAppInfo()
      .then(appInfo => this.setState({ appInfo }))
      .catch((error) => {
        console.log(`Fail to load app info: ${error}`);
      });
  }

  renderModal() {
    const { isModalOpen } = this.state;
    return (
      <StaticModal isOpen={isModalOpen}>
        <h2 className="lighter">Cancel job requests</h2>

        <ErrorAlert error={null} />

        <div className="alert alert-warning my-2" role="alert">
          <i className="fa fa-fw fa-exclamation-triangle mr-1" />
          Are you sure you want to cancel all selected job requests ?
        </div>

        <div className="form-group mt-4">
          <button
            className="btn btn-danger mr-2"
            type="button"
            onClick={() => this.setState(
              { isModalOpen: false }, () => this.onCancelSelectedJobRequests(),
            )}
          >
            Yes
          </button>
          <button
            className="btn btn-default"
            type="button"
            onClick={() => this.setState({ isModalOpen: false, selectedJobRequests: [] })}
          >
            No
          </button>
        </div>
      </StaticModal>
    );
  }

  renderRerunModal() {
    const { isRerunModalOpen } = this.state;
    return (
      <StaticModal isOpen={isRerunModalOpen}>
        <h2 className="lighter">Re-run job requests</h2>

        <ErrorAlert error={null} />

        <div className="alert alert-warning my-2" role="alert">
          <i className="fa fa-fw fa-exclamation-triangle mr-1" />
          Are you sure you want to re-run all selected job requests ?
        </div>

        <div className="form-group mt-4">
          <button
            className="btn btn-danger mr-2"
            type="button"
            onClick={() => this.setState(
              { isRerunModalOpen: false }, () => this.onRerunSelectedJobRequests(),
            )}
          >
            Yes
          </button>
          <button
            className="btn btn-default"
            type="button"
            onClick={() => this.setState(
              { isRerunModalOpen: false, selectedJobRequests: [] },
            )}
          >
            No
          </button>
        </div>
      </StaticModal>
    );
  }

  renderRunSComparatorModal() {
    if (this.state.showRunSComparatorModal) {
      return (
        <RunSComparatorModal
          input={this.state.sComparatorOptions}
          onComplete={this.onCompleteComparision}
          onClose={this.onCloseComparision}
        />
      );
    }

    return null;
  }

  render() {
    const { jobRequestPage, filteringStage } = this.props;
    const { jobAvgElapsedTimeList, appInfo } = this.state;
    const jobRequestList = jobRequestPage.content;
    const canExecute = this.props.currentUser.canExecute;

    let currentFilteringStage = filteringStage;
    if (filteringStage === '') {
      currentFilteringStage = 'Status / Stage';
    }
    const $rows = (jobRequestList || []).map(jobRequest => {
      const jobRequestElapsedTime = jobAvgElapsedTimeList.find(
        elapsedTime => elapsedTime.jobId === jobRequest.jobId,
      );

      let $elapsedTimeBlock = null;
      let $runBar = null;
      if (jobRequestElapsedTime) {
        const avgElapsedTime = jobRequestElapsedTime.avgElapsedTime;
        const isDone = jobRequest.stage === 'FAILED' || jobRequest.stage === 'SUCCEEDED'
          || jobRequest.stage === 'CANCELLED';
        const isSummited = jobRequest.submitTime !== null && jobRequest.submitTime !== 'undefined';

        if (!isDone && isSummited) {
          const duration = moment(jobRequestElapsedTime.nowTime).diff(
            moment(jobRequest.submitTime), 'minutes',
          );

          let overrunMins = 0;
          if (avgElapsedTime !== 0) {
            overrunMins = duration - avgElapsedTime;
          }

          if (overrunMins > 0) {
            const style = { text: 'text-warning', arrow: 'fa-long-arrow-up' };
            const barStyle = 'bg-warning progress-bar-striped progress-bar-animated';

            const elapsedTimePercentage = '100%';
            const leftTimePercentage = '0%';

            $elapsedTimeBlock = (
              <div style={{ marginBottom: '3px' }}>
                <p className="mb-0 text-muted form-inline">
                  <span className={`${style.text} mr-2 form-inline`}>
                    <i className={`fa ${style.arrow}`} /> {`${overrunMins} mins`}
                  </span>
                  <span className="text-nowrap">{`Avg ${avgElapsedTime} mins`}</span>
                </p>
              </div>
            );

            $runBar = (
              <div className="progress">
                <div
                  className={`progress-bar ${barStyle}`}
                  role="progressbar"
                  aria-valuenow="75"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  style={{ width: `${elapsedTimePercentage}` }}
                />
                <div
                  className="progress-bar bg-info"
                  role="progressbar"
                  style={{ width: `${leftTimePercentage}` }}
                  aria-valuenow="20"
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
              </div>
            );
          }
        }
      }

      return (
        <tr key={jobRequest.id}>
          {canExecute && (
            <td>
              <input
                type="checkbox"
                checked={this.isChecked(jobRequest)}
                onChange={event => this.onSelectJobRequest(jobRequest, event)}
              />
            </td>
          )}
          <td>
            <div>
              <Link to={`/job-request/detail/${jobRequest.id}`}>
                <strong className="mr-1">#{jobRequest.id}:</strong>
                {truncateChars(jobRequest.name, 80)}
              </Link>
              <span className="badge badge-secondary ml-1">{jobRequest.executionType}</span>
              {jobRequest.extraInfo
                && jobRequest.extraInfo.entries['entity.name']
                && <span className="badge badge-secondary ml-1">{jobRequest.extraInfo.entries['entity.name']}</span>}
            </div>
            <div className="text-muted">
              {jobRequest.jobGroupName || 'N/A'}
            </div>
            {(jobRequest.batchUuid !== '00000000-0000-0000-0000-000000000000') && (
              <div className="text-muted">
                Batch Request:
                <Link to={`/batch-request/uuid/${jobRequest.batchUuid}`}>
                  <span className="text-code">{jobRequest.batchUuid}</span>
                </Link>
              </div>
            )}
            <div className="form-inline">
              {(jobRequest.jobScope || jobRequest.jobConsumer) && (
                <div>
                  <span className="badge badge-light">{jobRequest.jobScope}</span>/
                  <span className="badge badge-light">{jobRequest.jobConsumer}</span>
                </div>
              )}
            </div>
          </td>
          <td>
            <div>{formatTime(jobRequest.createTime)}</div>
            <div className="text-muted">
              {formatTime(jobRequest.startTime) || 'N/A'} ~ {formatTime(jobRequest.endTime) || 'N/A'}
            </div>
            <div className="text-muted">
              Time used: {formatDuration(jobRequest.startTime, jobRequest.endTime) || 'N/A'}
            </div>
            <div>
              {jobRequest.executionSystem && (
                <a
                  href={`/frontend/globalConfig/execution-system/detail/${jobRequest.executionSystem.id}`}
                >
                  {jobRequest.executionSystem.name}
                </a>
              )}
            </div>
          </td>
          <td>
            {jobRequest.username}
          </td>
          <td>
            <div><RequestStatusBadge status={jobRequest.status} /></div>
            <div className="text-muted">{jobRequest.stage}</div>
          </td>
          <td>
            {$elapsedTimeBlock}
            {$runBar}
          </td>
          <td>
            {(jobRequest.tradeErrorCount > 0)
            && (<div><AlertCountBadge text={`${jobRequest.tradeErrorCount}`} /></div>)}
          </td>
        </tr>
      );
    });

    return (
      <div>
        <table className="table table-striped table-fixed">
          <thead>
            <tr>
              { canExecute && (
              <th style={{ width: '7.5%' }}>
                <div className="btn-group">
                  <button
                    data-toggle="dropdown"
                    className="btn btn-primary dropdown-toggle"
                    type="button"
                    id="dropdown-menu"
                  >ACTIONS<span className="caret" />
                  </button>
                  <div className="dropdown-menu">
                    <button id="SELECT_ALL_JOBS" className="dropdown-item" type="button" onClick={this.onSelectJobRequestAll}>Select All Jobs</button>
                    <button id="CLEAR" className="dropdown-item" type="button" onClick={this.handleClickEvent}>Clear</button>
                    <div className="dropdown-divider" />
                    <button id="CANCEL" className="dropdown-item" type="button" onClick={this.handleClickEvent}>Cancel Jobs</button>
                    <button id="RERUN" className="dropdown-item" type="button" onClick={this.handleClickEvent}>Rerun Jobs</button>
                    <button id="FORCE_EXECUTE" className="dropdown-item" type="button" onClick={this.handleClickEvent}>Force Execute</button>
                    <button id="RERUN_CONSUMER_PIECE" className="dropdown-item" type="button" onClick={this.onRerunConsumerPiece}>Rerun Consumer Piece</button>
                    { appInfo.envName !== 'PDN-CLUSTER'
                      && <button id="FORCE_OK" className="dropdown-item" type="button" onClick={this.onForceOKSelectedJobRequests}>Mark As Success</button>}
                    <div className="dropdown-divider" />
                    <button id="RunSComparator" className="dropdown-item" type="button" onClick={this.onRunSComparator}>Run SComparator</button>
                  </div>
                </div>
              </th>
              )}
              <th>
                <button className="anchor" type="button" onClick={() => this.onToggleSorting('name')}>
                  Name
                  {this._sortingIcon('name')}
                </button>
                <span className="px-1">/</span>
                Batch
                <span className="px-1">/</span>
                Scope
                <span className="px-1">/</span>
                Consumer
              </th>
              <th style={{ width: '20%' }}>
                <button className="anchor" type="button" onClick={() => this.onToggleSorting('createTime')}>
                  Create Time
                  {this._sortingIcon('createTime')}
                </button>
                <span className="px-1">/</span>
                <button className="anchor" type="button" onClick={() => this.onToggleSorting('startTime')}>
                  Start
                  {this._sortingIcon('startTime')}
                </button>
                <span className="px-1"> &amp;End Time </span>
                <span className="px-1">/</span>
                Execution System
              </th>
              <th style={{ width: '10%' }}>User</th>
              <th style={{ width: '10%' }} className="dropdown">
                <a
                  className="dropdown-toggle"
                  data-toggle="dropdown"
                  href="#drop-down-status"
                  role="button"
                  aria-haspopup="true"
                  aria-expanded="true"
                >
                  {currentFilteringStage}
                </a>
                <div className="dropdown-menu" id="#drop-down-status">
                  <button className="dropdown-item" type="button" onClick={() => this.props.onFilterByStatus('')}>All</button>
                  <button className="dropdown-item" type="button" onClick={() => this.props.onFilterByStatus('PENDING')}>Pending</button>
                  <button className="dropdown-item" type="button" onClick={() => this.props.onFilterByStatus('ONGOING')}>Ongoing</button>
                  <button className="dropdown-item" type="button" onClick={() => this.props.onFilterByStatus('SUCCESS')}>Success</button>
                  <button className="dropdown-item" type="button" onClick={() => this.props.onFilterByStatus('FAILURE')}>Failure</button>
                </div>
              </th>
              <th style={{ width: '10%' }}>Elapsed Time</th>
              <th style={{ width: '5%' }}>Trade Errors</th>
            </tr>
          </thead>
          <tbody>
            {$rows}
          </tbody>
        </table>

        {this.renderModal()}
        {this.renderRerunModal()}
        {this.renderRunSComparatorModal()}
        {this.forceExecuteModal()}

        <Paginator page={jobRequestPage} onClickPage={this.props.onClickPage} />

      </div>
    );
  }
}


JobRequestPage.propTypes = {
  jobRequestPage: ScorchPropTypes.pageOf(ScorchPropTypes.jobRequest()).isRequired,
  sorting: PropTypes.oneOf(['name', 'createTime', 'status']).isRequired,
  currentUser: ScorchPropTypes.currentUser().isRequired,
  ordering: PropTypes.oneOf(['asc', 'desc']).isRequired,
  filteringStage: PropTypes.oneOf(['', 'PENDING', 'ONGOING', 'SUCCESS', 'FAILURE']).isRequired,
  onChangeSortingOrdering: PropTypes.func.isRequired,
  onClickPage: PropTypes.func.isRequired,
  onRerunJobRequest: PropTypes.func.isRequired,
  onRerunJobRequestList: PropTypes.func.isRequired,
  onForceOKJobRequestList: PropTypes.func.isRequired,
  onCancelJobRequest: PropTypes.func.isRequired,
  onRerunConsumerPiece: PropTypes.func.isRequired,
  onFilterByStatus: PropTypes.func.isRequired,
  onForceExecuteRequestList: PropTypes.func.isRequired,
};
