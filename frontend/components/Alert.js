import React from 'react';
import PropTypes from 'prop-types';

const ALERT_STYLES = {
  primary: {
    elemClassName: 'alert alert-primary',
    iconClassName: 'fa fa-fw fa-info-circle',
  },
  success: {
    elemClassName: 'alert alert-success',
    iconClassName: 'fa fa-fw fa-check-circle-o',
  },
  danger: {
    elemClassName: 'alert alert-danger',
    iconClassName: 'fa fa-fw fa-exclamation-triangle',
  },
  warning: {
    elemClassName: 'alert alert-warning',
    iconClassName: 'fa fa-fw fa-exclamation-triangle',
  },
};

function Alert({ type, text }) {
  const style = ALERT_STYLES[type];
  return (
    <div className={`${style.elemClassName} my-2`}>
      <i className={`${style.iconClassName} mr-1`} />
      {text || 'An error occurred but no details are provided.'}
    </div>
  );
}

Alert.propTypes = {
  type: PropTypes.oneOf(['primary', 'success', 'danger', 'warning']).isRequired,
  text: PropTypes.string.isRequired,
};

export default Alert;
