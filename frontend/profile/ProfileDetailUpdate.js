import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { isEqual } from 'lodash';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';
import profileService from '../backend/profileService';
import ProfilePipelineForm from './components/ProfilePipelineForm';

const ProfileDetailUpdate = () => {
  const [profileDetail, setProfileDetail] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  
  const navigate = useNavigate();
  const { profileId } = useParams();

  useEffect(() => {
    loadProfileDetail();
  }, [profileId]);

  const loadProfileDetail = useCallback(() => {
    profileService.getProfileDetail(profileId)
      .then((profileDetail) => {
        setProfileDetail(profileDetail);
        setIsSaving(false);
        setSaveError(null);
      })
      .catch((error) => {
        setProfileDetail(error);
        setIsSaving(false);
        setSaveError(null);
      });
  }, [profileId]);

  const onSave = useCallback((profileDetail) => {
    setIsSaving(true);
    profileService.updateProfile(profileDetail)
      .then(() => {
        toast.success('Profile is updated successfully.');
        navigate(`/detail/${profileDetail.id}`);
      })
      .catch((error) => {
        setIsSaving(false);
        setSaveError(error);
      });
  }, [navigate]);

  const onCancel = useCallback(() => {
    navigate(`/detail/${profileId}`);
  }, [profileId, navigate]);

  if (profileDetail === null) {
    return <LoadingIndicator />;
  }
  if (profileDetail instanceof Error) {
    return <ErrorAlert error={profileDetail} />;
  }

  return React.createElement('div', { style: { maxWidth: '85%' }, className: 'container-fluid' },
    React.createElement('nav', null,
      React.createElement('ol', { className: 'breadcrumb' },
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: '/list' }, 'Profile List')
        ),
        <li className="breadcrumb-item active">{profileDetail.name}</li>
      )
    ),
    <h2 className="display-4">{`Update: ${profileDetail.name}`}</h2>,
    <ErrorAlert error={saveError} />,
    <ProfilePipelineForm profile={profileDetail} onSave={onSave} onCancel={onCancel} disabled={isSaving} />
  );
};

export default ProfileDetailUpdate;