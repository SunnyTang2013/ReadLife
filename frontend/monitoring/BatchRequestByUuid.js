import React, { useState, useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';

import monitoring from '../backend/monitoring';

import Alert from '../components/Alert';
import LoadingIndicator from '../components/LoadingIndicator';

/**
 * This component is a shortcut to open the batch request detail page using a batch UUID.
 * The batch UUID is returned as part of the JSON-RPC response when user requests to launch
 * a batch (or a single job). With this batch UUID, user will be able to construct a direct
 * link to the batch request and open it in the browser, without having to navigate through
 * the Scorch web UI.
 *
 * This feature is requested by the users as they are trying to automate the job submission
 * (via JSON-RPC) using a script.
 */
const BatchRequestByUuid = () => {
  const [batchRequest, setBatchRequest] = useState(null);
  const { batchUuid } = useParams();

  useEffect(() => {
    document.title = 'Batch Request';
  }, []);

  useEffect(() => {
    const loadBatchRequest = async () => {
      if (!batchUuid) return;
      
      console.log(`Loading batch request bu UUID: ${batchUuid}...`);
      try {
        const data = await monitoring.getBatchRequestByUuid(batchUuid);
        setBatchRequest(data);
      } catch (error) {
        setBatchRequest(error);
      }
    };

    loadBatchRequest();
  }, [batchUuid]);

  if (batchRequest === null) {
    return <LoadingIndicator />;
  }
  if (batchRequest instanceof Error) {
    return <Alert type="danger" text={String(batchRequest)} />;
  }
  return <Navigate to={`/batch-request/detail/${batchRequest.id}`} />;
};

export default BatchRequestByUuid;
