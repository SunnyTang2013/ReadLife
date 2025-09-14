import rest from './rest';

export default {

  createSearchCriteria(searchCriteria) {
    const url = '/api/v2/search-criteria/create';
    return rest.post(url, searchCriteria).then(response => rest.handleJSONResponse(response));
  },

  findSearchCriteriaByKeywords(query) {
    const url = '/api/v2/search-criteria/list';
    return rest.get(url, query).then(response => rest.handleJSONResponse(response));
  },

  getSearchCriteriaDetail(searchCriteriaId) {
    const url = `/api/v2/search-criteria/detail/${searchCriteriaId}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  updateCriteria(searchCriteria) {
    const url = `/api/v2/search-criteria/update/${searchCriteria.id}`;
    return rest.put(url, searchCriteria).then(response => rest.handleJSONResponse(response));
  },

  deleteCriteriaDetail(searchCriteriaId) {
    const url = `/api/v2/search-criteria/delete/${searchCriteriaId}`;
    return rest.delete(url).then(response => rest.handleJSONResponse(response));
  },

  listJobs(query) {
    const url = '/api/v2/jobs/list-by-keywords';
    return rest.get(url, query).then(response => rest.handleJSONResponse(response));
  },

  onDelCriteriaList(ids) {
    const url = '/api/v2/search-criteria/delete-list';
    return rest.delete(url, { ids }).then(response => rest.handleJSONResponse(response));
  },

  findCriteriaList(keyword) {
    const url = '/api/v2/search-criteria/findByKeyword';
    return rest.get(url, { keyword }).then(response => rest.handleJSONResponse(response));
  },
};
