import rest from './rest';

export default {

  getJobGroupList() {
    const url = '/api/v2/job-groups/list';
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  getJobGroupForest() {
    const url = '/api/v2/job-groups/hierarchy';
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  createJobGroup(name, parentJobGroupId) {
    const url = '/api/v2/job-groups/list';
    const payload = {
      id: null,
      name: name,
      parentId: parentJobGroupId,
      maxRunningJobs: -1,
    };
    return rest.post(url, payload).then(response => rest.handleJSONResponse(response));
  },

  getJobGroup(jobGroupId) {
    const url = `/api/v2/job-groups/detail/${jobGroupId}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  getJobGroupByName(jobGroupName) {
    const url = `/api/v2/job-groups/detail-by-name/${jobGroupName}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  updateJobGroup(jobGroupInput) {
    const url = `/api/v2/job-groups/detail/${jobGroupInput.id}`;
    return rest.put(url, jobGroupInput).then(response => rest.handleJSONResponse(response));
  },

  deleteJobGroup(jobGroupId, deleteOrphans) {
    const url = `/api/v2/job-groups/detail/${jobGroupId}`;
    const payload = { deleteOrphans };
    return rest.delete(url, payload).then(response => rest.handleJSONResponse(response));
  },

  listParentGroups(jobGroupName, env) {
    const url = `/api/v2/job-groups/list-compare-hierarchies/${jobGroupName}/${env}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },
};
