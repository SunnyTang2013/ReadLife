import rest from './rest';

export default {

  getExecutionSystemList() {
    const url = '/api/v2/global-config/execution-system/list';
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  createExecutionSystem(executionSystem) {
    const url = '/api/v2/global-config/execution-system/list';
    return rest.post(url, executionSystem).then(response => rest.handleJSONResponse(response));
  },

  getExecutionSystem(executionSystemId) {
    const url = `/api/v2/global-config/execution-system/detail/${executionSystemId}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  updateExecutionSystem(executionSystem) {
    const url = `/api/v2/global-config/execution-system/detail/${executionSystem.id}`;
    return rest.put(url, executionSystem).then(response => rest.handleJSONResponse(response));
  },

  queryVSDetail(executionSystemId) {
    const url = `/api/v2/global-config/execution-system/detail/${executionSystemId}/vs-detail`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  deleteExecutionSystem(executionSystemId) {
    const url = `/api/v2/global-config/execution-system/${executionSystemId}`;
    return rest.delete(url).then(response => rest.handleJSONResponse(response));
  },

  getExecutionSystemStatusByRequestId(jobRequestId) {
    const url = `/api/v2/global-config/execution-system/status/${jobRequestId}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  getExecutionSystemListByType(executionType, nameLike) {
    const url = `/api/v2/global-config/execution-system/listByType/${executionType}/${nameLike}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

};
