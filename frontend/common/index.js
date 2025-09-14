import 'jquery';

// Import bootstrap after its dependencies are imported.
import 'bootstrap';

// Polyfills.
// import '@babel/polyfill';
import 'whatwg-fetch';

// Stylesheets.
import 'font-awesome/css/font-awesome.min.css';

// react-toastify.
import 'react-toastify/dist/ReactToastify.css';

// Customized stylesheets.
// import './theme.min.css';

import './extras.css';
import './applink.css';
import './autosuggest.css';
import './toggle.css';

import Cookies from 'js-cookie';


/**
 * report frontend error to the backend.
 * See: https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onerror
 */
window.onerror = function reportFrontendError(message, source, lineno, colno, error) {
  try {
    const url = '/frontend/onerror';
    const payload = {
      message: message,
      source: source,
      lineno: lineno,
      colno: colno,
      error: String(error),
    };
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
    fetch(url, options);
  } catch (err) {
    // Ignore any error that may happen.
  }
};
