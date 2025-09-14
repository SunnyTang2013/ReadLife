import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import profileService from '../backend/profileService';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';
import DeleteModal from '../components/DeleteModal';
import { formatTime } from '../utils/utilities';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  
  const navigate = useNavigate();
  const { profileId } = useParams();
  const currentUser = { username: 'admin', canWrite: true, canExecute: true };

  useEffect(() => {
    loadProfileDetail();
  }, [profileId]);

  const loadProfileDetail = useCallback(() => {
    profileService.getProfileDetail(profileId)
      .then((profile) => {
        setProfile(profile);
      })
      .catch(error => setProfile(error));
  }, [profileId]);

  const onOpenDeleteModal = useCallback(() => {
    setOpenModal(true);
  }, []);

  const onDelete = useCallback(() => {
    profileService.deleteProfile(profileId)
      .then(() => {
        setOpenModal(false);
        onCompleteDeletion();
      })
      .catch((error) => {
        setOpenModal(false);
        setProfile(error);
      });
  }, [profileId]);

  const onCompleteDeletion = useCallback(() => {
    setOpenModal(false);
    toast.success(`Profile #${profileId} is deleted successfully.`);
    navigate('/list');
  }, [profileId, navigate]);

  const onCancel = useCallback(() => {
    setOpenModal(false);
  }, []);

  const renderProfileNodes = useCallback((profile) => {
    const profileNodeList = profile.profileNodeSummaries;
    Object.keys(profileNodeList).forEach((key) => {
      if (profileNodeList[key].nodeType === 'BATCH') {
        profileNodeList[key].name = (profileNodeList[key].batchSummary.name).trim();
      } else if (profileNodeList[key].nodeType === 'PIPELINE') {
        profileNodeList[key].name = (profileNodeList[key].pipeline.name).trim();
      }
    });

    const pNLLengthFilterByBatch = profileNodeList.filter(p => p.nodeType === 'BATCH').length;
    const pNLLengthFilterByProfile = profileNodeList.filter(p => p.nodeType === 'PIPELINE').length;
    const rows = (profileNodeList || [])
      .map(profileNode => {
        let name = null;
        if (profileNode.nodeType === 'BATCH') {
          name = profileNode.batchSummary.name;
        } else if (profileNode.nodeType === 'PIPELINE') {
          name = profileNode.pipeline.name;
        }

        let disabled = '';
        if (profileNode.status === 'IGNORE') {
          disabled = 'table-warning';
        }

        return React.createElement('tr', { key: profileNode.id, className: disabled },
          React.createElement('td', null,
            <div>{profileNode.nodeType}</div>
          ),
          <td>{<div>{name}</div>}</td>,
          <td>{<div>{profileNode.testScope.entries.EXCLUDE === 'Y' ? 'EXCLUDE' : ''}</div>}</td>
        );
      });

    return React.createElement('table', { className: 'table table-fixed' },
      React.createElement('thead', null,
        React.createElement('tr', null,
          React.createElement('th', { style: { width: '20%' } },
            `Type(B/${pNLLengthFilterByBatch}):(P/${pNLLengthFilterByProfile})`
          ),
          React.createElement('th', { style: { width: '50%' } }, 'Name'),
          React.createElement('th', { style: { width: '15%' } }, 'Exclude ?')
        )
      ),
      <tbody>{...rows}</tbody>
    );
  }, []);

  const renderDeleteModal = useCallback(() => {
    if (openModal) {
      return <DeleteModal name={profile.name} title="Profile" openModal={openModal} onDelete={onDelete} onClose={onCancel} />;
    }
    return null;
  }, [openModal, profile, onDelete, onCancel]);

  if (profile === null) {
    return <LoadingIndicator />;
  }
  if (profile instanceof Error) {
    return <ErrorAlert error={profile} />;
  }

  const profileNodes = renderProfileNodes(profile);
  const deleteModal = renderDeleteModal();

  return React.createElement('div', { style: { maxWidth: '85%' }, className: 'container-fluid' },
    React.createElement('nav', null,
      React.createElement('ol', { className: 'breadcrumb' },
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: '/list' }, 'Profiles')
        ),
        <li className="breadcrumb-item active">{profile.name}</li>
      )
    ),
    <h2 className="display-4">{profile.name}</h2>,
    React.createElement('div', { className: 'd-flex justify-content-between' },
      React.createElement('div', { className: 'btn-toolbar mb-2', role: 'toolbar' },
        currentUser.canWrite && React.createElement('div', null,
          React.createElement(Link, {
            to: `/update/${profile.id}`,
            className: 'btn btn-sm btn-primary btn-light-primary mr-2'
          },
            <i className="fa fa-fw fa-pencil" />,
            ' Edit'
          ),
          React.createElement(Link, {
            to: `/clone/${profile.id}`,
            className: 'btn btn-sm btn-primary btn-light-primary mr-2'
          },
            <i className="fa fa-fw fa-copy" />,
            ' Clone'
          ),
          <button className="btn btn-sm btn-danger mr-3" type="button" onClick={onOpenDeleteModal}>{<i className="fa fa-fw fa-trash" />,
            ' Delete'}</button>
        ),
        currentUser.canWrite && React.createElement('div', null,
          React.createElement('div', {
            className: 'modal right fade',
            id: 'myModal',
            tabIndex: '-1',
            role: 'dialog',
            'aria-labelledby': 'myModalLabel',
            'aria-hidden': 'true'
          },
            React.createElement('div', { className: 'modal-dialog' },
              React.createElement('div', { className: 'modal-content' },
                React.createElement('div', { className: 'modal-header' },
                  React.createElement('h4', { className: 'modal-title', id: 'myModalLabel' }, 'Set Up Schedule'),
                  React.createElement('button', {
                    type: 'button',
                    className: 'close',
                    'data-dismiss': 'modal',
                    'aria-label': 'Close'
                  },
                    React.createElement('span', { 'aria-hidden': 'true' }, '×')
                  )
                )
              )
            )
          )
        )
      )
    ),
    React.createElement('div', { className: 'row' },
      React.createElement('div', { className: 'col-8' },
        React.createElement('section', null,
          React.createElement('div', { className: 'row' },
            React.createElement('div', { className: 'col-4' },
              React.createElement('div', { className: 'card mb-3 mb-lg-3 shadow bg-white rounded' },
                React.createElement('div', { className: 'card-header' },
                  React.createElement('h5', { className: 'mb-0' }, 'Last Updated')
                ),
                React.createElement('div', { className: 'card-body bg-light' },
                  React.createElement('div', { className: 'form-group' },
                    React.createElement('div', { className: 'row' },
                      React.createElement('div', { className: 'col-sm' }, 'Last Updated by'),
                      <div className="col-sm">{profile.lastUpdatedBy}</div>
                    ),
                    React.createElement('div', { className: 'row' },
                      React.createElement('div', { className: 'col-sm' }, 'Last Update Time'),
                      <div className="col-sm">{formatTime(profile.updateTime}</div> || 'N/A')
                    )
                  )
                )
              )
            ),
            React.createElement('div', { className: 'col-8' },
              React.createElement('div', { className: 'card mb-3 mb-lg-3 shadow bg-white rounded' },
                React.createElement('div', { className: 'card-header' },
                  React.createElement('h5', { className: 'mb-0' }, 'Description')
                ),
                React.createElement('div', { className: 'card-body bg-light' },
                  React.createElement('p', { style: { whiteSpace: 'pre-line' } }, profile.description)
                )
              )
            )
          )
        ),
        React.createElement('section', null,
          React.createElement('div', { className: 'card mb-3 mb-lg-3 shadow bg-white rounded' },
            React.createElement('div', { className: 'card-header' },
              React.createElement('h5', { className: 'mb-0' }, 'Pipeline Nodes')
            ),
            <div className="card-body bg-light">{profileNodes}</div>
          )
        )
      )
    ),
    deleteModal
  );
};

export default Profile;