import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';

import { toast } from 'react-toastify';
import { loadReleaseJobItemsFromLocalStorage, updateReleaseJobItemsToLocalStorage } from '../../utils/utilities';
import ReleaseStatics from '../../releaseManager/components/ReleaseStatics';

/**
 * This component renders a table showing a list of job config groups.
 */
const JobConfigGroupListTable = ({ jobConfigGroupList }) => {
  const [selectedConfigs, setSelectedConfigs] = useState([]);

  function onCheckOrUncheckConfigList(event) {
    if (event.target.id === 'SELECT_ALL_CONFIGS') {
      setSelectedConfigs(jobConfigGroupList);
    } else if (event.target.id === 'CLEAR') {
      setSelectedConfigs([]);
    }
  }

  function onCheckOrUncheckConfig(configGroup, event) {
    const existingConfigs = selectedConfigs.filter(config => config.id === configGroup.id);
    if (event.target.checked && existingConfigs.length < 1) {
      const newSelectedConfigs = [...selectedConfigs, configGroup];
      setSelectedConfigs(newSelectedConfigs);
    } else if (!event.target.checked && existingConfigs.length > 0) {
      const newSelectedConfigs = selectedConfigs.filter(config => config.id !== configGroup.id);
      setSelectedConfigs(newSelectedConfigs);
    }
  }

  function onAddToReleasePackage() {
    const releaseItems = loadReleaseJobItemsFromLocalStorage('releaseItem');

    let successAdded = false;
    const releaseItemsSlice = releaseItems.slice();
    const selectedConfigsSlice = selectedConfigs.slice();
    selectedConfigs.forEach(config => {
      const existingConfig = releaseItems.find(
        item => item.type === ReleaseStatics.CONFIG_GROUP && item.name === config.name,
      );
      if (existingConfig) {
        toast.error(`Config group ${config.name} exists in the package list...`);
        return;
      }

      const item = {
        targetGroupNames: null,
        sourceGroupNames: null,
        targetContextName: null,
        name: config.name,
        type: ReleaseStatics.CONFIG_GROUP,
        action: ReleaseStatics.ACTION_CREATE_OR_UPDATE,
        category: config.category,
      };
      successAdded = true;
      releaseItemsSlice.push(item);

      const index = selectedConfigsSlice.findIndex(configGroup => config.id === configGroup.id);
      selectedConfigsSlice.splice(index, 1);
    });

    if (successAdded) {
      updateReleaseJobItemsToLocalStorage('releaseItem', releaseItemsSlice);
      setSelectedConfigs(selectedConfigsSlice);
      toast.success('Jobs have been added to release package');
    }
  }

  const selectedConfigIds = selectedConfigs.map(config => config.id);

  const $rows = jobConfigGroupList.map(jobConfigGroup => (
    <tr key={jobConfigGroup.id}>
      <td>
        <input 
          type="checkbox" 
          checked={selectedConfigIds.indexOf(jobConfigGroup.id) > -1} 
          onChange={event => onCheckOrUncheckConfig(jobConfigGroup, event)} 
        />
      </td>
      <td>
        <Link to={`/job-config-group/detail/${jobConfigGroup.id}`}>
          {jobConfigGroup.name}
        </Link>
      </td>
      <td>
        <Link to={`/job-config-group/list-by-category/${jobConfigGroup.category}`}>
          {jobConfigGroup.category}
        </Link>
      </td>
      <td>{moment(jobConfigGroup.createTime).format('YYYY-MM-DD')}</td>
    </tr>
  ));

  return (
    <table className="table table-striped">
      <thead>
        <tr>
          <th className="col-1">
            <div className="btn-group">
              <button
                data-toggle="dropdown"
                className="btn btn-primary dropdown-toggle"
                type="button"
                id="dropdown-menu"
              >
                ACTIONS
              </button>
              <div className="dropdown-menu">
                <button
                  id="SELECT_ALL_CONFIGS"
                  className="dropdown-item"
                  type="button"
                  onClick={onCheckOrUncheckConfigList}
                >
                  Select All
                </button>
                <button 
                  id="CLEAR" 
                  className="dropdown-item" 
                  type="button" 
                  onClick={onCheckOrUncheckConfigList}
                >
                  Clear
                </button>
                <button 
                  id="ADD_TO_PACKAGE" 
                  className="dropdown-item" 
                  type="button" 
                  onClick={onAddToReleasePackage}
                >
                  Add To Release Package
                </button>
              </div>
            </div>
          </th>
          <th className="col-6">Name</th>
          <th className="col-2">Category</th>
          <th className="col-2">Created</th>
        </tr>
      </thead>
      <tbody>{$rows}</tbody>
    </table>
  );
};

export default JobConfigGroupListTable;