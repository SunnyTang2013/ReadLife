import rest from './rest';

export default {

  delJobCheck(jobId) {
    const url = `/api/v1/delete-check/jobs-delete-check/${jobId}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  delJobGroupCheck(hierarchyId) {
    const url = `/api/v1/delete-check/hierarchy-delete-check/${hierarchyId}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  delJobContextCheck(contextId) {
    const url = `/api/v1/delete-check/context-delete-check/${contextId}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

};
