import rest from './rest';

export default {


  createProfile(profile) {
    const url = '/api/v2/profile/create-profile';
    return rest.post(url, profile).then(response => rest.handleJSONResponse(response));
  },

  getProfileDetail(profileId) {
    const url = `/api/v2/profile/summary/${profileId}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },


  updateProfile(profile) {
    const url = '/api/v2/profile/update-profile';
    return rest.put(url, profile).then(response => rest.handleJSONResponse(response));
  },

  deleteProfile(profileId) {
    const url = `/api/v2/profile/delete-profile/${profileId}`;
    return rest.delete(url).then(response => rest.handleJSONResponse(response));
  },

  findProfileList(keyword) {
    const url = '/api/v2/profile/findByKeyword';
    return rest.get(url, { keyword }).then(response => rest.handleJSONResponse(response));
  },
  getProfileList(query) {
    const url = '/api/v2/profile/list';
    return rest.get(url, query).then(response => rest.handleJSONResponse(response));
  },


};
