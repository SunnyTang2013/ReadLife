import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';

import monitoring from '../backend/monitoring';
import RemoteObject from '../utils/RemoteObject';

import Alert from '../components/Alert';
import LoadingIndicator from '../components/LoadingIndicator';
import RequestStatusBadge from '../components/RequestStatusBadge';

const BatchSubmitted = () => {
  const { batRequestId } = useParams();
  const [batchRequest, setBatchRequest] = useState(RemoteObject.notLoaded());

  const loadBatchRequest = useCallback(() => {
    monitoring.getBatchRequest(batRequestId)
      .then((data) => {
        setBatchRequest(RemoteObject.loaded(data));
      })
      .catch((error) => {
        setBatchRequest(RemoteObject.failed(error));
      });
  }, [batRequestId]);

  useEffect(() => {
    loadBatchRequest();
  }, [loadBatchRequest]);

  if (batchRequest.isNotLoaded()) {
    return <LoadingIndicator text="Loading batch request..." />;
  }
  if (batchRequest.isFailed()) {
    return <Alert type="danger" text={batchRequest.error} />;
  }

  return (
    <div>
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to={`/detail/${batchRequest.data.batchId}`}>
              {`Batch #${batchRequest.data.batchId}`}
            </Link>
          </li>
          <li className="breadcrumb-item active">Batch Submitted</li>
        </ol>
      </nav>
      <h2 className="display-4">Batch Submitted</h2>
      <div className="alert alert-primary">
        <i className="fa fa-fw fa-info-circle mr-1" />
        Batch has been submitted with status:
        <span className="ml-2">
          <RequestStatusBadge status={batchRequest.data.status} />
        </span>
      </div>
      <section>
        <Link
          to={`/detail/${batchRequest.data.batchId}`}
          className="btn btn-primary mr-2"
        >
          {`Return To Batch #${batchRequest.data.batchId}`}
        </Link>
        <a
          className="btn btn-secondary"
          href={`/frontend/monitoring/batch-request/detail/${batchRequest.data.id}`}
        >
          View Batch Request Detail
        </a>
      </section>
    </div>
  );
};

export default BatchSubmitted;