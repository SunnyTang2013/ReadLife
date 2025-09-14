import rest from './rest';

export default {

  getMetricBySearchID(query) {
    const url = `/api/v2/metrics/list-by-id/${query}`;
    return rest.get(url, query).then(response => rest.handleJSONResponse(response));
  },

  getMetricByJobRef(query) {
    const url = `/api/v2/metrics/list-by-jobid/${query}`;
    return rest.get(url, query).then(response => rest.handleJSONResponse(response));
  },

  getMetricByPandoraBuildKeyRef(query, testType) {
    const url = `/api/v2/metrics/list-by-pandora-b-k/${query}/${testType}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  getTradeErrorMetrics(query, testType) {
    const url = `/api/v2/metrics/tradeerrormetrics/${query}/${testType}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  getMetricQtfPipelinesList(query) {
    const url = '/api/v2/metrics/qtf-list';
    return rest.get(url, query).then(response => rest.handleJSONResponse(response));
  },

  getMetricBubblePipelinesList(query) {
    const url = '/api/v2/metrics/bubble';
    return rest.get(url, query).then(response => rest.handleJSONResponse(response));
  },

  getMetricPipelineNotes(query) {
    const url = '/api/v2/metrics/qtf-list-notes';
    return rest.get(url, query).then(response => rest.handleJSONResponse(response));
  },

  getMetricRerunListJobs(query) {
    const url = '/api/v2/metrics/rerun-list-jobs';
    return rest.get(url, query).then(response => rest.handleJSONResponse(response));
  },


  getMetricRerun(query) {
    const url = '/api/v2/metrics/rerun';
    return rest.get(url, query).then(response => rest.handleJSONResponse(response));
  },

  getQtfHandoverResult(query) {
    const url = '/api/v2/metrics/qtfhandover';
    return rest.get(url, query).then(response => rest.handleJSONResponse(response));
  },
  handoverNotify(request) {
    const url = '/api/v2/metrics/qtf-handover-notify';
    return rest.post(url, request).then(response => rest.handleJSONResponse(response));
  },
};
