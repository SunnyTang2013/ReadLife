import rest from './rest';

export default {

  createQuantAqsCoverage(quantAqsCoverage) {
    const url = '/api/v2/quant-aqs-coverage/create';
    return rest.post(url, quantAqsCoverage).then(response => rest.handleJSONResponse(response));
  },

  findQuantAqsCoverageByKeywords(query) {
    const url = '/api/v2/quant-aqs-coverage/list';
    return rest.get(url, query).then(response => rest.handleJSONResponse(response));
  },

  getQuantAqsCoverageDetail(quantAqsCoverageId) {
    const url = `/api/v2/quant-aqs-coverage/detail/${quantAqsCoverageId}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  updateCriteria(quantAqsCoverage) {
    const url = `/api/v2/quant-aqs-coverage/update/${quantAqsCoverage.id}`;
    return rest.put(url, quantAqsCoverage).then(response => rest.handleJSONResponse(response));
  },

  deleteCoverageDetail(quantAqsCoverageId) {
    const url = `/api/v2/quant-aqs-coverage/delete/${quantAqsCoverageId}`;
    return rest.delete(url).then(response => rest.handleJSONResponse(response));
  },

  listJobs(query) {
    const url = '/api/v2/jobs/list-by-keywords';
    return rest.get(url, query).then(response => rest.handleJSONResponse(response));
  },

  onDelCoverageList(ids) {
    const url = '/api/v2/quant-aqs-coverage/delete-list';
    return rest.delete(url, { ids }).then(response => rest.handleJSONResponse(response));
  },

  findCriteriaList(keyword) {
    const url = '/api/v2/quant-aqs-coverage/findByKeyword';
    return rest.get(url, { keyword }).then(response => rest.handleJSONResponse(response));
  },
};
