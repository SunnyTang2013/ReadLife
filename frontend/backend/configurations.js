import rest from './rest';

export default {

  getJobConfigGroupList(query) {
    const url = '/api/v2/job-config-group/list';
    return rest.get(url, query).then(response => rest.handleJSONResponse(response));
  },

  findJobConfigGroupList(category, keyword) {
    const url = `/api/v2/job-config-group/find/${category}`;
    return rest.get(url, { keyword }).then(response => rest.handleJSONResponse(response));
  },

  createJobConfigGroup(jobConfigGroup) {
    const url = '/api/v2/job-config-group/list';
    return rest.post(url, jobConfigGroup).then(response => rest.handleJSONResponse(response));
  },

  getJobConfigGroup(jobConfigGroupId) {
    const url = `/api/v2/job-config-group/detail/${jobConfigGroupId}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  updateJobConfigGroup(jobConfigGroup) {
    const url = `/api/v2/job-config-group/detail/${jobConfigGroup.id}`;
    return rest.put(url, jobConfigGroup).then(response => rest.handleJSONResponse(response));
  },

  deleteJobConfigGroup(jobConfigGroupId) {
    const url = `/api/v2/job-config-group/detail/${jobConfigGroupId}`;
    return rest.delete(url).then(response => rest.handleJSONResponse(response));
  },

  getJobConfigGroupVersionList(jobConfigGroupId) {
    const url = `/api/v2/job-config-group/version-list/${jobConfigGroupId}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  getConfigGroupVersion(versionId) {
    const url = `/api/v2/job-config-group/version/detail/${versionId}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  activateConfigGroupVersion(configGroupId, versionId) {
    const url = `/api/v2/job-config-group/activate-version/${configGroupId}/${versionId}`;
    return rest.post(url).then(response => rest.handleJSONResponse(response));
  },

  revertConfigGroupToVersion(configGroupId, versionId) {
    const url = `/api/v2/job-config-group/revert-to-version/${configGroupId}/${versionId}`;
    return rest.post(url).then(response => rest.handleJSONResponse(response));
  },

  synchronizeConfigGroupCounters(configGroupId) {
    const url = `/api/v2/job-config-group/synchronize-counters/${configGroupId}`;
    return rest.post(url).then(response => rest.handleJSONResponse(response));
  },

};
