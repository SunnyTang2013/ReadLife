import rest from './rest';

export default {

  getCurrentUser() {
    const url = '/user';
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  getUserPreferences(user) {
    const url = `/api/v2/user/preferences/${user.username}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  updateUserPreferences(user, preferences) {
    const url = `/api/v2/user/preferences/${user.username}`;
    return rest.put(url, preferences).then(response => rest.handleJSONResponse(response));
  },

  regenerateRpcToken() {
    const url = '/api/v2/user/regenerate-rpc-token';
    return rest.post(url).then(response => rest.handleJSONResponse(response));
  },
};
