import React, { useState, useCallback, useEffect } from 'react';
import './style.css';
import PropTypes from 'prop-types';
import userService from '../backend/user';
import ScorchPropTypes from '../proptypes/scorch';

function Notification({ currentUser, envName }) {
  const [isModalOpen, setIsModalOpen] = useState(() => {
    let initialModalOpen = true;
    if (currentUser && currentUser.user) {
      const userPreferences = currentUser.user.profile.preferences;
      if (userPreferences.checkedTips === 'Y') {
        initialModalOpen = false;
      }
    }
    return initialModalOpen;
  });

  const onCancel = useCallback(() => {
    setIsModalOpen(false);
    const user = currentUser;
    const userPreferences = user.user.profile.preferences;
    if (!userPreferences.checkedTips || userPreferences.checkedTips !== 'Y') {
      userPreferences.checkedTips = 'Y';
      userService.updateUserPreferences(user.user, userPreferences);
    }
  }, [currentUser]);

  const renderModal = useCallback(() => {
    if (!isModalOpen) {
      return <div style={{ display: 'none' }} />;
    }

    if (envName !== 'UAT') {
      return <div style={{ display: 'none' }} />;
    }

    return (
      <div className="overlayStyle">
        <div className="modal show modalStyle" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-width" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="exampleModalLabel">Tips And Alerts</h5>
                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <p>UAT environment will refresh every week now.</p>
                <p>
                  Please retrieve your jobs on below environment if you need,
                  you can retrieve it via create release package.
                </p>
                <a
                  href="https://scorch-uat01.systems.uk.hsbc:8443/frontend/jobs"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://scorch-uat01.systems.uk.hsbc:8443/frontend/jobs
                </a>
              </div>
              <div className="modal-footer footer-content">
                <div className="form-group">
                  <button type="button" className="btn btn-primary mr-2" onClick={onCancel}>
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }, [isModalOpen, envName, onCancel]);

  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  return (
    <div>
      <button
        className="btn nav-link btn-outline-primary"
        type="button"
        onClick={handleOpenModal}
      >
        <i className="fa fa-fw fa-bell-o" />
      </button>

      {renderModal()}
    </div>
  );
}

Notification.propTypes = {
  currentUser: ScorchPropTypes.currentUser().isRequired,
  envName: PropTypes.string.isRequired,
};

export default Notification;