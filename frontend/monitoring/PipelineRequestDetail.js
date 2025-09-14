import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { isEqual } from 'lodash';
import { toast } from 'react-toastify';

import monitoringService from '../backend/monitoring';
import jobExecution from '../backend/jobExecution';
import pipelineRequestService from '../backend/pipelineRequestService';
import { formatTime } from '../utils/utilities';
import LoadingIndicator from '../components/LoadingIndicator';
import ErrorAlert from '../components/ErrorAlert';
import RequestStatusBadge from '../components/RequestStatusBadge';
import { withCurrentUser } from '../components/currentUser';
import { getBatchRequestProgress } from './utils';
import PipelineRequestPage from './components/PipelineRequestPage';
import StaticModal from '../components/StaticModal';


function getDefaultQuery() {
  return {
    sort: 'runningSequence,name,asc',
    status: '',
    page: 0,
    size: 50,
  };
}

const PipelineRequestDetail = ({ currentUser }) => {
  const { pipelineRequestId } = useParams();
  const location = useLocation();

  // State management
  const [pipelineRequest, setPipelineRequest] = useState(null);
  const [scorchRequestPage, setScorchRequestPage] = useState(null);
  const [batchAvgElapsedTimeList, setBatchAvgElapsedTimeList] = useState([]);
  const [currentSorting, setCurrentSorting] = useState('runningSequence');
  const [currentOrdering, setCurrentOrdering] = useState('asc');
  const [schedulerSubmissionLog, setSchedulerSubmissionLog] = useState(null);
  const [isMarkAsSuccessModalOpen, setIsMarkAsSuccessModalOpen] = useState(false);

  // Utility functions
  const isNotDone = useCallback((batchRequest) => {
    return batchRequest.status !== 'SUCCESS' && 
           batchRequest.status !== 'FAILURE' && 
           batchRequest.status !== 'FAILED_IGNORE';
  }, []);

  const onRerunPipelineRequestList = useCallback((requestSucceedList) => {
    if (requestSucceedList) {
      requestSucceedList.forEach(request => {
        pipelineRequestService.rerunPipelineRequest(request)
          .then(() => {
            toast.success(` ${request.name} Jobs will rerun in the coming 3 minutes.`);
          })
          .catch((error) => {
            toast.error(`Failed to rerun request ${request.name}${error}`);
          });
      });
    }
  }, []);

  const getQueryUrl = useCallback((overrides) => {
    const nextQuery = Object.assign({}, getDefaultQuery(), overrides);
    // Remove empty values from the query
    Object.keys(nextQuery).forEach((key) => {
      if (nextQuery[key] === null || nextQuery[key] === '') {
        delete nextQuery[key];
      }
    });
    return nextQuery;
  }, []);

  // Load functions
  const loadPipelineRequestDetail = useCallback(() => {
    if (!pipelineRequestId) return;

    monitoringService.getPipelineRequest(pipelineRequestId)
      .then((pipelineRequest) => {
        setPipelineRequest(pipelineRequest);
      })
      .catch((error) => {
        setPipelineRequest(error);
      });
  }, [pipelineRequestId]);

  const queryAndUpdatePipelineRequestStatus = useCallback(() => {
    if (!pipelineRequest || pipelineRequest instanceof Error) {
      return;
    }

    monitoringService.queryAndUpdatePipelineRequestList([pipelineRequest.id])
      .then((pipelineRequestList) => {
        setPipelineRequest(pipelineRequestList[0]);
      });
  }, [pipelineRequest]);

  const queryBatchAvgElapsedTime = useCallback(() => {
    if (!scorchRequestPage || scorchRequestPage instanceof Error) {
      return;
    }

    const scorchRequestList = scorchRequestPage.content;
    const found = scorchRequestList.find(scorchRequest => 
      isNotDone(scorchRequest) && scorchRequest.nodeType === 'BATCH'
    );
    if (!found) {
      return;
    }

    const scorchRequestNames = scorchRequestList.map(scorchRequest => scorchRequest.name);
    monitoringService.getBatchAvgElapsedTimeList(scorchRequestNames)
      .then((batchAvgElapsedTimeList) => {
        setBatchAvgElapsedTimeList(batchAvgElapsedTimeList);
      });
  }, [scorchRequestPage, isNotDone]);

  const loadScorchRequestPage = useCallback((nextQuery) => {
    if (!pipelineRequest || pipelineRequest instanceof Error) {
      console.log('Cannot load pipeline request page request is not loaded.');
      return;
    }
    const pipelineRequestUUID = pipelineRequest.uuid;

    const query = Object.assign({}, nextQuery || getDefaultQuery(), { pipelineRequestUUID });
    monitoringService.getScorchRequestList(query)
      .then((scorchRequestPage) => {
        setScorchRequestPage(scorchRequestPage);
        queryBatchAvgElapsedTime();
      })
      .catch((error) => {
        setScorchRequestPage(error);
      });
  }, [pipelineRequest, queryBatchAvgElapsedTime]);

  const clearAndLoadBatchRequest = useCallback(() => {
    setPipelineRequest(null);
    setScorchRequestPage(null);
    loadPipelineRequestDetail();
  }, [loadPipelineRequestDetail]);

  const loadSchedulerLog = useCallback(() => {
    if (!pipelineRequest || pipelineRequest instanceof Error) {
      console.log('Cannot load scheduler submission log request is not loaded.');
      return;
    }
    const pipelineRequestUUID = pipelineRequest.uuid;
    monitoringService.getRequestScheduler(pipelineRequestUUID)
      .then((schedulerSubmissionLog) => {
        setSchedulerSubmissionLog(schedulerSubmissionLog);
      })
      .catch((error) => {
        setSchedulerSubmissionLog(error);
      });
  }, [pipelineRequest]);

  // Event handlers
  const onClickPipelineRequestPage = useCallback((page) => {
    const nextQuery = getQueryUrl({ page });
    setScorchRequestPage(null);
    loadScorchRequestPage(nextQuery);
  }, [getQueryUrl, loadScorchRequestPage]);

  const onRerunConsumerPiece = useCallback((scorchRequest) => {
    jobExecution.rerunConsumerPieceInPipeline(scorchRequest)
      .then((rerunScorchRequest) => {
        toast.success(`pipeline node has been reconsumered, status is${rerunScorchRequest.status}`);
        if (!scorchRequestPage || scorchRequestPage instanceof Error) return;

        const scorchRequestList = scorchRequestPage.content;
        const newRequestList = scorchRequestList.map((request) => {
          if (request.uuid === rerunScorchRequest.uuid) {
            return rerunScorchRequest;
          }
          return request;
        });
        const newScorchRequestPage = Object.assign({}, scorchRequestPage, { content });
        setScorchRequestPage(newScorchRequestPage);
        queryAndUpdatePipelineRequestStatus();
      })
      .catch((error) => {
        toast.error(`Failed to rerun consumer piece in pipeline ${error}`);
      });
  }, [scorchRequestPage, queryAndUpdatePipelineRequestStatus]);

  const onCancelRequest = useCallback((scorchRequest) => {
    if (scorchRequest.status === 'FAILURE' || 
        scorchRequest.status === 'SUCCESS' ||
        scorchRequest.status === 'FAILED_IGNORE') {
      return;
    }
    
    jobExecution.cancelScorchRequest(scorchRequest)
      .then((cancelledRequest) => {
        if (!scorchRequestPage || scorchRequestPage instanceof Error) return;

        const scorchRequestList = scorchRequestPage.content;
        const newRequestList = scorchRequestList.map((request) => {
          if (request.uuid === cancelledRequest.uuid) {
            return cancelledRequest;
          }
          return request;
        });
        const newScorchRequestPage = Object.assign({}, scorchRequestPage, { content });
        setScorchRequestPage(newScorchRequestPage);
        queryAndUpdatePipelineRequestStatus();
      })
      .catch((error) => {
        console.log(`Failed to cancel batch request ${error}`);
      });
  }, [scorchRequestPage, queryAndUpdatePipelineRequestStatus]);

  const onMarkAsSuccess = useCallback(() => {
    if (!pipelineRequest || pipelineRequest instanceof Error) return;
    
    const { name, ...request } = pipelineRequest;
    pipelineRequestService.markAsSuccess(request)
      .then(() => {
        queryAndUpdatePipelineRequestStatus();
        toast.success(`${name} marked`);
      })
      .catch((e) => {
        toast.error(`Failed to overwrite ${name} status${e}`);
      });
  }, [pipelineRequest, queryAndUpdatePipelineRequestStatus]);

  const onRerunFailedRequestList = useCallback((failedRequestList) => {
    if (failedRequestList) {
      failedRequestList.forEach(request => {
        pipelineRequestService.rerunFailedJobs(request)
          .then(() => {
            toast.success(`Success to rerun request ${request.name}.`);
            loadPipelineRequestDetail();
          })
          .catch((error) => {
            toast.error(`Failed to rerun request ${request.name}${error}`);
          });
      });
    }
  }, [loadPipelineRequestDetail]);

  const onForceOKRequestList = useCallback((selectedRequestList) => {
    if (selectedRequestList) {
      selectedRequestList.forEach(request => {
        pipelineRequestService.markAsSuccess(request)
          .then((result) => {
            toast.success(`Success to rerun request ${request.name}.`);
            onResetPipelineRequestPage(result);
          })
          .catch((error) => {
            toast.error(`Failed to rerun request ${request.name}${error}`);
          });
      });
    }
  }, []);

  const onForceExecuteRequests = useCallback((failedRequestList) => {
    if (failedRequestList) {
      failedRequestList.forEach(request => {
        pipelineRequestService.forceExecutePipelineRequest(request)
          .then(() => {
            toast.success(`Success to execute request ${request.name}.`);
            setPipelineRequest(null);
            setScorchRequestPage(null);
            loadPipelineRequestDetail();
          })
          .catch((error) => {
            toast.error(`Failed to execute request ${request.name}${error}`);
          });
      });
    }
  }, [loadPipelineRequestDetail]);

  const onResetPipelineRequestPage = useCallback((scorchRequest) => {
    if (!scorchRequestPage || scorchRequestPage instanceof Error) return;

    const requestList = scorchRequestPage.content;
    const newScorchRequestList = requestList.map((request) => {
      if (request.id === scorchRequest.id) {
        return scorchRequest;
      }
      return request;
    });
    const newRequestPage = Object.assign({}, scorchRequestPage, { content });
    setScorchRequestPage(newRequestPage);
  }, [scorchRequestPage]);

  const onToggleOrdering = useCallback((sorting) => {
    let ordering = 'asc';
    if (sorting === currentSorting) {
      ordering = currentOrdering === 'asc' ? 'desc' : 'asc';
    }
    const queryOverrides = {
      sort: `${sorting},${ordering}`,
      page0,
    };
    setCurrentOrdering(ordering);
    setCurrentSorting(sorting);
    const nextQuery = getQueryUrl(queryOverrides);
    setScorchRequestPage(null);
    loadScorchRequestPage(nextQuery);
  }, [currentSorting, currentOrdering, getQueryUrl, loadScorchRequestPage]);

  // Effects
  useEffect(() => {
    document.title = 'Pipeline Request';
    loadPipelineRequestDetail();
  }, [loadPipelineRequestDetail]);

  useEffect(() => {
    if (pipelineRequest && !(pipelineRequest instanceof Error)) {
      loadScorchRequestPage();
      loadSchedulerLog();
      queryAndUpdatePipelineRequestStatus();
    }
  }, [pipelineRequest, loadScorchRequestPage, loadSchedulerLog, queryAndUpdatePipelineRequestStatus]);

  useEffect(() => {
    clearAndLoadBatchRequest();
  }, [location.search, pipelineRequestId, clearAndLoadBatchRequest]);

  // Render mark modal
  const renderMarkAsSuccessModal = () => (
    <StaticModal isOpen={isMarkAsSuccessModalOpen}>
      <h2 className="lighter">Mark As Success</h2>
      <div className="alert alert-warning my-2" role="alert">
        <i className="fa fa-fw fa-exclamation-triangle mr-1" />
        Are you sure you want to mark this pipeline request status?
      </div>
      <div className="form-group mt-4">
        <button
          className="btn btn-danger mr-2"
          type="button"
          onClick={() => {
            setIsMarkAsSuccessModalOpen(false);
            onMarkAsSuccess();
          }}
        >
          Yes
        </button>
        <button
          className="btn btn-default"
          type="button"
          onClick={() => setIsMarkAsSuccessModalOpen(false)}
        >
          No
        </button>
      </div>
    </StaticModal>
  );

  // Main render
  if (pipelineRequest === null) {
    return <LoadingIndicator />;
  }
  if (pipelineRequest instanceof Error) {
    return <ErrorAlert error={pipelineRequest} />;
  }

  let errorGoingNumber = 0;
  if ((pipelineRequest.status === 'ONGOING') &&
    ((pipelineRequest.failureCount > 0) || 
     (pipelineRequest.ignoreCount > 0) ||
     (pipelineRequest.suberrorsCount > 0))) {
    errorGoingNumber = pipelineRequest.suberrorsCount;
  }

  let scorchRequestPageComponent = null;
  if (scorchRequestPage === null) {
    scorchRequestPageComponent = <LoadingIndicator />;
  } else if (scorchRequestPage instanceof Error) {
    scorchRequestPageComponent = <ErrorAlert error={scorchRequestPage} />;
  } else {
    scorchRequestPageComponent = (
      <PipelineRequestPage
        scorchRequestPage={scorchRequestPage}
        batchAvgElapsedTimeList={batchAvgElapsedTimeList}
        currentUser={currentUser}
        onToggleOrdering={onToggleOrdering}
        onClickPage={onClickPipelineRequestPage}
        onCancelScorchRequest={onCancelRequest}
        onRerunFailedRequestList={onRerunFailedRequestList}
        onRerunPipelineRequestList={onRerunPipelineRequestList}
        onRerunConsumerPiece={onRerunConsumerPiece}
        onForceOKRequestList={onForceOKRequestList}
        onForceExecuteRequests={onForceExecuteRequests}
        sorting={currentSorting}
        ordering={currentOrdering}
        fromPipelineId={pipelineRequest.id}
      />
    );
  }

  return (
    <div>
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/">Monitoring</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/pipeline-request/list">Pipeline Requests</Link>
          </li>
          <li className="breadcrumb-item active">Pipeline Request #{pipelineRequest.id}</li>
        </ol>
      </nav>
      
      <h2 className="display-4">{pipelineRequest.name}</h2>
      
      <section className="clearfix">
        <h3>
          Pipeline Id:
          <a
            className="card-link"
            href={`/frontend/pipelines/detail/${pipelineRequest.pipelineId}`}
            rel="noopener noreferrer"
          >
            <span className="text-code">
              (#{pipelineRequest.pipelineId})
            </span>
          </a>
        </h3>
        
        <div className="float-right">
          {renderMarkAsSuccessModal()}
          {pipelineRequest.status === 'FAILURE' && (
            <button
              type="button"
              className="btn btn-secondary mr-2"
              onClick={() => setIsMarkAsSuccessModalOpen(true)}
            >
              Mark
            </button>
          )}
          <RequestStatusBadge 
            status={pipelineRequest.status} 
            errorGoingNumber={errorGoingNumber} 
          />
        </div>
        
        <div className="form-inline">
          
            <h3>
              UUID<span className="text-code">{pipelineRequest.uuid}</span>
            </h3>
          </div>
          {schedulerSubmissionLog && 
           !(schedulerSubmissionLog instanceof Error) && 
           schedulerSubmissionLog.schedulerName && (
            <div>
              <span className="mx-2 text-muted">-</span>
              <a
                href={`/frontend/schedule/detail/${schedulerSubmissionLog.schedulerName}/${schedulerSubmissionLog.triggerKey}`}
                className="mr-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                View scheduler
              </a>
            </div>
          )}
        
        <div className="form-inline">
          
            <h3>
              Create Time
              <span className="text-code">
                {formatTime(pipelineRequest.createTime) || 'N/A'}
              </span>
            </h3>
          </div>
        </div>
        
        {(pipelineRequest.ticketId &&
          pipelineRequest.ticketId !== '00000000-0000-0000-0000-000000000000') && (
          <h3>
            Parent:
            <Link to={`/pipeline-request/uuid/${pipelineRequest.ticketId}`} className="card-link">
              <span className="text-code">
                {pipelineRequest.ticketId}</strong>
              </span>
            </Link>
          </h3>
        )}
      </section>

      <section>
        <h3 className="lighter">Progress</h3>
        <div className="d-flex justify-content-between">
          <div className="pl-1">
            <span className="mr-1">
              Start ~ End{formatTime(pipelineRequest.startTime) || 'N/A'} ~ {formatTime(pipelineRequest.endTime) || 'N/A'}
            </span>
          </div>
          <ul className="list-inline pr-1 mb-0">
            <li className="list-inline-item">
              Total <strong>{pipelineRequest.totalCount}</strong>
            </li>
            <li className="list-inline-item text-muted">
              Pending <strong>{pipelineRequest.pendingCount}</strong>
            </li>
            <li className="list-inline-item text-muted">
              Ongoing <strong>{pipelineRequest.ongoingCount}</strong>
            </li>
            <li className="list-inline-item text-success">
              Success <strong>{pipelineRequest.successCount}</strong>
            </li>
            <li className="list-inline-item text-danger">
              Failure <strong>{pipelineRequest.failureCount}</strong>
            </li>
            <li className="list-inline-item text-warning">
              Ignore{pipelineRequest.ignoreCount}
            </li>
          </ul>
        </div>
        <div className="progress my-1">
          <div
            className="progress-bar"
            role="progressbar"
            style={{ width: `${pipelineRequest.completionPercentage || 0}%` }}
          />
        </div>

      <section>
        <h3 className="lighter">Node Requests</h3>
        {scorchRequestPageComponent}
      </section>
    </div>
  );
};

export default withCurrentUser(PipelineRequestDetail);