import React, { useState, useCallback } from 'react';
import { debounce } from 'lodash';
import Autosuggest from 'react-autosuggest';

import pipelineService from '../../backend/pipelineService';

/**
 * This component renders a section of job config group list. If `onChange` is provided, it also
 * renders an editor allowing to edit the list.
 */
const PipelineNodeBlock = ({ onChange = null }) => {
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [currentSuggestions, setCurrentSuggestions] = useState([]);
  const [autosuggestStatus, setAutosuggestStatus] = useState('');
  const [nodeType, setNodeType] = useState('BATCH');

  const onChangeNodeProperty = useCallback((event) => {
    const newNodeType = event.target.value;
    setNodeType(newNodeType);
    setCurrentSuggestions([]);
    setCurrentKeyword('');
    setAutosuggestStatus('');
    onChange && onChange(newNodeType, null);
  }, [onChange]);

  /**
   * Callback when user changes the input field of the autosuggest. It takes the user-provided
   * value and updates the current keyword.
   */
  const autosuggestOnChangeValue = useCallback((event, { newValue }) => {
    if (!newValue) {
      onChange && onChange(null);
    } else {
      const summary = currentSuggestions.find(item => item.name === newValue);
      if (summary) {
        onChange && onChange(nodeType, summary);
      }
    }

    setCurrentKeyword(newValue);
  }, [onChange, nodeType, currentSuggestions]);

  /**
   * Callback when autosuggest needs to update suggestions. Given the value as a keyword and the
   * current config group category, this function fetches a list of config group objects from
   * server and updates the current suggestions.
   */
  const autosuggestOnFetch = useCallback(debounce(({ value }) => {
    setAutosuggestStatus(`Searching ${value} ...`);
    if (nodeType === 'BATCH') {
      pipelineService.findBatchList(value)
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
    } else {
      pipelineService.findPipelineList(value)
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
    }
  }, 300), [nodeType]);

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
  const autosuggestGetSuggestionValue = useCallback((summary) => {
    onChange && onChange(nodeType, summary);
    return summary.name;
  }, [onChange, nodeType]);

  /**
   * Given an object in the current suggestions, this function renders it to HTML.
   */
  const autosuggestRenderSuggestion = useCallback((summary) => {
    const index = summary.name.indexOf(currentKeyword);
    if (index < 0) {
      return <div>{summary.name}</div>;
    }
    const prefix = summary.name.substr(0, index);
    const suffix = summary.name.substr(index + currentKeyword.length);
    return (
      <div>
        {prefix}
        <strong>{currentKeyword}</strong>
        {suffix}
      </div>
    );
  }, [currentKeyword]);

  const renderEditor = () => {
    // Check if editing is enabled.
    if (onChange === null) {
      return null;
    }

    const autosuggestPlaceholder = 'Type a batch name with "%" or "_" for wildcard';
    const autosuggestInputProps = {
      placeholder: autosuggestPlaceholder,
      value: currentKeyword,
      onChange: autosuggestOnChangeValue,
    };

    return (
      <div className="col-9">
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
    );
  };

  const $editor = renderEditor();
  return (
    <div className="row">
      <div className="form-group col-3">
        <select
          id="node-type"
          className="form-control"
          value={nodeType}
          onChange={event => onChangeNodeProperty(event)}
        >
          <option value="BATCH">Batch</option>
          <option value="PIPELINE">Pipeline</option>
        </select>
      </div>
      {$editor}
    </div>
  );
};

export default PipelineNodeBlock;