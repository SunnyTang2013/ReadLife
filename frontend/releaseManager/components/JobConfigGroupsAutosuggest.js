import React, { useState, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import Autosuggest from 'react-autosuggest';

import configurations from '../../backend/configurations';
import { getJobConfigCategoriesByType } from '../../utils/constants';
import { sortCaseInsensitive } from '../../utils/utilities';

const JobConfigGroupsAutosuggest = ({ onAdd, jiraKey }) => {
  const [currentScope, setCurrentScope] = useState('');
  const [currentCategory, setCurrentCategory] = useState('');
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [currentSuggestions, setCurrentSuggestions] = useState([]);
  const [autosuggestStatus, setAutosuggestStatus] = useState('');
  const [jiraKeyValue, setJiraKeyValue] = useState('');

  const onAddJobConfigGroup = useCallback(() => {
    if (onAdd === null) {
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

    onAdd(jobConfigGroup);

    // Reset state.
    setCurrentScope('');
    setCurrentCategory('');
    setCurrentKeyword('');
    setCurrentSuggestions([]);
    setAutosuggestStatus('');
  }, [onAdd, currentKeyword, currentSuggestions]);

  /**
   * Callback when user selects a config group for func or tech in the drop-down list.
   */
  const onSelectConfigGroupScope = useCallback((event) => {
    const nextScope = event.target.value;
    if (nextScope !== currentScope) {
      setCurrentScope(nextScope);
      setCurrentCategory('');
      setCurrentKeyword('');
      setCurrentSuggestions([]);
    }
  }, [currentScope]);

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

  const onChangeJiraKey = useCallback((event) => {
    const value = event.target.value;
    setJiraKeyValue(value);
    jiraKey(value);
  }, [jiraKey]);

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
  const autosuggestOnFetch = useMemo(() =>
    debounce(({ value }) => {
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
    }, 300),
    [currentCategory]
  );

  /**
   * Callback when autosuggest needs to clear suggestions.
   */
  const autosuggestOnClear = useCallback(() => {
    // Do nothing. TODO: What is the right usage of this function?
  }, []);

  /**
   * Given an object in the current suggestions, this function extracts and returns the input value
   * of the suggestion. The returned value is a plain string.
   */
  const autosuggestGetSuggestionValue = useCallback((jobConfigGroup) => {
    return jobConfigGroup.name;
  }, []);

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
      <div>
        {prefix}
        <strong>{keyword}</strong>
        {suffix}
      </div>
    );
  }, [currentKeyword]);

  if (onAdd === null) {
    return null;
  }

  const categoriesByType = getJobConfigCategoriesByType();
  let categories = [...categoriesByType.functional];
  if (currentScope === 'technical') {
    categories = [...categoriesByType.technical];
  }

  const categoryOptions = sortCaseInsensitive(categories).map(category =>
    <option key={category} value={category}>{category}</option>
  );
  categoryOptions.unshift(
    <option key="" value="">----</option>
  );

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
    <div>
      <div className="list-group-item">
        <div className="form-group row">
          <label htmlFor="inputContext" className="col-sm-2 col-form-label">Scope</label>
          <div className="col-sm-5">
            <select
              className="form-control"
              value={currentScope}
              onChange={onSelectConfigGroupScope}
            >
              <option key="functional" value="functional">Functional(Job Level)</option>
              <option key="technical" value="technical">Technical(Context Level)</option>
            </select>
          </div>
        </div>
        <div className="form-group row">
          <label htmlFor="inputContext" className="col-sm-2 col-form-label">Categories</label>
          <div className="col-sm-5">
            <select
              className="form-control"
              value={currentCategory}
              onChange={onSelectConfigGroupCategory}
            >
              {categoryOptions}
            </select>
          </div>
        </div>
        <div className="form-group row">
          <label htmlFor="inputGroup" className="col-sm-2 col-form-label">Configuration</label>
          <div className="col-sm-5">
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
        </div>
        <div className="form-group row">
          <label htmlFor="jira-id" className="col-sm-2 col-form-label">JIRA ID</label>
          <div className="col-sm-3">
            <input 
              id="jira-id" 
              className="form-control" 
              onChange={onChangeJiraKey} 
              placeholder="--------------------JIRA ID if available--------------------------" 
              value={jiraKeyValue} 
            />
          </div>
        </div>
        <div className="form-group row">
          <div className="col-sm-10">
            <button
              className="btn btn-primary"
              type="button"
              onClick={onAddJobConfigGroup}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobConfigGroupsAutosuggest;