import PropTypes from 'prop-types';

// This file provides prop types for properties from the react-router-dom.

/**
 * Returns a PropType of router's `history` property.
 */
function history() {
  return PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
    replace: PropTypes.func.isRequired,
  });
}

function location() {
  return PropTypes.shape({
    pathname: PropTypes.string.isRequired,
    search: PropTypes.string,
    state: PropTypes.object,
  });
}

/**
 * Returns a PropType of router's `match` property.
 * @param paramsShape  The expected shape of properties inside `match.params`.
 */
function match(paramsShape) {
  return PropTypes.shape({
    params: PropTypes.shape(paramsShape),
  });
}


export default {
  history,
  location,
  match,
};
