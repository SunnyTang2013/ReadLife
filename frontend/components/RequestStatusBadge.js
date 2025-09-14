import React from 'react';
import PropTypes from 'prop-types';


export default function RequestStatusBadge({ status, errorGoingNumber }) {
  let statusClass = null;
  let ongoingErrors = false;
  switch (status) {
    case 'PENDING':
      statusClass = 'badge badge-secondary';
      break;
    case 'ONGOING':
      if (errorGoingNumber > 0) {
        ongoingErrors = true;
        statusClass = 'badge badge-warning outter-badge';
      } else {
        statusClass = 'badge badge-blue';
      }

      break;
    case 'SUCCESS':
      statusClass = 'badge badge-purple';
      break;
    case 'FAILURE':
      statusClass = 'badge badge-danger';
      break;
    default:
      statusClass = 'badge badge-warning';
      break;
  }
  return (ongoingErrors ? <span className={statusClass}>{status} <div className="badge badge-danger inner-badge ">{errorGoingNumber}</div></span>
    : <span className={statusClass}>{status} </span>
  );
}


RequestStatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
  errorGoingNumber: PropTypes.number,
};


RequestStatusBadge.defaultProps = {
  errorGoingNumber: -1,
};
