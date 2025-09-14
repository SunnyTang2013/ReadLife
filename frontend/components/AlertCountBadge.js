import React from 'react';
import PropTypes from 'prop-types';

function IsEmptyString(str) {
  if (str === 'undefined' || str === null || str === '') {
    return true;
  }
  return false;
}

export default function AlertCountBadge({ text }) {
  if (!IsEmptyString(text)) {
    return (
      <span className="text-muted ml-2">
        <span className="badge badge-warning ml-2">{text}</span>
      </span>
    );
  }

  return <span />;
}

AlertCountBadge.propTypes = {
  text: PropTypes.string,
};

AlertCountBadge.defaultProps = {
  text: null,
};
