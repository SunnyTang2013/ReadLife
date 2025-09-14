import rest from './rest';

export default {

  countJobs() {
    const url = '/api/v2/jobs/count';
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  findJobs(query) {
    const url = '/api/v2/jobs/list';
    return rest.get(url, query).then(response => rest.handleJSONResponse(response));
  },

  findJobsByKeywords(query) {
    const url = '/api/v2/jobs/list-by-keywords';
    return rest.get(url, query).then(response => rest.handleJSONResponse(response));
  },

  createJob(job, parentJobGroupId) {
    const url = `/api/v2/jobs/create/job-group/${parentJobGroupId}`;
    return rest.post(url, job).then(response => rest.handleJSONResponse(response));
  },

  getJob(jobId) {
    const url = `/api/v2/jobs/detail/${jobId}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  getJobByName(jobName) {
    const url = `/api/v2/jobs/job-detail/${jobName}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  updateJob(job) {
    const url = `/api/v2/jobs/detail/${job.id}`;
    return rest.put(url, job).then(response => rest.handleJSONResponse(response));
  },

  deleteJob(job) {
    const url = `/api/v2/jobs/detail/${job.id}`;
    return rest.delete(url).then(response => rest.handleJSONResponse(response));
  },

  addJobToJobGroup(jobId, jobGroupId) {
    const url = `/api/v2/jobs/add-to-job-group/${jobId}/${jobGroupId}`;
    return rest.post(url, null).then(response => rest.handleJSONResponse(response));
  },

  moveJobToJobGroup(jobId, fromJobGroupId, toJobGroupId) {
    const url = `/api/v2/jobs/move-to-job-group/${jobId}/${fromJobGroupId}/${toJobGroupId}`;
    return rest.post(url, null).then(response => rest.handleJSONResponse(response));
  },

  updateJobWithJobGroup(jobId, jobGroups) {
    const url = `/api/v2/jobs/update-job-with-group/${jobId}`;
    return rest.post(url, jobGroups).then(response => rest.handleJSONResponse(response));
  },

  getJobRelatedPipelines(jobId) {
    const url = `/api/v2/jobs/list-job-pipeline/${jobId}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

};
