import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';
import Autosuggest from 'react-autosuggest';

import configurations from '../backend/configurations';
import ScorchPropTypes from '../proptypes/scorch';

import Alert from './Alert';
import ParametersTable from './ParametersTable';

import { getJobConfigCategoriesByType } from '../utils/constants';
import { sortCaseInsensitive } from '../utils/utilities';

// region ---------- Internal JobConfigGroup ------------------------------------------------------

function JobConfigGroup({ jobConfigGroup, onDelete }) {
  if (!jobConfigGroup) {
    return <div style={{ display: 'none' }} />;
  }

  let $delete = null;
  if (onDelete) {
    $delete = (
      <button
        className="anchor text-muted mr-2"
        type="button"
        onClick={() => onDelete(jobConfigGroup)}
      >
        <i className="fa fa-fw fa-times" /> Delete
      </button>
    );
  }
  const $view = (
    <a
      className="text-muted"
      href={`/frontend/configurations/job-config-group/detail/${jobConfigGroup.id}`}
    >
      <i className="fa fa-fw fa-eye" /> View
    </a>
  );

  let $versionInfo = null;
  const versionInfo = jobConfigGroup.versionInfo;
  if (versionInfo.version > 0) {
    $versionInfo = (
      <div className="text-muted">
        <span>
          {versionInfo.locked ? (
            <i className="fa fa-fw fa-lock mr-1" />
          ) : (
            <i className="fa fa-fw fa-file-text-o mr-1" />
          )}
          v.{versionInfo.version}
        </span>
        {versionInfo.tag && (
          <span className="badge badge-secondary ml-2">
            <i className="fa fa-fw fa-tag" /> {versionInfo.tag}
          </span>
        )}
      </div>
    );
  } else {
    $versionInfo = (
      <div className="text-danger">
        <i className="fa fa-fw fa-exclamation-triangle mr-1" />
        No active version.
      </div>
    );
  }

  return (
    <div key={jobConfigGroup.id} className="card my-2">
      <div className="card-header clearfix">
        <div className="float-right d-flex align-items-center text-nowrap">
          {$versionInfo}
          <span className="text-muted mx-2">|</span>
          {$delete}
          {$view}
        </div>
        <h6 className="mb-0">
          <a data-toggle="collapse" href={`#job-config-group-${jobConfigGroup.id}`}>
            {jobConfigGroup.name}
          </a>
          <span className="badge badge-secondary ml-2">{jobConfigGroup.category}</span>
        </h6>
      </div>
      <div id={`job-config-group-${jobConfigGroup.id}`} className="card-body collapse">
        <ParametersTable parameters={jobConfigGroup.parameters} />
      </div>
    </div>
  );
}

JobConfigGroup.propTypes = {
  jobConfigGroup: ScorchPropTypes.jobConfigGroup().isRequired,
  onDelete: PropTypes.func,
};

JobConfigGroup.defaultProps = {
  onDelete: null,
};

// endregion

// region ---------- Helper functions ------------------------------------------------

/**
 * Callback when autosuggest needs to clear suggestions.
 */
function autosuggestOnClear() {
  // Do nothing. TODO: What is the right usage of this function?
}

/**
 * Given an object in the current suggestions, this function extracts and returns the input value
 * of the suggestion. The returned value is a plain string.
 */
function autosuggestGetSuggestionValue(jobConfigGroup) {
  return jobConfigGroup.name;
}

// endregion

// region ---------- Exported JobConfigGroupsBlock ------------------------------------------------

/**
 * This component renders a section of job config group list. If `onChange` is provided, it also
 * renders an editor allowing to edit the list.
 */
function JobConfigGroupsBlock({ categoryType, jobConfigGroups, onChange }) {
  const [currentCategory, setCurrentCategory] = useState('');
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [currentSuggestions, setCurrentSuggestions] = useState([]);
  const [autosuggestStatus, setAutosuggestStatus] = useState('');

  /**
   * Callback when user clicks the "Add" button to add a config group to the holder object.
   */
  const onAddJobConfigGroup = useCallback(() => {
    // Check if editing is enabled.
    if (onChange === null) {
      return;
    }

    if (!currentKeyword) {
      return;
    }

    // Assuming that the autosuggest input value is a full name of a job config group (no longer
    // a partial keyword), try to find the selected job config group object from the current
    // suggestions.
    const name = currentKeyword;
    const jobConfigGroup = currentSuggestions.find(item => item.name === name);
    if (!jobConfigGroup) {
      return;
    }

    // Call the `onChange` callback with an updated job config group list.
    const updatedJobConfigGroups = jobConfigGroups
      .filter(item => item.category !== jobConfigGroup.category)
      .concat([jobConfigGroup]);
    onChange(updatedJobConfigGroups);

    // Reset state.
    setCurrentCategory('');
    setCurrentKeyword('');
    setCurrentSuggestions([]);
    setAutosuggestStatus('');
  }, [onChange, currentKeyword, currentSuggestions, jobConfigGroups]);

  const onDeleteJobConfigGroup = useCallback((jobConfigGroup) => {
    // Check if editing is enabled.
    if (onChange === null) {
      return;
    }

    // Call the `onChange` callback with an updated job config group list.
    const updatedJobConfigGroups = jobConfigGroups
      .filter(item => item.id !== jobConfigGroup.id);
    onChange(updatedJobConfigGroups);
  }, [onChange, jobConfigGroups]);

  /**
   * Callback when user selects a config group category in the drop-down list.
   */
  const onSelectConfigGroupCategory = useCallback((event) => {
    const nextCategory = event.target.value;
    if (nextCategory !== currentCategory) {
      setCurrentCategory(nextCategory);
      setCurrentKeyword('');
      setCurrentSuggestions([]);
    }
  }, [currentCategory]);

  /**
   * Callback when user changes the input field of the autosuggest. It takes the user-provided
   * value and updates the current keyword.
   */
  const autosuggestOnChangeValue = useCallback((event, { newValue }) => {
    // If the current category is not yet selected, user is not allowed to update the keyword.
    if (!currentCategory) {
      return;
    }
    setCurrentKeyword(newValue);
  }, [currentCategory]);

  /**
   * Callback when autosuggest needs to update suggestions. Given the value as a keyword and the
   * current config group category, this function fetches a list of config group objects from
   * server and updates the current suggestions.
   */
  const autosuggestOnFetch = useCallback(debounce(({ value }) => {
    if (!currentCategory) {
      return;
    }

    setAutosuggestStatus(`Searching ${currentCategory} ...`);
    configurations.findJobConfigGroupList(currentCategory, value)
      .then((results) => {
        let status = null;
        if (results.length === 0) {
          status = 'No results found.';
        } else {
          status = `Showing ${results.length} results.`;
        }
        setCurrentSuggestions(results);
        setAutosuggestStatus(status);
      });
  }, 300), [currentCategory]);

  /**
   * Given an object in the current suggestions, this function renders it to HTML.
   */
  const autosuggestRenderSuggestion = useCallback((jobConfigGroup) => {
    const keyword = currentKeyword;
    const index = jobConfigGroup.name.indexOf(keyword);
    if (index < 0) {
      return <div>{jobConfigGroup.name}</div>;
    }
    const prefix = jobConfigGroup.name.substr(0, index);
    const suffix = jobConfigGroup.name.substr(index + keyword.length);
    return (
      <div>{prefix}<strong>{keyword}</strong>{suffix}</div>
    );
  }, [currentKeyword]);

  const renderEditor = useCallback(() => {
    // Check if editing is enabled.
    if (onChange === null) {
      return null;
    }

    const categoriesByType = getJobConfigCategoriesByType();
    const categories = categoriesByType[categoryType];
    const $categoryOptions = categories.map(category => (
      <option key={category} value={category}>
        {category}
      </option>
    ));
    $categoryOptions.unshift((
      <option key="" value="">----</option>
    ));

    let autosuggestPlaceholder = null;
    let autosuggestDisabled = false;
    if (currentCategory) {
      autosuggestPlaceholder = `Type a ${currentCategory} name with "%" or "_" for wildcard`;
      autosuggestDisabled = false;
    } else {
      autosuggestPlaceholder = 'Please select a category first.';
      autosuggestDisabled = true;
    }
    const autosuggestInputProps = {
      placeholder: autosuggestPlaceholder,
      disabled: autosuggestDisabled,
      value: currentKeyword,
      onChange: autosuggestOnChangeValue,
    };

    return (
      <div className="row">
        <div className="col-3">
          <select
            className="form-control"
            value={currentCategory}
            onChange={onSelectConfigGroupCategory}
          >
            {$categoryOptions}
          </select>
        </div>
        <div className="col-6">
          <Autosuggest
            suggestions={currentSuggestions || []}
            onSuggestionsFetchRequested={autosuggestOnFetch}
            onSuggestionsClearRequested={autosuggestOnClear}
            getSuggestionValue={autosuggestGetSuggestionValue}
            renderSuggestion={autosuggestRenderSuggestion}
            inputProps={autosuggestInputProps}
          />
          <small className="form-text text-muted">{autosuggestStatus}</small>
        </div>
        <div className="col-3">
          <button
            className="btn btn-primary btn-light-primary"
            type="button"
            onClick={onAddJobConfigGroup}
          >
            <i className="fa fa-fw fa-plus" /> Add
          </button>
        </div>
      </div>
    );
  }, [
    onChange,
    categoryType,
    currentCategory,
    currentKeyword,
    currentSuggestions,
    autosuggestStatus,
    autosuggestOnChangeValue,
    autosuggestOnFetch,
    autosuggestRenderSuggestion,
    onSelectConfigGroupCategory,
    onAddJobConfigGroup,
  ]);

  const renderJobConfigGroups = useCallback(() => {
    // Provide an `onDelete` callback if editing is enabled.
    let onDelete = null;
    if (onChange !== null) {
      onDelete = onDeleteJobConfigGroup;
    }

    if (!jobConfigGroups || jobConfigGroups.length === 0) {
      return <Alert type="warning" text="Currently no config groups." />;
    }

    const categories = sortCaseInsensitive(
      jobConfigGroups.map(jobConfigGroup => jobConfigGroup.category),
    );
    const $sections = categories.map((category) => {
      const jobConfigGroup = jobConfigGroups.find(
        configGroup => configGroup.category === category,
      );
      return (
        <JobConfigGroup
          key={`job-config-group-${jobConfigGroup.id}`}
          jobConfigGroup={jobConfigGroup}
          onDelete={onDelete}
        />
      );
    });
    return <div>{$sections}</div>;
  }, [onChange, onDeleteJobConfigGroup, jobConfigGroups]);

  const $editor = renderEditor();
  const $jobConfigGroups = renderJobConfigGroups();

  return (
    <div>
      {$editor}
      {$jobConfigGroups}
    </div>
  );
}

JobConfigGroupsBlock.propTypes = {
  categoryType: PropTypes.oneOf(['functional', 'technical']).isRequired,
  jobConfigGroups: PropTypes.arrayOf(ScorchPropTypes.jobConfigGroup()).isRequired,
  onChange: PropTypes.func,
};

JobConfigGroupsBlock.defaultProps = {
  onChange: null,
};

export default JobConfigGroupsBlock;

// endregion