import rest from './rest';

export default {

  getJobContextList() {
    const url = '/api/v2/job-context/list';
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  getJobContextDTOList() {
    const url = '/api/v2/job-context/dto-list-size';
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  getJobContextDetailList(query) {
    const url = '/api/v2/job-context/detail-list';
    return rest.get(url, query).then(response => rest.handleJSONResponse(response));
  },

  createJobContext(jobContext) {
    const url = '/api/v2/job-context/list';
    return rest.post(url, jobContext).then(response => rest.handleJSONResponse(response));
  },

  getJobContext(jobContextId) {
    const url = `/api/v2/job-context/detail/${jobContextId}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  updateJobContext(jobContext) {
    const url = `/api/v2/job-context/detail/${jobContext.id}`;
    return rest.put(url, jobContext).then(response => rest.handleJSONResponse(response));
  },

  synchronizeContextGroupCounters(jobContextId) {
    const url = `/api/v2/job-context/synchronize-counters/${jobContextId}`;
    return rest.post(url).then(response => rest.handleJSONResponse(response));
  },

  deleteJobContextList(ids) {
    const url = '/api/v2/job-context/list/delete';
    return rest.delete(url, { ids })
      .then(response => rest.handleJSONResponse(response));
  },

  deleteJobContext(jobContextId) {
    const url = `/api/v2/job-context/delete/${jobContextId}`;
    return rest.delete(url).then(response => rest.handleJSONResponse(response));
  },

  synchronizeContextListCounters(ids) {
    const url = '/api/v2/job-context/list/synchronize-counters';
    return rest.post(url, { ids }).then(response => rest.handleJSONResponse(response));
  },
};
