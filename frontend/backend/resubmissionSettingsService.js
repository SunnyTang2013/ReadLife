import rest from './rest';

export default {
  async getSettingsDetail() {
    const url = '/api/v2/resubmission-setting/getDetail';
    try {
      const jsonResponse = await rest.get(url).then(response => rest.handleJSONResponse(response));
      return jsonResponse;
    } catch (error) {
      console.log(error.message);
      throw new Error(error);
    }
  },

  async saveSettingsDetail(settings) {
    const url = '/api/v2/resubmission-setting/create';
    return rest.post(url, settings).then(
      response => rest.handleJSONResponse(response),
    );
  },
};
