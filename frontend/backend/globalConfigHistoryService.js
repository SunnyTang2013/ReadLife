import rest from './rest';

export default {

  getContextHistoryDetail(id) {
    const url = `/api/v2/context-history/detail/${id}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  listContextHistory(contextId) {
    const url = `/api/v2/context-history/list/${contextId}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  getExecutionSystemHistoryDetail(id) {
    const url = `/api/v2/execution-system-history/detail/${id}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  listExecutionSystemHistory(executionSystemId) {
    const url = `/api/v2/execution-system-history/list/${executionSystemId}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },
};
