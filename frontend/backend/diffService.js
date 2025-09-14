import rest from './rest';

export default {
  async getDiffData(apiURL, leftID, rightId) {
    const url = `${apiURL}/${leftID}/${rightId}`;
    try {
      const jsonResponse = await rest.get(url).then(response => rest.handleJSONResponse(response));
      console.log(jsonResponse);
      return jsonResponse;
    } catch (error) {
      console.log(error.message);
      throw new Error(error);
    }
  },
};
