import Cookies from 'js-cookie';
import rest from './rest';
import { addCobDateParam } from './jobExecution';

export default {

  createBatch(batch) {
    const url = '/api/v2/batch/create-batch';
    return rest.post(url, batch).then(response => rest.handleJSONResponse(response));
  },

  findJobGroupList(type, keyword) {
    const url = `/api/v2/batch/find/${type}`;
    return rest.get(url, { keyword }).then(response => rest.handleJSONResponse(response));
  },

  findBatchesByKeywords(query) {
    const url = '/api/v2/batch/list';
    return rest.get(url, query).then(response => rest.handleJSONResponse(response));
  },
  findBatchesByKeyword(keyword) {
    const url = '/api/v2/batch/findByKeyword';
    return rest.get(url, { keyword }).then(response => rest.handleJSONResponse(response));
  },

  getBatchDetail(batchId) {
    const url = `/api/v2/batch/summary/${batchId}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  updateBatch(batch) {
    const url = '/api/v2/batch/update-batch';
    return rest.post(url, batch).then(response => rest.handleJSONResponse(response));
  },

  synchronizeBatchCounters(configGroupId) {
    const url = `/api/v2/job-config-group/synchronize-counters/${configGroupId}`;
    return rest.post(url).then(response => rest.handleJSONResponse(response));
  },

  deleteBatchDetail(batchId) {
    const url = `/api/v2/batch/delete/${batchId}`;
    return rest.delete(url).then(response => rest.handleJSONResponse(response));
  },

  submitBatch(batchId) {
    const url = `/api/v2/batch/submit-batch/${batchId}`;
    return rest.post(url, addCobDateParam())
      .then(response => rest.handleJSONResponse(response));
  },

  customizeBatch(batchId, customizedParameters) {
    const url = `/api/v2/batch/submit-batch/${batchId}`;
    return rest.post(url, addCobDateParam(customizedParameters))
      .then(response => rest.handleJSONResponse(response));
  },

  findJobsByScope(query) {
    const url = '/api/v2/jobs/order-list';
    return rest.get(url, query).then(response => rest.handleJSONResponse(response));
  },

  importConfigToDb(formData) {
    const url = '/api/falcon/batch/config-parameters/csv';
    return fetch(url, {
      body: formData,
      credentials: 'same-origin',
      headers: {
        'X-CSRFToken': Cookies.get('csrftoken'),
        'Accept': 'application/json',
      },
      method: 'POST',
    });
  },

  exportConfigFromDb() {
    const configParamsUrl = '/api/falcon/batch/config-parameters/csv/config-params';
    const configDefinitionsUrl = '/api/falcon/batch/config-parameters/csv/definition-params';
    const configParamsResult = rest
      .get(configParamsUrl)
      .then(response => rest.handleJSONResponse(response));
    const configParamsDefinition = rest
      .get(configDefinitionsUrl)
      .then(response => rest.handleJSONResponse(response));

    return Promise.all([configParamsResult, configParamsDefinition]);
  },

  refreshData() {
    const url = '/api/falcon/command';
    return rest.post(url, { commands: ['IMPORT_PARAMETERS', 'IMPORT_BATCH_SUMMARIES'] });
  },
};
