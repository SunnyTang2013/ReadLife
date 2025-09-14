import rest from './rest';
import { formatTimeByFormatStr } from '../utils/utilities';

// Remove from here once we decide how to do it properly
export function addCobDateParam(customParams) {
  const newParams = customParams || { entries: {} };
  newParams.entries['scorch.ui.cobdate'] = sessionStorage.getItem('scorch.ui.cobdate');

  const openUseAdvanced = localStorage.getItem('openUseAdvanced');
  let parameters = localStorage.getItem('parameters');
  if (openUseAdvanced && openUseAdvanced !== 'false') {
    const asofdate = formatTimeByFormatStr(localStorage.getItem('as_of_date'), 'YYYYMMDD');
    if (asofdate) {
      newParams.entries.ASOFDATE = asofdate;
    }
    const marketdate = formatTimeByFormatStr(localStorage.getItem('market_date'), 'YYYYMMDD');
    if (marketdate) {
      newParams.entries.MARKETDATE = marketdate;
    }
    const tradeasofdate = formatTimeByFormatStr(localStorage.getItem('trade_as_of_date'), 'YYYYMMDD');
    if (marketdate) {
      newParams.entries.trade_as_of_date = tradeasofdate;
    }
    const tradeOption = localStorage.getItem('tradeOption');
    if (tradeOption && tradeOption === 'EXCLUDE') {
      newParams.entries['scorch.include.traded-id-list'] = '';
      newParams.entries['scorch.exclude.traded-id-list'] = localStorage.getItem('tradedIdList');
    } else {
      newParams.entries['scorch.include.traded-id-list'] = localStorage.getItem('tradedIdList');
      newParams.entries['scorch.exclude.traded-id-list'] = '';
    }

    const generateQIA = localStorage.getItem('generateQIA');
    if (generateQIA && generateQIA !== 'false') {
      newParams.entries['scorch.generateQIA'] = generateQIA;
    }
    if (parameters && Object.keys(JSON.parse(parameters).entries).length > 0) {
      parameters = JSON.parse(parameters).entries;
      Object.keys(parameters).forEach((key) => {
        parameters[key] = (parameters[key] || '').trim();
        newParams.entries[key] = parameters[key];
      });
    }
  }
  return newParams;
}

export default {
  prepareJobRequest(jobId) {
    const url = `/api/v2/job-requests/prepare-for-job/${jobId}`;
    return rest.post(url, null).then(response => rest.handleJSONResponse(response));
  },

  createCustomizedJobRequest(jobId, customizedParameters) {
    const url = `/api/v2/job-requests/customize-for-job/${jobId}`;
    return rest.post(url, addCobDateParam(customizedParameters))
      .then(response => rest.handleJSONResponse(response));
  },

  submitJobRequest(jobRequestId) {
    const url = `/api/v2/job-requests/submit/${jobRequestId}`;
    return rest.post(url, addCobDateParam(null))
      .then(response => rest.handleJSONResponse(response));
  },

  submitJob(jobId) {
    const url = `/api/v2/job-requests/submit-job/${jobId}`;
    return rest.post(url, addCobDateParam(null))
      .then(response => rest.handleJSONResponse(response));
  },

  submitJobs(params) {
    const url = '/api/v2/job-requests/submit-jobs';
    return rest.post(url, addCobDateParam(params))
      .then(response => rest.handleJSONResponse(response));
  },

  resubmitJobRequest(jobRequestId) {
    const url = `/api/v2/job-requests/resubmit-jobRequest/${jobRequestId}`;
    return rest.post(url, addCobDateParam(null))
      .then(response => rest.handleJSONResponse(response));
  },

  forceExecuteJobRequest(jobRequestId) {
    const url = `/api/v2/job-requests/force-execute-jobs/${jobRequestId}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  rerunConsumerPiece(jobRequestId) {
    const url = `/api/v2/job-requests/rerun-consumer-piece/${jobRequestId}`;
    return rest.post(url, null).then(response => rest.handleJSONResponse(response));
  },

  rerunBatchConsumerPiece(ids) {
    const url = '/api/v2/pipeline-requests/rerun-batches-consumer-piece';
    return rest.post(url, { ids }).then(response => rest.handleJSONResponse(response));
  },

  rerunBatch(ids) {
    const url = '/api/v2/batch-requests/rerun-batch';
    return rest.post(url, { ids }).then(response => rest.handleJSONResponse(response));
  },

  submitJobGroup(jobGroupId) {
    const url = `/api/v2/job-requests/submit-job-group/${jobGroupId}`;
    return rest.post(url, addCobDateParam(null))
      .then(response => rest.handleJSONResponse(response));
  },

  cancelJobRequest(jobRequestId) {
    const url = `/api/v2/job-requests/cancel/${jobRequestId}`;
    return rest.post(url, null).then(response => rest.handleJSONResponse(response));
  },

  forceSuccessJobRequest(jobRequestId) {
    const url = `/api/v2/job-requests/force-ok/${jobRequestId}`;
    return rest.post(url, null).then(response => rest.handleJSONResponse(response));
  },

  updateSupportNotes(currentlySupportingPipeline) {
    const url = '/api/v2/pipeline-requests/update-support-notes';
    return rest.post(url, currentlySupportingPipeline)
      .then(response => rest.handleJSONResponse(response));
  },

  cancelBatchRequest(batchUuid) {
    const url = `/api/v2/batch-requests/cancel/${batchUuid}`;
    return rest.post(url, null).then(response => rest.handleJSONResponse(response));
  },

  cancelPipelineRequest(pipelineUuid) {
    const url = `/api/v2/pipeline-requests/cancel/${pipelineUuid}`;
    return rest.post(url, null).then(response => rest.handleJSONResponse(response));
  },

  runSComparatorAsJobRequest(options) {
    const url = '/api/v2/job-requests/run-SComparator-as-job-request';
    return rest.post(url, options).then(response => rest.handleJSONResponse(response));
  },

  cancelScorchRequest(scorchRequest) {
    const url = '/api/v2/pipeline-requests/cancel-node-request';
    return rest.post(url, scorchRequest).then(response => rest.handleJSONResponse(response));
  },
  rerunConsumerPieceInPipeline(scorchRequests) {
    const url = '/api/v2/pipeline-requests/rerun-consumer-piece';
    return rest.post(url, scorchRequests).then(response => rest.handleJSONResponse(response));
  },

};
