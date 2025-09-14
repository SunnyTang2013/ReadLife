import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import monitoring from '../backend/monitoring';
import RemoteObject from '../utils/RemoteObject';

import Alert from '../components/Alert';
import LoadingIndicator from '../components/LoadingIndicator';
import RequestStatusBadge from '../components/RequestStatusBadge';

const PipelineSubmitted = () => {
  const [pipelineRequest, setPipelineRequest] = useState(RemoteObject.notLoaded());

  const { pipelineRequestId } = useParams();

  useEffect(() => {
    _loadPipelineRequest();
  }, [pipelineRequestId]);

  function _loadPipelineRequest() {
    console.log(`Loading pipeline request #${pipelineRequestId}...`);
    monitoring.getPipelineRequest(pipelineRequestId)
      .then((data) => {
        setPipelineRequest(RemoteObject.loaded(data));
      })
      .catch((error) => {
        setPipelineRequest(RemoteObject.failed(error));
      });
  }

  if (pipelineRequest.isNotLoaded()) {
    return <LoadingIndicator text="Loading pipeline request..." />;
  }
  
  if (pipelineRequest.isFailed()) {
    return <Alert type="danger" text={pipelineRequest.error} />;
  }

  return (
    <div>
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to={`/detail/${pipelineRequest.data.pipelineId}`}>
              {`Pipeline #${pipelineRequest.data.pipelineId}`}
            </Link>
          </li>
          <li className="breadcrumb-item active">Pipeline Request Submitted</li>
        </ol>
      </nav>
      <h2 className="display-4">Pipeline Request Submitted</h2>
      <div className="alert alert-primary">
        <i className="fa fa-fw fa-info-circle mr-1" />
        Pipeline request has been submitted with status:
        <span className="ml-2">
          <RequestStatusBadge status={pipelineRequest.data.status} />
        </span>
      </div>
      <section>
        <Link
          to={`/detail/${pipelineRequest.data.pipelineId}`}
          className="btn btn-primary mr-2"
        >
          {`Return to pipeline #${pipelineRequest.data.pipelineId}`}
        </Link>
        <a
          className="btn btn-secondary"
          href={`/frontend/monitoring/pipeline-request/detail/${pipelineRequest.data.id}`}
        >
          View Pipeline Request Detail
        </a>
      </section>
    </div>
  );
};

export default PipelineSubmitted;