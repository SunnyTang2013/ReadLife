import rest from './rest';

export default {

  findBatchList(keyword) {
    const url = '/api/v2/batch/findByKeyword';
    return rest.get(url, { keyword }).then(response => rest.handleJSONResponse(response));
  },

  createPipeline(pipeline) {
    const url = '/api/v2/pipeline/create-pipeline';
    return rest.post(url, pipeline).then(response => rest.handleJSONResponse(response));
  },

  getPipelineDetail(pipelineId) {
    const url = `/api/v2/pipeline/summary/${pipelineId}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  getPipelineList(query) {
    const url = '/api/v2/pipeline/list';
    return rest.get(url, query).then(response => rest.handleJSONResponse(response));
  },

  updatePipeline(pipeline) {
    const url = '/api/v2/pipeline/update-pipeline';
    return rest.put(url, pipeline).then(response => rest.handleJSONResponse(response));
  },

  deletePipeline(pipelineId) {
    const url = `/api/v2/pipeline/delete-pipeline/${pipelineId}`;
    return rest.delete(url).then(response => rest.handleJSONResponse(response));
  },

  findPipelineList(keyword) {
    const url = '/api/v2/pipeline/findByKeyword';
    return rest.get(url, { keyword }).then(response => rest.handleJSONResponse(response));
  },

  getNoticeDetail(pipelineId) {
    const url = `/api/v2/notice/summary-by-type-id/${pipelineId}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  editNotice(runNotice) {
    const url = '/api/v2/notice/update-notice';
    return rest.put(url, runNotice).then(response => rest.handleJSONResponse(response));
  },

  deleteNotice(noticeId) {
    const url = `/api/v2/notice/delete-notice/${noticeId}`;
    return rest.delete(url).then(response => rest.handleJSONResponse(response));
  },

  checkPipelineDeadLoop(parentId, childId) {
    const url = `/api/v2/pipeline/checkDeadLoop/${parentId}/${childId}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },
};
