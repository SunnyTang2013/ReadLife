import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import profileService from '../backend/profileService';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';
import ProfilePipelineForm from './components/ProfilePipelineForm';

const ProfileCreate = () => {
  const [profile, setProfile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  
  const navigate = useNavigate();
  const { fromProfileId } = useParams();

  useEffect(() => {
    loadProfile();
  }, [fromProfileId]);

  const loadProfile = useCallback(() => {
    if (!fromProfileId) {
      setProfile({
        id: null,
        name: '',
        description: '',
        profileNodeSummaries: [],
        testScope: {
          entries: {},
        },
      });
      setIsSaving(false);
      setSaveError(null);
      return;
    }

    profileService.getProfileDetail(fromProfileId)
      .then((fromProfile) => {
        setProfile(Object.assign({}, fromProfile, {
          id: null,
          description: '',
          createTime: null,
          updateTime: null,
        }));
        setIsSaving(false);
        setSaveError(null);
      })
      .catch((error) => {
        setProfile(error);
        setIsSaving(false);
        setSaveError(null);
      });
  }, [fromProfileId]);

  const onSave = useCallback((profile) => {
    setIsSaving(true);
    profileService.createProfile(profile)
      .then((profileDetail) => {
        navigate(`/detail/${profileDetail.id}`);
      })
      .catch((error) => {
        setIsSaving(false);
        setSaveError(error);
      });
  }, [navigate]);

  const onCancel = useCallback(() => {
    navigate('/list');
  }, [navigate]);

  if (profile === null) {
    return <LoadingIndicator />;
  }
  if (profile instanceof Error) {
    return <ErrorAlert error={profile} />;
  }

  return React.createElement('div', { style: { maxWidth: '85%' }, className: 'container-fluid' },
    React.createElement('nav', null,
      React.createElement('ol', { className: 'breadcrumb' },
        React.createElement('li', { className: 'breadcrumb-item' }, 'Profile'),
        <li className="breadcrumb-item active">New Profile</li>
      )
    ),
    <h2 className="display-4">Create a New Profile</h2>,
    <ErrorAlert error={saveError} />,
    <ProfilePipelineForm profile={profile} onSave={onSave} onCancel={onCancel} disabled={isSaving} />
  );
};

export default ProfileCreate;