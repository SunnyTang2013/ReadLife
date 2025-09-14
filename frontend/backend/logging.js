import rest from './rest';

export default {

  getLogs(targetType, targetId) {
    const url = `/api/v2/logging/list/${targetType}/${targetId}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },
};
