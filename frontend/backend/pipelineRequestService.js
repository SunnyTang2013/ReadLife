import rest from './rest';
import { addCobDateParam } from './jobExecution';

export default {

  submitPipeline(pipelineId, customizedParameters) {
    const url = `/api/v2/pipeline-requests/submit-pipeline/${pipelineId}`;
    const cobDateParam = addCobDateParam();
    const groups = Object.assign({}, customizedParameters);
    groups.cobDateParam = cobDateParam;
    return rest.post(url, { groups })
      .then(response => rest.handleJSONResponse(response));
  },

  rerunFailedJobs(scorchRequest) {
    const url = '/api/v2/pipeline-requests/rerun-failed-jobs';
    return rest.post(url, scorchRequest).then(response => rest.handleJSONResponse(response));
  },

  rerunPipelineRequest(scorchRequest) {
    const url = '/api/v2/pipeline-requests/rerun-pipeline-request';
    return rest.post(url, scorchRequest).then(response => rest.handleJSONResponse(response));
  },

  forceExecutePipelineRequest(scorchRequest) {
    const url = '/api/v2/pipeline-requests/force-execute-pipeline';
    return rest.post(url, scorchRequest).then(response => rest.handleJSONResponse(response));
  },

  markAsSuccess(scorchRequest) {
    const url = '/api/v2/pipeline-requests/mark-as-success';
    return rest.post(url, scorchRequest).then(response => rest.handleJSONResponse(response));
  },
};
