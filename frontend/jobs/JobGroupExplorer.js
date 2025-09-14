import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import jobGroupService from '../backend/jobGroupService';
import userService from '../backend/user';
import ScorchPropTypes from '../proptypes/scorch';
import { sortCaseInsensitive } from '../utils/utilities';

import Alert from '../components/Alert';
import LoadingIndicator from '../components/LoadingIndicator';
import { withCurrentUser } from '../components/currentUser';

import JobGroupForest from './components/JobGroupForest';
import JobGroupEditModal from './components/JobGroupEditModal';
import JobGroupCreateModal from './components/JobGroupCreateModal';
import JobGroupDeleteModal from './components/JobGroupDeleteModal';
import RouterPropTypes from '../proptypes/router';
import JobGroupReleaseModal from './components/JobGroupReleaseModal';

const ACTION_JOB_GROUP_EDIT = 'JobGroupEdit';
const ACTION_JOB_GROUP_CREATE = 'JobGroupCreate';
const ACTION_JOB_GROUP_DELETE = 'JobGroupDelete';
const ACTION_ADD_RELEASE_PACKAGE = 'JobGroupRelease';

function isValidData(data) {
  return data !== null && !(data instanceof Error);
}

function extractJobGroups(jobGroups, jobGroupIds) {
  if (!jobGroups || jobGroups.length === 0) {
    return [];
  }
  let results = jobGroups.filter(jobGroup => jobGroupIds.includes(jobGroup.id));
  for (let i = 0; i < jobGroups.length; i++) {
    const jobGroup = jobGroups[i];
    const childResults = extractJobGroups(jobGroup.children, jobGroupIds);
    results = results.concat(childResults);
  }
  return sortCaseInsensitive(results, item => item.name);
}

const JobGroupExplorer = ({ currentUser }) => {
  const [data, setData] = useState(null);
  const [currentAction, setCurrentAction] = useState(null);
  
  const { jobGroupId } = useParams();

  useEffect(() => {
    _loadData();
  }, [jobGroupId]);

  const onRefresh = (event) => {
    event.preventDefault();
    setData(null);
    _loadData();
  };

  const onToggleFavourite = (jobGroup) => {
    setData((prevData) => {
      if (!isValidData(prevData)) {
        return prevData;
      }

      const { userPreferences } = prevData;
      const favouriteJobGroupIds = (userPreferences.favouriteJobGroupIds || []).slice();
      const favouriteIndex = favouriteJobGroupIds.indexOf(jobGroup.id);
      if (favouriteIndex >= 0) {
        // Remove it from favourites.
        favouriteJobGroupIds.splice(favouriteIndex, 1);
      } else {
        // Add it to favourites.
        favouriteJobGroupIds.push(jobGroup.id);
      }

      const newData = Object.assign({}, prevData);
      newData.userPreferences.favouriteJobGroupIds = favouriteJobGroupIds;
      _updateUserPreferences(newData);
      return newData;
    });
  };

  const onCompleteAction = () => {
    setCurrentAction(null);
    _loadData();
  };

  const onCloseAction = () => {
    setCurrentAction(null);
  };

  const onEditJobGroup = (jobGroup) => {
    setCurrentAction({
      name: ACTION_JOB_GROUP_EDIT,
      jobGroup: jobGroup,
    });
  };

  const onCreateJobGroup = (jobGroup) => {
    setCurrentAction({
      name: ACTION_JOB_GROUP_CREATE,
      jobGroup: jobGroup,
    });
  };

  const onDeleteJobGroup = (jobGroup) => {
    setCurrentAction({
      name: ACTION_JOB_GROUP_DELETE,
      jobGroup: jobGroup,
    });
  };

  const onAddReleasePackage = (jobGroup) => {
    setCurrentAction({
      name: ACTION_ADD_RELEASE_PACKAGE,
      jobGroup: jobGroup,
    });
  };

  const _loadData = () => {
    console.log('Loading job group forest and user preferences...');
    const jobGroupForestPromise = jobGroupService.getJobGroupForest();
    const userPreferencesPromise = userService.getUserPreferences(currentUser);
    Promise.all([jobGroupForestPromise, userPreferencesPromise])
      .then(([jobGroupForest, userPreferences]) => {
        const data = { jobGroupForest, userPreferences };
        setData(data);
      })
      .catch((error) => {
        setData(error);
      });
  };

  const _updateUserPreferences = (dataWithPreferences) => {
    if (!isValidData(dataWithPreferences)) {
      return;
    }
    userService.updateUserPreferences(currentUser, dataWithPreferences.userPreferences);
  };

  const _renderActionModal = () => {
    if (!isValidData(data) || !currentAction) {
      return null;
    }

    switch (currentAction.name) {
      case ACTION_JOB_GROUP_EDIT:
        return <JobGroupEditModal jobGroupForest={data.jobGroupForest} action={currentAction} onComplete={onCompleteAction} onClose={onCloseAction} />;
      case ACTION_JOB_GROUP_CREATE:
        return <JobGroupCreateModal action={currentAction} onComplete={onCompleteAction} onClose={onCloseAction} />;
      case ACTION_JOB_GROUP_DELETE:
        return <JobGroupDeleteModal action={currentAction} onComplete={onCompleteAction} onClose={onCloseAction} />;
      case ACTION_ADD_RELEASE_PACKAGE:
        return <JobGroupReleaseModal jobGroupForest={data.jobGroupForest} action={currentAction} onComplete={onCompleteAction} onClose={onCloseAction} />;
      default:
        return null;
    }
  };

  let $content = null;
  if (data === null) {
    $content = <LoadingIndicator />;
  } else if (data instanceof Error) {
    $content = <Alert type="danger" text={String(data)} />;
  } else {
    const { jobGroupForest, userPreferences } = data;

    // Render the favourite forest.
    const favouriteJobGroupIds = userPreferences.favouriteJobGroupIds || [];
    const favouriteForest = extractJobGroups(jobGroupForest, favouriteJobGroupIds);
    const $favourites = <JobGroupForest key="favourites" uniqueId="favourites" title="Favourites" forest={favouriteForest} favouriteIds={favouriteJobGroupIds} currentUser={currentUser} jobGroupId={jobGroupId} onToggleFavourite={onToggleFavourite} onEditJobGroup={onEditJobGroup} onCreateJobGroup={onCreateJobGroup} onDeleteJobGroup={onDeleteJobGroup} onAddReleasePackage={onAddReleasePackage} />;

    // Render the hierarchy forest.
    const $hierarchy = <JobGroupForest key="hierarchy" uniqueId="hierarchy" title="Hierarchy" forest={jobGroupForest} favouriteIds={favouriteJobGroupIds} currentUser={currentUser} jobGroupId={jobGroupId} onToggleFavourite={onToggleFavourite} onEditJobGroup={onEditJobGroup} onCreateJobGroup={onCreateJobGroup} onDeleteJobGroup={onDeleteJobGroup} onAddReleasePackage={onAddReleasePackage} />;

    // Combine favourite and hierarchy.
    $content = (
      <div className="sco-job-group-explorer">
        <aside>{$favourites}</aside>
        <aside>{$hierarchy}</aside>
      </div>
    );
  }

  const $actionModal = _renderActionModal();

  return (
    <div className="d-flex flex-column h-100">
      <h2 className="display-6">Job Group Explorer</h2>
      <ul className="list-inline text-sm mb-2">
        <li className="list-inline-item">
          <button
            className="anchor"
            type="button"
            onClick={onRefresh}
          >
            <i className="fa fa-fw fa-refresh" />
            {' Refresh'}
          </button>
        </li>
      </ul>
      {$content}
      {$actionModal}
    </div>
  );
};

export default withCurrentUser(JobGroupExplorer);