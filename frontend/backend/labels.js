import rest from './rest';

export default {

  deleteLabel(label) {
    const url = `/api/v2/labels/delete/${label.id}`;
    return rest.delete(url).then(response => rest.handleJSONResponse(response));
  },

  createLabel(labelName) {
    const url = `/api/v2/labels/create/${labelName}`;
    return rest.post(url, null).then(response => rest.handleJSONResponse(response));
  },

  findLabelListByKeyword(keyword, limit) {
    const url = '/api/v2/labels/findByKeyword';
    return rest.get(url, { keyword, limit }).then(response => rest.handleJSONResponse(response));
  },

  updateJobLabels(jobId, labels) {
    const url = `/api/v2/labels/update/${jobId}`;
    return rest.put(url, labels).then(response => rest.handleJSONResponse(response));
  },

  addLabelsToJobs(idListAndLabelList) {
    const url = '/api/v2/labels/add-labels-to-jobs';
    return rest.put(url, idListAndLabelList).then(response => rest.handleJSONResponse(response));
  },
};
