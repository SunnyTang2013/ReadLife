import rest from './rest';

export default {

  getJobHistoryDetail(id) {
    const url = `/api/v2/job-history/detail/${id}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  listJobHistory(jobId, jobName) {
    const url = `/api/v2/job-history/list/${jobId}/${jobName}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },
};
