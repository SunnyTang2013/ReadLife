import React from 'react';
import PropTypes from 'prop-types';

export default function ErrorAlert({ error }) {
  if (!error) {
    return <div style={{ display: 'none' }} />;
  }
  return (
    <div className="alert alert-danger my-2">
      <div>
        <i className="fa fa-fw fa-exclamation-triangle mr-1" />
        {String(error)}
      </div>
      {error.url && error.status && (
        <div className="text-right mt-2">
          <span className="badge badge-danger">
            {String(error.url)} - {String(error.status)}
          </span>
        </div>
      )}
    </div>
  );
}

ErrorAlert.propTypes = {
  error: PropTypes.instanceOf(Error),
};

ErrorAlert.defaultProps = {
  error: null,
};
