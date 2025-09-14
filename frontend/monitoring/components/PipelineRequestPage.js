import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import moment from 'moment';
import { toast } from 'react-toastify';

import { formatDuration, formatTime, truncateChars } from '../../utils/utilities';
import Paginator from '../../components/Paginator';
import RequestStatusBadge from '../../components/RequestStatusBadge';
import ScorchPropTypes from '../../proptypes/scorch';
import { getBatchRequestProgress } from '../utils';
import monitoring from '../../backend/monitoring';
import RunSComparatorModal from './RunSComparatorModal';
import StaticModal from '../../components/StaticModal';
import ErrorAlert from '../../components/ErrorAlert';

export default class PipelineRequestPage extends React.Component {
  static isNotDone(scorchRequest) {
    return scorchRequest.status !== 'SUCCESS' && scorchRequest.status !== 'FAILURE'
      && scorchRequest.status !== 'FAILED_IGNORE';
  }

  static isDone(scorchRequest) {
    return scorchRequest.status === 'SUCCESS' || scorchRequest.status === 'FAILURE'
      || scorchRequest.status === 'FAILED_IGNORE';
  }

  static sortingIcon(sorting, propsSorting, ordering) {
    if (sorting !== propsSorting) {
      return null; // We are not sorting by this field.
    }
    switch (ordering) {
      case 'asc':
        return <i className="fa fa-fw fa-sort-alpha-asc ml-1" />;
      case 'desc':
        return <i className="fa fa-fw fa-sort-alpha-desc ml-1" />;
      default:
        return null;
    }
  }

  static getNodeRequestDetailLink(scorchRequest) {
    if (scorchRequest.nodeType === 'BATCH') {
      return (
        <Link to={`/batch-request/detail/${scorchRequest.id}`}>
          <strong>#{scorchRequest.id}:</strong> {truncateChars(scorchRequest.name, 80)}
        </Link>
      );
    }
    return (
      <Link to={`/pipeline-request/detail/${scorchRequest.id}`}>
        <strong>#{scorchRequest.id}:</strong> {truncateChars(scorchRequest.name, 80)}
      </Link>
    );
  }

  constructor(props) {
    super(props);
    this.state = {
      isCancelModalOpen: false,
      selectedScorchRequests: [],
      showRunSComparatorModal: false,
      sComparatorOptions: {},
    };
    this.onCancelScorchRequest = this.onCancelScorchRequest.bind(this);
    this.onSelectScorchRequestAll = this.onSelectScorchRequestAll.bind(this);
    this.onClear = this.onClear.bind(this);
    this.onChecked = this.onChecked.bind(this);
    this.onSelectScorchRequest = this.onSelectScorchRequest.bind(this);
    this.onRerunSelectedFailedRequests = this.onRerunSelectedFailedRequests.bind(this);
    this.onForceOKSelectedRequests = this.onForceOKSelectedRequests.bind(this);
    this.onRerunSelectedPipelineRequests = this.onRerunSelectedPipelineRequests.bind(this);
    this.onForceExecuteRequests = this.onForceExecuteRequests.bind(this);
    this.onRunSComparator = this.onRunSComparator.bind(this);
    this.onCompleteComparision = this.onCompleteComparision.bind(this);
    this.onCloseComparision = this.onCloseComparision.bind(this);
    this.onTriggerCancelButton = this.onTriggerCancelButton.bind(this);
    this.onRerunConsumerPieceSelectedRequests = this
      .onRerunConsumerPieceSelectedRequests.bind(this);
  }

  onCancelScorchRequest(scorchRequest) {
    this.props.onCancelScorchRequest(scorchRequest);
  }

  onSelectScorchRequestAll() {
    const scorchRequestPage = this.props.scorchRequestPage;
    const selectedScorchRequests = scorchRequestPage.content.slice();
    this.setState({ selectedScorchRequests });
  }

  onClear() {
    this.setState({ selectedScorchRequests: [] });
  }

  onRunSComparator() {
    const { selectedScorchRequests } = this.state;

    if (selectedScorchRequests.length < 1) {
      toast.warn('at least one batch request should be selected');
      return;
    }

    const found = selectedScorchRequests.find(batchRequest => batchRequest.status !== 'SUCCESS');
    if (found) {
      toast.warn('only successful batch request can be selected to compare');
      return;
    }

    const existsPipelineRequest = selectedScorchRequests.find(request => request.nodeType === 'PIPELINE');
    if (existsPipelineRequest) {
      toast.warn('only batch request can be selected to compare');
      return;
    }

    const idList = selectedScorchRequests.map(batchRequest => batchRequest.id);
    monitoring.getSComparatorOptionsForBatchList(idList).then((result) => {
      this.setState({ sComparatorOptions: result, showRunSComparatorModal: true });
    }).catch(error => {
      toast.error(`fail to prepare parameters for SComparator: ${error}`);
    });
  }

  onRerunConsumerPieceSelectedRequests() {
    const { selectedScorchRequests } = this.state;
    const found = selectedScorchRequests.find(
      batchRequest => !PipelineRequestPage.isDone(batchRequest),
    );
    if (found) {
      toast.error('only terminated request can rerun consumer piece.');
      return;
    }

    selectedScorchRequests.forEach(request => this.onRerunConsumerPiece(request));
    this.onClear();
  }

  onRerunConsumerPiece(scorchRequest) {
    this.props.onRerunConsumerPiece(scorchRequest);
  }


  onCompleteComparision() {
    this.setState({ showRunSComparatorModal: false });
  }

  onCloseComparision() {
    this.setState({ showRunSComparatorModal: false });
  }

  onChecked(batchRequest) {
    let $selectedIdExists = false;
    const { selectedScorchRequests } = this.state;
    if (selectedScorchRequests.length > 0) {
      selectedScorchRequests.map((selectedBatchRequest) => {
        if (selectedBatchRequest.id === batchRequest.id) {
          $selectedIdExists = true;
        }
        return null;
      });
    }

    return $selectedIdExists;
  }

  onSelectScorchRequest(batchRequest, event) {
    const { selectedScorchRequests } = this.state;
    const newSelectedBatches = selectedScorchRequests.slice();
    if (event.target.checked) {
      newSelectedBatches.push(batchRequest);
    } else {
      const batchReqIds = selectedScorchRequests.map(batchReq => batchReq.id);
      const index = batchReqIds.indexOf(batchRequest.id);
      if (index > -1) {
        newSelectedBatches.splice(index, 1);
      }
    }

    this.setState({
      selectedScorchRequests: newSelectedBatches,
    });
  }

  onCancelSelectedScorchRequests() {
    const { selectedScorchRequests } = this.state;
    const found = selectedScorchRequests.find(
      batchRequest => PipelineRequestPage.isDone(batchRequest),
    );
    if (found) {
      toast.error('only unterminated request can be cancel.');
      return;
    }

    selectedScorchRequests.forEach(request => this.onCancelScorchRequest(request));
    this.onClear();
  }

  onRerunSelectedFailedRequests() {
    const { selectedScorchRequests } = this.state;
    this.props.onRerunFailedRequestList(selectedScorchRequests);
    this.onClear();
  }

  onForceExecuteRequests() {
    const { selectedScorchRequests } = this.state;
    this.props.onForceExecuteRequests(selectedScorchRequests);
    this.onClear();
  }

  onForceOKSelectedRequests() {
    const { selectedScorchRequests } = this.state;
    this.props.onForceOKRequestList(selectedScorchRequests);
    this.onClear();
  }

  onRerunSelectedPipelineRequests() {
    const { selectedScorchRequests } = this.state;
    this.props.onRerunPipelineRequestList(selectedScorchRequests);
    this.onClear();
  }

  onTriggerCancelButton() {
    this.setState({ isCancelModalOpen: true });
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

  renderCancelModal() {
    const { isCancelModalOpen } = this.state;
    return (
      <StaticModal isOpen={isCancelModalOpen}>
        <h2 className="lighter">Cancel batch requests</h2>

        <ErrorAlert error={null} />

        <div className="alert alert-warning my-2" role="alert">
          <i className="fa fa-fw fa-exclamation-triangle mr-1" />
          Are you sure you want to cancel all selected batch requests ?
        </div>

        <div className="form-group mt-4">
          <button
            className="btn btn-danger mr-2"
            type="button"
            onClick={() => this.setState(
              { isCancelModalOpen: false }, () => this.onCancelSelectedScorchRequests(),
            )}
          >
            Yes
          </button>
          <button
            className="btn btn-default"
            type="button"
            onClick={() => this.setState({ isCancelModalOpen: false, selectedScorchRequests: [] })}
          >
            No
          </button>
        </div>
      </StaticModal>
    );
  }

  render() {
    const {
      scorchRequestPage, batchAvgElapsedTimeList,
      sorting, ordering, fromPipelineId,
    } = this.props;
    const scorchRequestList = scorchRequestPage.content;
    const canExecute = this.props.currentUser.canExecute;
    const $rows = (scorchRequestList || []).map(scorchRequest => {
      let $elapsedTimeBlock = null;

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

      const process = getBatchRequestProgress(scorchRequest);
      let $runBar = (
        <div
          className="progress-bar"
          role="progressbar"
          aria-valuenow={process}
          aria-valuemin="0"
          aria-valuemax="100"
          style={{ width: `${process}%` }}
        />
      );

      const batchRequestElapsedTime = batchAvgElapsedTimeList.find(
        elapsedTime => elapsedTime.name === scorchRequest.name,
      );
      if (batchRequestElapsedTime) {
        const avgElapsedTime = batchRequestElapsedTime.avgElapsedTime;

        if (PipelineRequestPage.isNotDone(scorchRequest)) {
          const duration = moment(batchRequestElapsedTime.nowTime).diff(
            moment(scorchRequest.startTime), 'minutes',
          );

          let overrunMins = 0;
          if (avgElapsedTime !== 0) {
            overrunMins = duration - avgElapsedTime;
          }

          if (overrunMins > 0) {
            const style = { text: 'text-warning', arrow: 'fa-long-arrow-up' };
            const barStyle = 'bg-warning progress-bar-striped progress-bar-animated';

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
              <div
                className={`progress-bar ${barStyle}`}
                role="progressbar"
                aria-valuenow="100"
                aria-valuemin="0"
                aria-valuemax="100"
                style={{ width: '100%' }}
              />
            );
          }
        }
      }

      return (
        <tr key={scorchRequest.id}>
          {canExecute && (
            <td>
              <input
                type="checkbox"
                checked={this.onChecked(scorchRequest)}
                onChange={event => this.onSelectScorchRequest(scorchRequest, event)}
              />
            </td>
          )}
          {
            fromPipelineId && (
              <td>
                {scorchRequest.runningSequence}
              </td>
            )
          }
          <td>
            <div>
              {PipelineRequestPage.getNodeRequestDetailLink(scorchRequest)}
            </div>
            <div className="text-muted">UUID: <code>{scorchRequest.uuid}</code></div>
          </td>
          <td>
            {scorchRequest.nodeType}
          </td>
          <td>
            <div>
              {formatTime(scorchRequest.startTime) || 'N/A'} ~ {formatTime(scorchRequest.endTime) || 'N/A'}
            </div>
            <div className="text-muted">
              Time used: {formatDuration(scorchRequest.startTime, scorchRequest.endTime) || 'N/A'}
            </div>
          </td>
          <td>
            {scorchRequest.username}
          </td>
          <td>
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
            <div className="progress mt-1" style={{ height: '.5rem' }}>
              {$runBar}
            </div>
          </td>
          <td>
            {$elapsedTimeBlock}
          </td>
          <td>
            <RequestStatusBadge status={scorchRequest.status} errorGoingNumber={errorGoingNumber} />
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
                      <button id="SELECT_ALL_JOBS" className="dropdown-item" type="button" onClick={this.onSelectScorchRequestAll}>Select All Nodes</button>
                      <button id="CLEAR" className="dropdown-item" type="button" onClick={this.onClear}>Clear</button>
                      <button id="CANCEL" className="dropdown-item" type="button" onClick={this.onTriggerCancelButton}>Cancel Request</button>
                      <button id="RERUN_FAILED_JOBS" className="dropdown-item" type="button" onClick={this.onRerunSelectedFailedRequests}>Rerun Failed Jobs</button>
                      <button id="RERUN_PIPEPLINE_REQ" className="dropdown-item" type="button" onClick={this.onRerunSelectedPipelineRequests}>Rerun Pipeline Requests</button>
                      <button id="FORCE_EXECUTE_JOBS" className="dropdown-item" type="button" onClick={this.onForceExecuteRequests}>Force Execute Jobs</button>
                      <button id="RunSComparator" className="dropdown-item" type="button" onClick={this.onRunSComparator}>Run SComparator</button>
                      <button id="RERUN_CONSUMER_PIECE" className="dropdown-item" type="button" onClick={this.onRerunConsumerPieceSelectedRequests}>Rerun Consumer Piece</button>
                      <button id="MARK_SUCCESS" className="dropdown-item" type="button" onClick={this.onForceOKSelectedRequests}>Mark As Success</button>
                    </div>
                  </div>
                </th>
              )}
              {
                fromPipelineId && (
                  <th style={{ width: '5%' }}>
                    <button className="anchor" type="button" onClick={() => this.props.onToggleOrdering('runningSequence')}>
                      Seq {PipelineRequestPage.sortingIcon('runningSequence', sorting, ordering)}
                    </button>
                  </th>
                )
              }
              <th style={{ width: '20%' }}>
                <button className="anchor" type="button" onClick={() => this.props.onToggleOrdering('id')}>
                  Name {PipelineRequestPage.sortingIcon('id', sorting, ordering)}
                </button>
              </th>
              <th style={{ width: '10%' }}>
                Node Type
              </th>
              <th style={{ width: '20%' }}>
                <button className="anchor" type="button" onClick={() => this.props.onToggleOrdering('startTime')}>
                  Start Time {PipelineRequestPage.sortingIcon('startTime', sorting, ordering)}
                </button>
                <span className="px-1">/</span>
                <button className="anchor" type="button" onClick={() => this.props.onToggleOrdering('endTime')}>
                  End Time {PipelineRequestPage.sortingIcon('endTime', sorting, ordering)}
                </button>
              </th>
              <th style={{ width: '10%' }}>
                User
              </th>
              <th style={{ width: '11%' }}>
                <abbr title="Counts of job requests: total / pending / ongoing / success / failure">
                  Counts
                </abbr>
              </th>
              <th style={{ width: '11%' }}>
                Elapsed Time
              </th>
              <th style={{ width: '6%' }}>
                <button className="anchor" type="button" onClick={() => this.props.onToggleOrdering('status')}>
                  Status {PipelineRequestPage.sortingIcon('status', sorting, ordering)}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {$rows}
          </tbody>
        </table>
        <Paginator page={scorchRequestPage} onClickPage={this.props.onClickPage} />
        {this.renderRunSComparatorModal()}
        {this.renderCancelModal()}
      </div>
    );
  }
}

PipelineRequestPage.propTypes = {
  scorchRequestPage: ScorchPropTypes.pageOf(ScorchPropTypes.batchRequest()).isRequired,
  batchAvgElapsedTimeList: PropTypes.arrayOf(ScorchPropTypes.batchAvgElapsedTime()).isRequired,
  currentUser: ScorchPropTypes.currentUser().isRequired,
  onToggleOrdering: PropTypes.func.isRequired,
  onClickPage: PropTypes.func.isRequired,
  onCancelScorchRequest: PropTypes.func.isRequired,
  onRerunFailedRequestList: PropTypes.func.isRequired,
  onRerunPipelineRequestList: PropTypes.func.isRequired,
  onRerunConsumerPiece: PropTypes.func.isRequired,
  onForceOKRequestList: PropTypes.func.isRequired,
  onForceExecuteRequests: PropTypes.func.isRequired,
  sorting: PropTypes.oneOf(['id', 'startTime', 'endTime', 'status', 'runningSequence']).isRequired,
  ordering: PropTypes.oneOf(['asc', 'desc']).isRequired,
  fromPipelineId: PropTypes.number,
};

PipelineRequestPage.defaultProps = {
  fromPipelineId: null,
};
