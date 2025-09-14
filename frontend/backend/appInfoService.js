import rest from './rest';

export default {

  getAppInfo() {
    const url = '/api/v2/app-info';
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },
};
