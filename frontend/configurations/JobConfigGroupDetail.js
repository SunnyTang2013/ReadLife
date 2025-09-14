import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';
import { cloneDeep } from 'lodash';

import configurations from '../backend/configurations';
import RouterPropTypes from '../proptypes/router';

import { formatTime } from '../utils/utilities';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';
import ParametersTable from '../components/ParametersTable';
import { withCurrentUser } from '../components/currentUser';
import ScorchPropTypes from '../proptypes/scorch';

const JobConfigGroupDetail = () => {
  const [data, setData] = useState(null);
  const [selectedVersionIds, setSelectedVersionIds] = useState([]);

  const navigate = useNavigate();
  const { jobConfigGroupId } = useParams();
  
  const currentUser = {canWrite: true};

  useEffect(() => {
    loadData();
  }, [jobConfigGroupId]);

  function onSynchronizeCounters() {
    configurations.synchronizeConfigGroupCounters(jobConfigGroupId)
      .then((configGroupSummary) => {
        toast.success(`Job config group #${jobConfigGroupId} is synchronized successfully.`);
        setData(prevData => {
          const newData = cloneDeep(prevData);
          newData.jobConfigGroup.jobCount = configGroupSummary.jobCount;
          newData.jobConfigGroup.contextCount = configGroupSummary.contextCount;
          return newData;
        });
      })
      .catch((error) => {
        toast.error(`Fail to synchronize job count for job config group: ${error}`);
      });
  }

  function onDelete() {
    if (data === null || data instanceof Error) {
      return;
    }
    configurations.deleteJobConfigGroup(jobConfigGroupId)
      .then(() => {
        toast.success(`Config group #${jobConfigGroupId} is deleted successfully.`);
        navigate('/job-config-group/list');
      })
      .catch((error) => {
        toast.error(`Fail to delete config group: ${error}`);
      });
  }

  function onCheckVersion(version, event) {
    const versionId = version.id;
    const isChecked = event.target.checked;
    setSelectedVersionIds(prevIds => {
      let newSelectedVersionIds = [...prevIds];
      if (isChecked) {
        if (!newSelectedVersionIds.includes(versionId)) {
          newSelectedVersionIds = newSelectedVersionIds.concat([versionId]);
        }
      } else {
        newSelectedVersionIds = newSelectedVersionIds.filter(item => item !== versionId);
      }
      // Keep at most 2 selected version IDs, removing all previously selected ones.
      const currentSize = newSelectedVersionIds.length;
      newSelectedVersionIds = newSelectedVersionIds.slice(currentSize - 2, currentSize);
      return newSelectedVersionIds;
    });
  }

  function onCompareSelectedVersions() {
    if (selectedVersionIds.length !== 2) {
      console.log(`Cannot compare ${selectedVersionIds.length} selected versions.`);
      return;
    }
    const [versionAId, versionBId] = selectedVersionIds;
    navigate(`/job-config-group/compare-versions/${versionAId}/${versionBId}`);
  }

  function onActivateVersion(version) {
    configurations.activateConfigGroupVersion(jobConfigGroupId, version.id)
      .then(() => {
        toast.success(`Config group version is activated (${version.version}).`);
        setData(null);
        loadData();
      }).catch((error) => {
        toast.error(`Fail to activate config group version: ${error}`);
      });
  }

  function onRevertToVersion(version) {
    configurations.revertConfigGroupToVersion(jobConfigGroupId, version.id)
      .then(() => {
        toast.success(`Config group is reverted to version ${version.version}.`);
        setData(null);
        loadData();
      }).catch((error) => {
        toast.error(`Fail to revert config group to a previous version: ${error}`);
      });
  }

  function loadData() {
    console.log(`Loading job config group #${jobConfigGroupId} ...`);
    const jobConfigGroupPromise = configurations.getJobConfigGroup(jobConfigGroupId);
    const versionsPromise = configurations.getJobConfigGroupVersionList(jobConfigGroupId);
    Promise.all([jobConfigGroupPromise, versionsPromise])
      .then(([jobConfigGroup, versions]) => {
        const newData = { jobConfigGroup, versions };
        setData(newData);
        setSelectedVersionIds([]);
      })
      .catch((error) => {
        setData(error);
        setSelectedVersionIds([]);
      });
  }

  function renderVersions(versions, activeVersionId) {
    if (!versions || versions.length === 0) {
      return <div className="alert alert-warning">No versions found.</div>;
    }

    const $versionRow = versions.map((version) => {
      const isSelected = selectedVersionIds.includes(version.id);
      const $checkbox = <input type="checkbox" checked={isSelected} onChange={event => onCheckVersion(version, event)} />;

      const isActivateDisabled = (activeVersionId === version.id || version.locked);
      const isRevertDisabled = (activeVersionId === version.id);
      const $actions = (
        <div className="btn-group btn-group-xs" role="group">
          <button
            className="btn btn-outline-primary"
            type="button"
            title="Promote this version to latest"
            disabled={isActivateDisabled}
            onClick={() => onActivateVersion(version)}
          >
            <i className="fa fa-fw fa-arrow-up" />
          </button>
          <button 
            className="btn btn-outline-primary" 
            type="button" 
            title="Copy and activate this version" 
            disabled={isRevertDisabled} 
            onClick={() => onRevertToVersion(version)}
          >
            <i className="fa fa-fw fa-repeat" />
          </button>
        </div>
      );

      return (
        <tr key={version.id}>
          <td className="text-nowrap">{$checkbox}</td>
          <td className="text-nowrap">
            <span className="text-code">{version.version}</span>
            {version.locked && <i className="fa fa-fw fa-lock text-muted ml-1" />}
            {version.tag && (
              <span className="badge badge-secondary ml-1">
                <i className="fa fa-fw fa-tag" />
                {' '}{version.tag}
              </span>
            )}
          </td>
          <td>
            {activeVersionId === version.id && (
              <span className="badge badge-purple mr-2">Active Version</span>
            )}
            {version.commitMessage || <span className="text-muted">(No commit message)</span>}
          </td>
          <td className="text-nowrap">{version.author}</td>
          <td className="text-nowrap">{formatTime(version.updateTime) || 'N/A'}</td>
          <td className="text-nowrap">{$actions}</td>
        </tr>
      );
    });

    return (
      <div>
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th style={{ width: '1%' }}></th>
              <th className="text-nowrap" style={{ width: '5%' }}>Version</th>
              <th className="text-nowrap">Commit Message</th>
              <th className="text-nowrap" style={{ width: '5%' }}>Author</th>
              <th className="text-nowrap" style={{ width: '5%' }}>Updated</th>
              <th className="text-nowrap" style={{ width: '5%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>{$versionRow}</tbody>
        </table>
        <div>
          <button
            className="btn btn-primary"
            type="button"
            disabled={selectedVersionIds.length !== 2}
            onClick={onCompareSelectedVersions}
          >
            Compare Selected Versions
          </button>
        </div>
      </div>
    );
  }

  const canWrite = currentUser.canWrite;
  if (data === null) {
    return <LoadingIndicator />;
  }
  if (data instanceof Error) {
    return <ErrorAlert error={data} />;
  }

  const { jobConfigGroup, versions } = data;

  const versionInfo = jobConfigGroup.versionInfo;
  let $versionInfo = null;
  if (versionInfo.version > 0) {
    $versionInfo = (
      <div className="alert alert-primary">
        <i className="fa fa-fw fa-file-text-o mr-1" />
        You are viewing{' '}
        <strong>version {versionInfo.version}</strong>
        , authored by{' '}
        <strong>{versionInfo.author}</strong>
        {` on ${versionInfo.updateTime}.`}
      </div>
    );
  } else {
    $versionInfo = (
      <div className="alert alert-danger">
        <i className="fa fa-fw fa-exclamation-triangle mr-1" />
        No active version found.
      </div>
    );
  }

  const $versionsTable = renderVersions(versions, versionInfo.id);

  return (
    <div>
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/">Configurations</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/job-config-group/list">Job Config Groups</Link>
          </li>
          <li className="breadcrumb-item active">{jobConfigGroup.name}</li>
        </ol>
      </nav>
      <h2 className="display-4">{jobConfigGroup.name}</h2>
      {canWrite && (
        <div className="mb-2">
          <Link
            to={`/job-config-group/update/${jobConfigGroup.id}`}
            className="btn btn-sm btn-primary btn-light-primary mr-2"
          >
            <i className="fa fa-fw fa-pencil" />
            {' '}Update
          </Link>
          <Link
            to={`/job-config-group/copy/${jobConfigGroup.id}`}
            className="btn btn-sm btn-primary btn-light-primary mr-2"
          >
            <i className="fa fa-fw fa-copy" />
            {' '}Clone
          </Link>
          <button 
            className="btn btn-sm btn-primary btn-light-primary mr-2" 
            type="button" 
            onClick={onSynchronizeCounters}
          >
            <i className="fa fa-fw fa-refresh" />
            {' '}Synchronize Counters
          </button>
          {(jobConfigGroup.jobCount === 0 && jobConfigGroup.contextCount === 0) ? (
            <button 
              className="btn btn-sm btn-danger" 
              type="button" 
              onClick={onDelete}
            >
              <i className="fa fa-fw fa-trash" />
              {' '}Delete
            </button>
          ) : (
            <button 
              className="btn btn-sm btn-primary btn-light-primary" 
              type="button" 
              title="This config group cannot be deleted because it is currently in use." 
              disabled
            >
              <i className="fa fa-fw fa-trash" />
              {' '}Delete
            </button>
          )}
        </div>
      )},
      <section>
        <table className="table table-striped table-fixed mb-0">
          <tbody>
            <tr>
              <th style={{ width: '30%' }}>Name</th>
              <td>{jobConfigGroup.name}</td>
            </tr>
            <tr>
              <th style={{ width: '30%' }}>Category</th>
              <td>{jobConfigGroup.category}</td>
            </tr>
            <tr>
              <th style={{ width: '30%' }}>Description</th>
              <td>{jobConfigGroup.description}</td>
            </tr>
            <tr>
              <th style={{ width: '30%' }}>Used in</th>
              <td>
                <a href={`/frontend/jobs/job/list-by-config-group/${jobConfigGroup.id}`}>
                  {jobConfigGroup.jobCount} jobs
                </a>
                <span className="text-muted mx-1">/</span>
                <a href={`/frontend/globalConfig/job-context/list-by-config-group/${jobConfigGroup.id}`}>
                  {jobConfigGroup.contextCount} jobs contexts
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
      <section>
        <h3 className="display-6">Parameters</h3>
        {$versionInfo}
        <ParametersTable parameters={jobConfigGroup.parameters} />
      </section>
      <section>
        <h3 className="display-6">Versions</h3>
        {$versionsTable}
      </section>
    </div>
  );
};

export default JobConfigGroupDetail;
