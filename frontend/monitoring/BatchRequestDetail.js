import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';

import { isEqual } from 'lodash';
import queryString from 'query-string';

import { toast } from 'react-toastify';
import monitoring from '../backend/monitoring';
import jobExecution from '../backend/jobExecution';

import { formatTime } from '../utils/utilities';
import LoadingIndicator from '../components/LoadingIndicator';
import ErrorAlert from '../components/ErrorAlert';
import RequestStatusBadge from '../components/RequestStatusBadge';

import JobRequestPage, { isJobRequestDone } from './components/JobRequestPage';
import { getBatchRequestProgress } from './utils';
import StaticModal from '../components/StaticModal';
import pipelineRequestService from '../backend/pipelineRequestService';

function getDefaultQuery() {
  return {
    sort: 'name,asc',
    page: 0,
    size: 50,
  };
}

const BatchRequestDetail = () => {
  const { batchRequestId } = useParams();
  const location = useLocation();
  const [batchRequest, setBatchRequest] = useState(null);
  const [jobRequestPage, setJobRequestPage] = useState(null);
  const [ordering, setOrdering] = useState('asc');
  const [filteringStage, setFilteringStage] = useState('');
  const [schedulerSubmissionLog, setSchedulerSubmissionLog] = useState(null);
  const [isMarkAsSuccessModalOpen, setIsMarkAsSuccessModalOpen] = useState(false);

  const query = React.useMemo(() => {
    const defaultQuery = getDefaultQuery();
    const searchQuery = queryString.parse(location.search);
    return Object.assign({}, defaultQuery, searchQuery);
  }, [location.search]);

  const getQueryUrl = useCallback((overrides) => {
    const nextQuery = Object.assign({}, query, overrides);
    Object.keys(nextQuery).forEach((key) => {
      if (nextQuery[key] === null || nextQuery[key] === '') {
        delete nextQuery[key];
      }
    });
    return nextQuery;
  }, [query]);

  const queryAndUpdateBatchRequestStatus = useCallback(() => {
    if (batchRequest === null || batchRequest instanceof Error) {
      return;
    }
    monitoring.queryAndUpdateBatchRequestList([batchRequest.id])
      .then((list) => {
        setBatchRequest(list[0]);
      });
  }, [batchRequest]);

  const forceUpdateBatchRequestStatus = useCallback(() => {
    if (batchRequest === null || batchRequest instanceof Error) {
      return;
    }
    monitoring.forceUpdateBatchRequestListByIds([batchRequest.id])
      .then((list) => {
        setBatchRequest(list[0]);
      });
  }, [batchRequest]);

  const loadSchedulerLog = useCallback(() => {
    if (batchRequest === null || batchRequest instanceof Error) {
      console.log('Cannot load scheduler submission log as batch request is not loaded.');
      return;
    }
    const batchUuid = batchRequest.uuid;
    monitoring.getRequestScheduler(batchUuid)
      .then((schedulerSubmissionLog) => {
        setSchedulerSubmissionLog(schedulerSubmissionLog);
      })
      .catch((error) => {
        setSchedulerSubmissionLog(error);
      });
  }, [batchRequest]);

  const loadJobRequestPage = useCallback((nextQuery) => {
    if (batchRequest === null || batchRequest instanceof Error) {
      console.log('Cannot load job request page as batch request is not loaded.');
      return;
    }
    const batchUuid = batchRequest.uuid;
    console.log(`Loading job requests with batch UUID ${batchUuid}...`);
    const loadQuery = Object.assign({}, nextQuery || query,
      { batchUuid: batchUuid, stage: filteringStage });
    monitoring.getJobRequestList(loadQuery)
      .then((jobRequestPage) => {
        setJobRequestPage(jobRequestPage);
        queryAndUpdateBatchRequestStatus();
      })
      .catch((error) => {
        setJobRequestPage(error);
      });
  }, [batchRequest, query, filteringStage, queryAndUpdateBatchRequestStatus]);

  const loadBatchRequest = useCallback(() => {
    console.log(`Loading batch request #${batchRequestId}...`);
    monitoring.getBatchRequest(batchRequestId)
      .then((batchRequest) => {
        setBatchRequest(batchRequest);
      })
      .catch((error) => {
        setBatchRequest(error);
      });
  }, [batchRequestId]);

  const clearAndLoadBatchRequest = useCallback(() => {
    setBatchRequest(null);
    setJobRequestPage(null);
    loadBatchRequest();
  }, [loadBatchRequest]);

  useEffect(() => {
    document.title = 'Batch Request';
    loadBatchRequest();
  }, [loadBatchRequest]);

  useEffect(() => {
    if (batchRequest && !(batchRequest instanceof Error)) {
      loadJobRequestPage();
      loadSchedulerLog();
    }
  }, [batchRequest]);

  useEffect(() => {
    clearAndLoadBatchRequest();
  }, [location.search, batchRequestId]);

  const onChangeJobRequestSortingOrdering = useCallback(({ sorting, ordering }) => {
    const queryOverrides = {
      sort: `${sorting},${ordering}`,
      page: 0,
    };
    setOrdering(ordering);
    const nextQuery = getQueryUrl(queryOverrides);
    setJobRequestPage(null);
    loadJobRequestPage(nextQuery);
  }, [getQueryUrl, loadJobRequestPage]);

  const onClickJobRequestPage = useCallback((page) => {
    const nextQuery = getQueryUrl({ page });
    setJobRequestPage(null);
    loadJobRequestPage(nextQuery);
  }, [getQueryUrl, loadJobRequestPage]);

  const onFilterByStatus = useCallback((status) => {
    const nextQuery = getQueryUrl({ status });
    setJobRequestPage(null);
    setFilteringStage(status);
    loadJobRequestPage(nextQuery);
  }, [getQueryUrl, loadJobRequestPage]);

  const onResetJobRequestPage = useCallback((jobRequest) => {
    setJobRequestPage((prevJobRequestPage) => {
      if (!prevJobRequestPage || prevJobRequestPage instanceof Error) {
        return prevJobRequestPage;
      }
      const jobRequestList = prevJobRequestPage.content;
      const newJobRequestList = jobRequestList.map((request) => {
        if (request.id === jobRequest.id) {
          return jobRequest;
        }
        return request;
      });
      return Object.assign({}, prevJobRequestPage, { content: newJobRequestList });
    });
  }, []);

  const onCancelJobRequest = useCallback((jobRequest) => {
    if (jobRequest.stage === 'FAILED' || jobRequest.stage === 'SUCCEEDED') {
      return;
    }
    jobExecution.cancelJobRequest(jobRequest.id)
      .then((cancelledJobRequest) => {
        onResetJobRequestPage(cancelledJobRequest);
      });
  }, [onResetJobRequestPage]);

  const onRerunJobRequest = useCallback((jobRequest) => {
    if (!isJobRequestDone(jobRequest)) {
      return;
    }

    jobExecution.resubmitJobRequest(jobRequest.id)
      .then((retJobRequest) => {
        toast.success(`Job has been submitted, status is: ${retJobRequest.status}`);
        forceUpdateBatchRequestStatus();
      })
      .catch((error) => {
        toast.error(`Failed to submit job: ${error}`);
      });
  }, [forceUpdateBatchRequestStatus]);

  const onRerunConsumerPiece = useCallback((jobRequest) => {
    if (!isJobRequestDone(jobRequest)) {
      return;
    }

    jobExecution.rerunConsumerPiece(jobRequest.id)
      .then((retJobRequest) => {
        toast.success(`Job has been reconsumered, status is: ${retJobRequest.status}`);
        onResetJobRequestPage(retJobRequest);
        forceUpdateBatchRequestStatus();
      })
      .catch((error) => {
        toast.error(`Failed to consumer job: ${error}`);
      });
  }, [onResetJobRequestPage, forceUpdateBatchRequestStatus]);

  const onMarkAsSuccess = useCallback(() => {
    const { name, ...request } = batchRequest || {};
    pipelineRequestService.markAsSuccess(request).then(() => {
      queryAndUpdateBatchRequestStatus();
      toast.success(`${name} marked as Success`);
    }).catch((e) => {
      toast.error(`Failed to overwrite ${name} status: ${e}`);
    });
  }, [batchRequest, queryAndUpdateBatchRequestStatus]);

  const onRerunJobRequestList = useCallback((onRerunJobRequestList) => {
    if (onRerunJobRequestList) {
      Promise.all(onRerunJobRequestList.map((jobRequest) => {
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
          forceUpdateBatchRequestStatus();
        }).catch((error) => {
          setBatchRequest(error);
        });
    }
  }, [onResetJobRequestPage, forceUpdateBatchRequestStatus]);

  const onForceOKSelectedJobRequests = useCallback((selectedJobRequestList) => {
    if (selectedJobRequestList) {
      Promise.all(selectedJobRequestList.map((jobRequest) => {
        if (!isJobRequestDone(jobRequest)) {
          return jobRequest;
        }

        return jobExecution.forceSuccessJobRequest(jobRequest.id);
      }))
        .then((resultList) => {
          resultList.forEach((retJobRequest) => {
            toast.success(`Job has been forced, status is: ${retJobRequest.status}`);
            onResetJobRequestPage(retJobRequest);
          });
          forceUpdateBatchRequestStatus();
        }).catch((error) => {
          setBatchRequest(error);
        });
    }
  }, [onResetJobRequestPage, forceUpdateBatchRequestStatus]);

  const onForceExecuteRequestList = useCallback((forceExecuteRequestList) => {
    if (forceExecuteRequestList) {
      Promise.all(forceExecuteRequestList.map((jobRequest) => {
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
          forceUpdateBatchRequestStatus();
        }).catch((error) => {
          setBatchRequest(error);
        });
    }
  }, [onResetJobRequestPage, forceUpdateBatchRequestStatus]);

  const renderMarkAsSuccessModal = () => (
    <StaticModal isOpen={isMarkAsSuccessModalOpen}>
      <h2 className="lighter">Mark As Success</h2>
      <div className="alert alert-warning my-2" role="alert">
        <i className="fa fa-fw fa-exclamation-triangle mr-1" />
        Are you sure you want to mark this batch request status as success?
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

  if (batchRequest === null) {
    return <LoadingIndicator />;
  }
  if (batchRequest instanceof Error) {
    return <ErrorAlert error={batchRequest} />;
  }

  let $jobRequestPage = null;
  if (jobRequestPage === null) {
    $jobRequestPage = <LoadingIndicator />;
  } else if (jobRequestPage instanceof Error) {
    $jobRequestPage = <ErrorAlert error={jobRequestPage} />;
  } else {
    const sorting = query.sort.split(',')[0];
    $jobRequestPage = (
      <JobRequestPage 
        jobRequestPage={jobRequestPage} 
        sorting={sorting} 
        ordering={ordering} 
        filteringStage={filteringStage} 
        currentUser={{username: 'admin', canRead: true}}
        onChangeSortingOrdering={onChangeJobRequestSortingOrdering}
        onClickPage={onClickJobRequestPage}
        onCancelJobRequest={onCancelJobRequest}
        onRerunJobRequest={onRerunJobRequest}
        onForceOKJobRequestList={onForceOKSelectedJobRequests}
        onRerunConsumerPiece={onRerunConsumerPiece}
        onRerunJobRequestList={onRerunJobRequestList}
        onForceExecuteRequestList={onForceExecuteRequestList}
        onFilterByStatus={onFilterByStatus}
      />
    );
  }

  let errorGoingNumber = 0;
  if ((batchRequest.status === 'ONGOING')
    && ((batchRequest.failureCount > 0) || (batchRequest.ignoreCount > 0)
      || (batchRequest.suberrorsCount > 0))) {
    errorGoingNumber = batchRequest.failureCount + batchRequest.ignoreCount;
  }

  return (
    <div>
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/">Monitoring</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/batch-request/list">Batch Requests</Link>
          </li>
          <li className="breadcrumb-item active">{`Batch Request #${batchRequest.id}`}</li>
        </ol>
      </nav>
      <section className="clearfix">
        <h2 className="display-4">{batchRequest.name}</h2>
        <div className="clearfix">
          <div className="float-right">
            {renderMarkAsSuccessModal()}
            {batchRequest.status === 'FAILURE' && (
              <button 
                type="button" 
                className="btn btn-secondary mr-2" 
                onClick={() => setIsMarkAsSuccessModalOpen(true)}
              >
                Mark as Success
              </button>
            )}
            <RequestStatusBadge status={batchRequest.status} errorGoingNumber={errorGoingNumber} />
          </div>
          <div className="form-inline">
            <div>
              <h3>
                UUID:
                <span className="text-code">{batchRequest.uuid}</span>
              </h3>
            </div>
            {schedulerSubmissionLog && schedulerSubmissionLog.schedulerName && (
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
          </div>
        </div>

        {batchRequest.name.includes('[Batch]') && (
          <div className="clearfix">
            <h3>
              Batch Id:
              <a 
                className="card-link"
                href={`/frontend/batches/detail/${batchRequest.batchId}`}
                rel="noopener noreferrer"
              >
                <span className="text-code">{`(#${batchRequest.batchId})`}</span>
              </a>
            </h3>
          </div>
        )}

        {(batchRequest.pipelineRequestUUID && batchRequest.pipelineRequestUUID !== '00000000-0000-0000-0000-000000000000') && (
          <div className="clearfix">
            <h3>
              Parent Request:
              <Link to={`/pipeline-request/uuid/${batchRequest.pipelineRequestUUID}`}>
                <span className="text-code">{batchRequest.pipelineRequestUUID}</span>
              </Link>
            </h3>
          </div>
        )}
        <div>
          <h3>
            Create Time:
            <span className="text-code">
              {formatTime(batchRequest.createTime) || 'N/A'}
            </span>
          </h3>
        </div>
      </section>

      <section>
        <h3 className="lighter">Progress</h3>
        <div className="d-flex justify-content-between">
          <div className="pl-1">
            <span className="mr-1">
              {`${formatTime(batchRequest.startTime) || 'N/A'} ~ ${formatTime(batchRequest.endTime) || 'N/A'}`}
            </span>
            {batchRequest.usedSeconds > 0 && (
              <span className="text-muted">{` ( ${batchRequest.usedSeconds} seconds )`}</span>
            )}
          </div>
          <ul className="list-inline pr-1 mb-0">
            <li className="list-inline-item">
              <strong>{`Total: ${batchRequest.totalCount}`}</strong>
            </li>
            <li className="list-inline-item text-muted">{`Pending: ${batchRequest.pendingCount}`}</li>
            <li className="list-inline-item text-muted">{`Ongoing: ${batchRequest.ongoingCount}`}</li>
            <li className="list-inline-item text-success">{`Success: ${batchRequest.successCount}`}</li>
            <li className="list-inline-item text-danger">{`Failure: ${batchRequest.failureCount}`}</li>
          </ul>
        </div>
        <div className="progress my-1">
          <div 
            className="progress-bar"
            role="progressbar"
            style={{ width: getBatchRequestProgress(batchRequest) }}
          />
        </div>
      </section>

      <section>
        <h3 className="lighter">Job Requests</h3>
        {$jobRequestPage}
      </section>
    </div>
  );
};

export default BatchRequestDetail;