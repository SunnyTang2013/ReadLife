import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';

import StaticModal from './StaticModal';

function RunModal({ name, title, openModal, onQuickRun, onClose }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickRun = useCallback(() => {
    setIsSubmitting(true);
    onQuickRun();
  }, [onQuickRun]);

  return (
    <StaticModal isOpen={openModal}>
      <h2 className="lighter">Run {title}</h2>

      <div className="alert alert-warning my-2" role="alert">
        <i className="fa fa-fw fa-exclamation-triangle mr-1" />
        Are you sure you want to run <strong>{name}</strong> with
        overwriting <strong>Manifest parameters</strong>? Please ensure
        that you have known this will not impact QTF&PPE or other users
      </div>

      <fieldset disabled={isSubmitting}>
        <div className="form-group">
          <button
            className="btn btn-danger mr-2"
            type="button"
            onClick={handleQuickRun}
          >
            Continue!
          </button>
          <button className="btn btn-default" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </fieldset>
    </StaticModal>
  );
}

RunModal.propTypes = {
  name: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  openModal: PropTypes.bool.isRequired,
  onQuickRun: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default RunModal;