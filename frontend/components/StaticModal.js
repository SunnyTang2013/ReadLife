import React from 'react';
import PropTypes from 'prop-types';

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  zIndex: 1040, // Make sure the overlay is on top of the static navbar, whose z-index is 1030.
};

const modalStyle = {
  position: 'relative',
  display: 'block',
  top: '75px', // Display the modal below the static navbar.
  overflow: 'visible',
};

function StaticModal({ isOpen = true, children }) {
  if (!isOpen) {
    return <div style={{ display: 'none' }} />;
  }
  return (
    <div style={overlayStyle}>
      <div className="modal show" tabIndex="-1" role="dialog" style={modalStyle}>
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-body">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

StaticModal.propTypes = {
  isOpen: PropTypes.bool,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
};

StaticModal.defaultProps = {
  isOpen: true,
};

export default StaticModal;