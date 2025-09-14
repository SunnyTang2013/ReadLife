import React, { useState, useCallback } from 'react';
import { debounce } from 'lodash';
import Autosuggest from 'react-autosuggest';
import pipelineService from '../../backend/pipelineService';

const ProfilePipelineNodeBlock = ({ onChange = null }) => {
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [currentSuggestions, setCurrentSuggestions] = useState([]);
  const [autosuggestStatus, setAutosuggestStatus] = useState('');
  const [nodeType, setNodeType] = useState('BATCH');

  const onChangeNodeProperty = useCallback((event) => {
    const nodeType = event.target.value;
    setNodeType(nodeType);
    setCurrentSuggestions([]);
    setCurrentKeyword('');
    setAutosuggestStatus('');
    onChange && onChange(nodeType, null);
  }, [onChange]);

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
  }, [currentSuggestions, nodeType, onChange]);

  const autosuggestOnFetch = useCallback(debounce(({ value }) => {
    setAutosuggestStatus(`Searching ${value} ...`);
    
    if (nodeType === 'BATCH') {
      pipelineService.findBatchList(value)
        .then((results) => {
          let autosuggestStatus = null;
          if (results.length === 0) {
            autosuggestStatus = 'No results found.';
          } else {
            autosuggestStatus = `Showing ${results.length} results.`;
          }
          setCurrentSuggestions(results);
          setAutosuggestStatus(autosuggestStatus);
        });
    } else {
      pipelineService.findPipelineList(value)
        .then((results) => {
          let autosuggestStatus = null;
          if (results.length === 0) {
            autosuggestStatus = 'No results found.';
          } else {
            autosuggestStatus = `Showing ${results.length} results.`;
          }
          setCurrentSuggestions(results);
          setAutosuggestStatus(autosuggestStatus);
        });
    }
  }, 300), [nodeType]);

  const autosuggestOnClear = useCallback(() => {
    // Do nothing. TODO: What is the right usage of this function?
  }, []);

  const autosuggestGetSuggestionValue = useCallback((summary) => {
    onChange && onChange(nodeType, summary);
    return summary.name;
  }, [nodeType, onChange]);

  const autosuggestRenderSuggestion = useCallback((summary) => {
    const keyword = currentKeyword;
    const index = summary.name.indexOf(keyword);
    if (index < 0) {
      return <div>{summary.name}</div>;
    }
    const prefix = summary.name.substr(0, index);
    const suffix = summary.name.substr(index + keyword.length);
    return <div>{prefix,
      <strong>{keyword}</strong>,
      suffix}</div>;
  }, [currentKeyword]);

  const renderEditor = useCallback(() => {
    if (onChange === null) {
      return null;
    }

    const autosuggestPlaceholder = 'Type a batch name with "%" or "_" for wildcard';
    const autosuggestInputProps = {
      placeholder: autosuggestPlaceholder,
      value: currentKeyword,
      onChange: autosuggestOnChangeValue,
    };

    return React.createElement('div', { className: 'col-9' },
      <Autosuggest suggestions={currentSuggestions || []} onSuggestionsFetchRequested={autosuggestOnFetch} onSuggestionsClearRequested={autosuggestOnClear} getSuggestionValue={autosuggestGetSuggestionValue} renderSuggestion={autosuggestRenderSuggestion} inputProps={autosuggestInputProps} />,
      React.createElement('small', { className: 'form-text text-muted' }, autosuggestStatus)
    );
  }, [onChange, currentKeyword, currentSuggestions, autosuggestStatus, autosuggestOnChangeValue, autosuggestOnFetch, autosuggestOnClear, autosuggestGetSuggestionValue, autosuggestRenderSuggestion]);

  const editor = renderEditor();
  
  return React.createElement('div', { className: 'row' },
    React.createElement('div', { className: 'form-group col-3' },
      React.createElement('select', {
        id: 'node-type',
        className: 'form-control',
        value: nodeType,
        onChange: onChangeNodeProperty
      },
        React.createElement('option', { value: 'BATCH' }, 'Batch'),
        <option value="PIPELINE">Pipeline</option>
      )
    ),
    editor
  );
};

export default ProfilePipelineNodeBlock;