import rest from './rest';

export default {

  getBatchRequestList(query) {
    const url = '/api/v2/batch-requests/list';
    return rest.get(url, query).then(response => rest.handleJSONResponse(response));
  },

  getBatchRequestStats(query) {
    const url = '/api/v2/batch-requests/stats';
    return rest.get(url, query).then(response => rest.handleJSONResponse(response));
  },

  getBatchRequest(batchRequestId) {
    const url = `/api/v2/batch-requests/detail/${batchRequestId}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  getBatchRequestByUuid(batchUuid) {
    const url = `/api/v2/batch-requests/uuid/${batchUuid}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  queryAndUpdateBatchRequestList(ids) {
    const url = '/api/v2/batch-requests/query-and-update';
    return rest.post(url, { ids }).then(response => rest.handleJSONResponse(response));
  },

  forceUpdateBatchRequestListByIds(ids) {
    const url = '/api/v2/batch-requests/update-related-batch-request/ids';
    return rest.post(url, { ids }).then(response => rest.handleJSONResponse(response));
  },

  forceUpdateBatchRequestListByUUIDList(uuidList) {
    const url = '/api/v2/batch-requests/update-related-batch-request/uuidList';
    return rest.post(url, uuidList).then(response => rest.handleJSONResponse(response));
  },


  getBatchAvgElapsedTimeList(names) {
    const url = '/api/v2/batch-requests/list-batchAvgElapsedTime';
    return rest.post(url, { names }).then(response => rest.handleJSONResponse(response));
  },

  getJobRequestStats(query) {
    const url = '/api/v2/job-requests/stats';
    return rest.get(url, query).then(response => rest.handleJSONResponse(response));
  },

  getJobRequestList(query) {
    const url = '/api/v2/job-requests/list';
    return rest.get(url, query).then(response => rest.handleJSONResponse(response));
  },

  getJobRequestListByJob(jobId) {
    const url = `/api/v2/job-requests/list-by-job/${jobId}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  queryAndUpdateJobRequestList(ids) {
    const url = '/api/v2/job-requests/query-and-update';
    return rest.post(url, { ids }).then(response => rest.handleJSONResponse(response));
  },

  getJobRequest(jobRequestId) {
    const url = `/api/v2/job-requests/detail/${jobRequestId}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  getCommandLine(jobRequestId) {
    const url = `/api/v2/job-requests/command-line/${jobRequestId}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  metaDataUrlForJobRequest(jobRequestId) {
    return `/api/v2/job-requests/meta-file/${jobRequestId}`;
  },

  getJobRequestListByJobAndDays(query) {
    const url = '/api/v2/job-requests/list-by-job-and-days';
    return rest.get(url, query).then(response => rest.handleJSONResponse(response));
  },

  getJobAvgElapsedTimeList(ids) {
    const url = '/api/v2/job-requests/list-jobAvgElapsedTime';
    return rest.post(url, { ids }).then(response => rest.handleJSONResponse(response));
  },

  getSComparatorOptions(ids) {
    const url = '/api/v2/job-requests/collect-parameters-for-SComparator';
    return rest.post(url, { ids }).then(response => rest.handleJSONResponse(response));
  },

  getPipelineRequestList(query) {
    const url = '/api/v2/pipeline-requests/list';
    return rest.get(url, query).then(response => rest.handleJSONResponse(response));
  },

  getPipelineRequest(pipelineRequestId) {
    const url = `/api/v2/pipeline-requests/detail/${pipelineRequestId}`;
    console.log(url);
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  getPipelineRequestByUuid(pipelineRequestUuid) {
    const url = `/api/v2/pipeline-requests/uuid/${pipelineRequestUuid}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },


  getPipelineRequestStats(query) {
    const url = '/api/v2/pipeline-requests/status';
    return rest.get(url, query).then(response => rest.handleJSONResponse(response));
  },

  queryAndUpdatePipelineRequestList(ids) {
    const url = '/api/v2/pipeline-requests/query-and-update';
    return rest.post(url, { ids }).then(response => rest.handleJSONResponse(response));
  },

  getPipelineRequestSubNodes(ids) {
    const url = '/api/v2/pipeline-requests/get-request-sub-nodes';
    return rest.post(url, { ids }).then(response => rest.handleJSONResponse(response));
  },

  getJobRequestByBatchRequest(batchUUID) {
    const url = `/api/v2/job-requests/list-by-batch-req/${batchUUID}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  getSComparatorOptionsForBatchList(ids) {
    const url = '/api/v2/batch-requests/collect-parameters-for-SComparator';
    return rest.post(url, { ids }).then(response => rest.handleJSONResponse(response));
  },

  getScorchRequestList(query) {
    const url = '/api/v2/pipeline-requests/node-list';
    return rest.get(url, query).then(response => rest.handleJSONResponse(response));
  },

  getRequestScheduler(requestUuid) {
    const url = `/api/v2/scheduling/submissionLog/${requestUuid}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

};
