import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { toast } from 'react-toastify';

import { formatDuration, formatTime, truncateChars } from '../../utils/utilities';
import Paginator from '../../components/Paginator';
import RequestStatusBadge from '../../components/RequestStatusBadge';
import { getBatchRequestProgress } from '../utils';
import monitoring from '../../backend/monitoring';
import RunSComparatorModal from './RunSComparatorModal';
import StaticModal from '../../components/StaticModal';
import ErrorAlert from '../../components/ErrorAlert';


const isNotDone = (batchRequest) => {
  return batchRequest.status !== 'SUCCESS' && batchRequest.status !== 'FAILURE'
    && batchRequest.status !== 'FAILED_IGNORE';
};

const isDone = (batchRequest) => {
  return batchRequest.status === 'SUCCESS' || batchRequest.status === 'FAILURE'
    || batchRequest.status === 'FAILED_IGNORE';
};

const sortingIcon = (sorting, propsSorting, ordering) => {
  if (sorting !== propsSorting) {
    return null;
  }
  switch (ordering) {
    case 'asc':
      return <i className="fa fa-fw fa-sort-alpha-asc ml-1" />;
    case 'desc':
      return <i className="fa fa-fw fa-sort-alpha-desc ml-1" />;
    default:
      return null;
  }
};

const BatchRequestPage = ({
  batchRequestPage,
  executionSystemList,
  batchAvgElapsedTimeList,
  currentUser,
  onToggleOrdering,
  onClickPage,
  onCancelBatchRequest,
  onRerunConsumerPiece,
  onForceOK,
  onRerunBatch,
  sorting,
  ordering,
  fromPipelineId = null
}) => {
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedBatchRequests, setSelectedBatchRequests] = useState([]);
  const [showRunSComparatorModal, setShowRunSComparatorModal] = useState(false);
  const [sComparatorOptions, setSComparatorOptions] = useState({});

  const onSelectBatchRequestAll = useCallback(() => {
    const newSelectedBatchRequests = batchRequestPage.content.slice();
    setSelectedBatchRequests(newSelectedBatchRequests);
  }, [batchRequestPage.content]);

  const onClear = useCallback(() => {
    setSelectedBatchRequests([]);
  }, []);

  const onRunSComparator = useCallback(async () => {
    if (selectedBatchRequests.length < 1) {
      toast.warn('at least one batch request should be selected');
      return;
    }

    const found = selectedBatchRequests.find(batchRequest => batchRequest.status !== 'SUCCESS');
    if (found) {
      toast.warn('only successful batch request can be selected to compare');
      return;
    }

    const idList = selectedBatchRequests.map(batchRequest => batchRequest.id);
    try {
      const result = await monitoring.getSComparatorOptionsForBatchList(idList);
      setSComparatorOptions(result);
      setShowRunSComparatorModal(true);
    } catch (error) {
      toast.error(`fail to prepare parameters for SComparator: ${error}`);
    }
  }, [selectedBatchRequests]);

  const onRerunBatchHandler = useCallback(() => {
    onRerunBatch(selectedBatchRequests);
    setSelectedBatchRequests([]);
  }, [onRerunBatch, selectedBatchRequests]);

  const onForceOKHandler = useCallback(() => {
    onForceOK(selectedBatchRequests);
    setSelectedBatchRequests([]);
  }, [onForceOK, selectedBatchRequests]);

  const onRerunConsumerPieceHandler = useCallback(() => {
    onRerunConsumerPiece(selectedBatchRequests);
    setSelectedBatchRequests([]);
  }, [onRerunConsumerPiece, selectedBatchRequests]);

  const onCompleteComparision = useCallback(() => {
    setShowRunSComparatorModal(false);
  }, []);

  const onCloseComparision = useCallback(() => {
    setShowRunSComparatorModal(false);
  }, []);

  const onChecked = useCallback((batchRequest) => {
    return selectedBatchRequests.some(selectedBatchRequest => 
      selectedBatchRequest.id === batchRequest.id
    );
  }, [selectedBatchRequests]);

  const onSelectBatchRequest = useCallback((batchRequest, event) => {
    const newSelectedBatches = selectedBatchRequests.slice();
    if (event.target.checked) {
      newSelectedBatches.push(batchRequest);
    } else {
      const index = newSelectedBatches.findIndex(batchReq => batchReq.id === batchRequest.id);
      if (index > -1) {
        newSelectedBatches.splice(index, 1);
      }
    }
    setSelectedBatchRequests(newSelectedBatches);
  }, [selectedBatchRequests]);

  const onCancelSelectedBatchRequests = useCallback(() => {
    const found = selectedBatchRequests.find(batchRequest => isDone(batchRequest));
    if (found) {
      toast.error('only unterminated batch can be cancel.');
      return;
    }

    selectedBatchRequests.forEach(batchRequest => onCancelBatchRequest(batchRequest));
    onClear();
  }, [selectedBatchRequests, onCancelBatchRequest, onClear]);

  const onTriggerCancelButton = useCallback(() => {
    setIsCancelModalOpen(true);
  }, []);

  const renderRunSComparatorModal = useCallback(() => {
    if (showRunSComparatorModal) {
      return (
        <RunSComparatorModal
          input={sComparatorOptions}
          onComplete={onCompleteComparision}
          onClose={onCloseComparision}
        />
      );
    }
    return null;
  }, [showRunSComparatorModal, sComparatorOptions, onCompleteComparision, onCloseComparision]);

  const renderCancelModal = useCallback(() => {
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
            onClick={() => {
              setIsCancelModalOpen(false);
              onCancelSelectedBatchRequests();
            }}
          >
            Yes
          </button>
          <button
            className="btn btn-default"
            type="button"
            onClick={() => {
              setIsCancelModalOpen(false);
              setSelectedBatchRequests([]);
            }}
          >
            No
          </button>
        </div>
      </StaticModal>
    );
  }, [isCancelModalOpen, onCancelSelectedBatchRequests]);

  const batchRequestList = batchRequestPage.content;
  const canExecute = currentUser.canExecute;
  
  const $rows = (batchRequestList || []).map(batchRequest => {
    let $elapsedTimeBlock = null;

    const process = getBatchRequestProgress(batchRequest);
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
      elapsedTime => elapsedTime.name === batchRequest.name,
    );
    if (batchRequestElapsedTime) {
      const avgElapsedTime = batchRequestElapsedTime.avgElapsedTime;

      if (isNotDone(batchRequest)) {
        const duration = moment(batchRequestElapsedTime.nowTime).diff(
          moment(batchRequest.startTime), 'minutes',
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

    const executionSystem = executionSystemList.find(
      es => es.id === batchRequest.executionSystemId,
    );

    return (
      <tr key={batchRequest.id}>
        {canExecute && (
          <td>
            <input
              type="checkbox"
              checked={onChecked(batchRequest)}
              onChange={event => onSelectBatchRequest(batchRequest, event)}
            />
          </td>
        )}
        {
          fromPipelineId && (
            <td>
              {batchRequest.runningSequence}
            </td>
          )
        }
        <td>
          <div>
            <Link to={`/batch-request/detail/${batchRequest.id}`}>
              <strong>#{batchRequest.id}:</strong> {truncateChars(batchRequest.name, 80)}
            </Link>
          </div>
          <div className="text-muted">UUID: <code>{batchRequest.uuid}</code></div>
          {
            (batchRequest.pipelineRequestUUID
              && batchRequest.pipelineRequestUUID !== '00000000-0000-0000-0000-000000000000') && (
              <div className="text-muted">
                Parent Request:
                <Link to={`/pipeline-request/uuid/${batchRequest.pipelineRequestUUID}`}>
                  {batchRequest.pipelineRequestUUID}
                </Link>
              </div>
            )
          }
        </td>
        <td>
          <div>
            {formatTime(batchRequest.startTime) || 'N/A'} ~ {formatTime(batchRequest.endTime) || 'N/A'}
          </div>
          <div className="text-muted">
            Time used: {formatDuration(batchRequest.startTime, batchRequest.endTime) || 'N/A'}
          </div>
          <div>
            {executionSystem && (
              <a
                href={`/frontend/globalConfig/execution-system/detail/${executionSystem.id}`}
              >
                {executionSystem.name}
              </a>
            )}
          </div>
        </td>
        <td>
          {batchRequest.username}
        </td>
        <td>
          <div className="text-code">
            <strong>{batchRequest.totalCount}</strong>
            <span className="text-muted px-1">/</span>
            <span className="text-muted">{batchRequest.pendingCount}</span>
            <span className="text-muted px-1">/</span>
            <span className="text-muted">{batchRequest.ongoingCount}</span>
            <span className="text-muted px-1">/</span>
            <span className="text-success">{batchRequest.successCount}</span>
            <span className="text-muted px-1">/</span>
            <span className="text-danger">{batchRequest.failureCount}</span>
          </div>
          <div className="progress mt-1" style={{ height: '.5rem' }}>
            {$runBar}
          </div>
        </td>
        <td>
          {$elapsedTimeBlock}
        </td>
        <td>
          {/*<RequestStatusBadge status={batchRequest.status} />*/}
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
                    <button id="SELECT_ALL_JOBS" className="dropdown-item" type="button" onClick={onSelectBatchRequestAll}>Select All Batch</button>
                    <button id="CLEAR" className="dropdown-item" type="button" onClick={onClear}>Clear</button>
                    <button id="RERUN_BATCH" className="dropdown-item" type="button" onClick={onRerunBatchHandler}>Rerun Batch</button>
                    <button id="CANCEL" className="dropdown-item" type="button" onClick={onTriggerCancelButton}>Cancel Batch</button>
                    <button id="RunSComparator" className="dropdown-item" type="button" onClick={onRunSComparator}>Run SComparator</button>
                    <button id="RERUN_CONSUMER_PIECE" className="dropdown-item" type="button" onClick={onRerunConsumerPieceHandler}>Rerun Consumer Piece</button>
                    <button id="FORCE_OK" className="dropdown-item" type="button" onClick={onForceOKHandler}>Mark As Success</button>
                  </div>
                </div>
              </th>
            )}
            {
              fromPipelineId && (
                <th style={{ width: '5%' }}>
                  <button className="anchor" type="button" onClick={() => onToggleOrdering('runningSequence')}>
                    Seq {sortingIcon('runningSequence', sorting, ordering)}
                  </button>
                </th>
              )
            }
            <th style={{ width: '30%' }}>
              <button className="anchor" type="button" onClick={() => onToggleOrdering('id')}>
                Batch {sortingIcon('id', sorting, ordering)}
              </button>
            </th>
            <th style={{ width: '20%' }}>
              <button className="anchor" type="button" onClick={() => onToggleOrdering('startTime')}>
                Start Time {sortingIcon('startTime', sorting, ordering)}
              </button>
              <span className="px-1">/</span>
              <button className="anchor" type="button" onClick={() => onToggleOrdering('endTime')}>
                End Time {sortingIcon('endTime', sorting, ordering)}
              </button>
              <span className="px-1">/</span>
              Execution System
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
              <button className="anchor" type="button" onClick={() => onToggleOrdering('status')}>
                Status {sortingIcon('status', sorting, ordering)}
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {$rows}
        </tbody>
      </table>
      <Paginator page={batchRequestPage} onClickPage={onClickPage} />
      {renderRunSComparatorModal()}
      {renderCancelModal()}
    </div>
  );
};

export default BatchRequestPage;