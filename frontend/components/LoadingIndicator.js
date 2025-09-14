import React from 'react';
import PropTypes from 'prop-types';

function LoadingIndicator({ text }) {
  return (
    <div className="my-2 py-2 text-muted text-lg-1">
      <i className="fa fa-fw fa-spinner fa-spin mr-1" /> {text}
    </div>
  );
}

LoadingIndicator.propTypes = {
  text: PropTypes.string,
};

LoadingIndicator.defaultProps = {
  text: 'Loading...',
};

export default LoadingIndicator;
