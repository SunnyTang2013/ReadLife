import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';

import StaticModal from './StaticModal';

function DeleteModal({ name, openModal, title, onDelete, onClose }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = useCallback(() => {
    setIsSubmitting(true);
    onDelete();
  }, [onDelete]);

  return (
    <StaticModal isOpen={openModal}>
      <h2 className="lighter">Delete {title}</h2>

      <div className="alert alert-warning my-2" role="alert">
        <i className="fa fa-fw fa-exclamation-triangle mr-1" />
        Are you sure you want to delete <strong>{name}</strong>?
      </div>

      <fieldset disabled={isSubmitting}>
        <div className="form-group">
          <button
            className="btn btn-danger mr-2"
            type="button"
            onClick={handleDelete}
          >
            Delete This {title}!
          </button>
          <button className="btn btn-default" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </fieldset>
    </StaticModal>
  );
}


DeleteModal.propTypes = {
  name: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  openModal: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default DeleteModal;
