import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

import monitoring from '../backend/monitoring';
import RouterPropTypes from '../proptypes/router';
import RemoteObject from '../utils/RemoteObject';

import Alert from '../components/Alert';
import LoadingIndicator from '../components/LoadingIndicator';
import RequestStatusBadge from '../components/RequestStatusBadge';

const JobRequestSubmitted = () => {
  const [jobRequest, setJobRequest] = useState(RemoteObject.notLoaded());
  const { jobRequestId } = useParams();

  useEffect(() => {
    _loadJobRequest();
  }, [jobRequestId]);

  const _loadJobRequest = () => {
    console.log(`Loading job request #${jobRequestId}...`);
    monitoring.getJobRequest(jobRequestId)
      .then((data) => {
        setJobRequest(RemoteObject.loaded(data));
      })
      .catch((error) => {
        setJobRequest(RemoteObject.failed(error));
      });
  };

  if (jobRequest.isNotLoaded()) {
    return <LoadingIndicator text="Loading job request..." />;
  }
  if (jobRequest.isFailed()) {
    return <Alert type="danger" text={jobRequest.error} />;
  }

  return (
    <div>
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to={`/job/detail/${jobRequest.data.jobId}`}>
              {`Job #${jobRequest.data.jobId}`}
            </Link>
          </li>
          <li className="breadcrumb-item active">Job Request Submitted</li>
        </ol>
      </nav>
      <h2 className="display-4">Job Request Submitted</h2>
      <div className="alert alert-primary">
        <i className="fa fa-fw fa-info-circle mr-1" />
        Job request has been submitted with status:
        <span className="ml-2">
          <RequestStatusBadge status={jobRequest.data.status} />
        </span>
      </div>
      <section>
        <Link
          to={`/job/detail/${jobRequest.data.jobId}`}
          className="btn btn-primary mr-2"
        >
          {`Return to Job #${jobRequest.data.jobId}`}
        </Link>
        <a
          className="btn btn-secondary"
          href={`/frontend/monitoring/job-request/detail/${jobRequest.data.id}`}
        >
          View Job Request Detail
        </a>
      </section>
    </div>
  );
};

export default JobRequestSubmitted;