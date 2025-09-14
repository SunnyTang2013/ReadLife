import React, { useState, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import Autosuggest from 'react-autosuggest';
import batchService from '../../backend/batchService';

const BatchAutosuggest = ({ jiraKey, onAdd }) => {
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [currentSuggestions, setCurrentSuggestions] = useState([]);
  const [autosuggestStatus, setAutosuggestStatus] = useState('');
  const [jiraKeyValue, setJiraKeyValue] = useState(null);

  const onAddBatch = useCallback(() => {
    if (onAdd === null) {
      return;
    }

    if (!currentKeyword) {
      return;
    }

    // Assuming that the autosuggest input value is a full name of a batch (no longer
    // a partial keyword), try to find the selected job config group object from the current
    // suggestions.
    const name = currentKeyword;
    const batch = currentSuggestions.find(item => item.name === name);
    if (!batch) {
      return;
    }
    
    onAdd(batch);

    // Reset state.
    setCurrentKeyword('');
    setCurrentSuggestions([]);
    setAutosuggestStatus('');
  }, [onAdd, currentKeyword, currentSuggestions]);

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
    setCurrentKeyword(newValue);
  }, []);

  /**
   * Callback when autosuggest needs to update suggestions. Given the value as a keyword and the
   * current config group category, this function fetches a list of config group objects from
   * server and updates the current suggestions.
   */
  const autosuggestOnFetch = useMemo(() => 
    debounce(({ value }) => {
      setAutosuggestStatus(`Searching ${value} ...`);
      batchService.findBatchesByKeyword(value)
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
    []
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
  const autosuggestGetSuggestionValue = useCallback((batch) => {
    return batch.name;
  }, []);

  /**
   * Given an object in the current suggestions, this function renders it to HTML.
   */
  const autosuggestRenderSuggestion = useCallback((batch) => {
    const keyword = currentKeyword;
    const index = batch.name.indexOf(keyword);
    if (index < 0) {
      return <div>{batch.name}</div>;
    }
    const prefix = batch.name.substr(0, index);
    const suffix = batch.name.substr(index + keyword.length);
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

  const autosuggestInputProps = {
    placeholder: 'Type a batch name with "%" or "_" for wildcard',
    disabled: false,
    value: currentKeyword,
    onChange: autosuggestOnChangeValue,
  };

  return (
    <div>
      <div className="list-group-item">
        <div className="form-group row">
          <label htmlFor="inputBatch" className="col-sm-2 col-form-label">Batch</label>
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
              value={jiraKeyValue || ''} 
            />
          </div>
        </div>
        <div className="form-group row">
          <div className="col-sm-10">
            <button 
              className="btn btn-primary" 
              type="button" 
              onClick={onAddBatch}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchAutosuggest;