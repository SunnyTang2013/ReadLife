import Cookies from 'js-cookie';


function toQueryString(obj) {
  const params = Object.keys(obj).reduce((accumulator, key) => {
    const value = obj[key];
    if (value === null || value === undefined) {
      return accumulator; // Omit null or undefined values in query string.
    }
    const param = `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    return accumulator.concat([param]);
  }, []);
  return params.join('&');
}

function createBackendError(message, response) {
  const error = new Error(message);
  error.url = response.url;
  error.status = response.status;
  return error;
}


export default {

  handleJSONResponse(response) {
    if (!response) {
      throw new Error('Invalid empty response received from server.');
    }
    if (!response.ok) {
      console.log('Response is not OK.');
      // When an error occurred, detail may be provided as the JSON. Try to parse that out.
      // Note that `response.json()` returns a Promise, not the parsed JSON object.
      return response.json()
        .then((data) => {
          console.log(`Got error JSON with status code: ${response.status} ( ${response.url}`);
          throw createBackendError(data.message || 'An error occurred.', response);
        }, () => {
          console.log(`Fail to get error JSON with status code: ${response.status} ( ${response.url}`);
          throw createBackendError('An error occurred.', response);
        });
    }
    if (response.status === 204) {
      // 204 - No content.
      return null;
    }
    return response.json();
  },

  get(url, query) {
    const completeUrl = (query ? `${url}?${toQueryString(query)}` : url);
    console.log(`GET ${completeUrl}`);
    const options = {
      credentials: 'same-origin',
      headers: {
        'X-CSRFToken': Cookies.get('csrftoken'),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'GET',
    };
    return fetch(completeUrl, options);
  },

  post(url, payload) {
    console.log(`POST ${url}`);
    const options = {
      body: payload ? JSON.stringify(payload) : null,
      credentials: 'same-origin',
      headers: {
        'X-CSRFToken': Cookies.get('csrftoken'),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
    };
    return fetch(url, options);
  },

  postAllowEmptyString(url, payload) {
    console.log(`POST ${url}`);
    const options = {
      body: JSON.stringify(payload),
      credentials: 'same-origin',
      headers: {
        'X-CSRFToken': Cookies.get('csrftoken'),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
    };
    return fetch(url, options);
  },

  put(url, payload) {
    console.log(`PUT ${url}`);
    const options = {
      body: payload ? JSON.stringify(payload) : null,
      credentials: 'same-origin',
      headers: {
        'X-CSRFToken': Cookies.get('csrftoken'),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'PUT',
    };
    return fetch(url, options);
  },

  delete(url, payload) {
    console.log(`DELETE ${url}`);
    const options = {
      body: payload ? JSON.stringify(payload) : null,
      credentials: 'same-origin',
      headers: {
        'X-CSRFToken': Cookies.get('csrftoken'),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
    };
    return fetch(url, options);
  },

};
