import React, { useState, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import Autosuggest from 'react-autosuggest';
import ReleaseStatics from './ReleaseStatics';

const shouldRenderSuggestions = () => {
  return true;
};

const JobContextAutosuggest = ({ allowsClear = false, onChange }) => {
  const [currentValue, setCurrentValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  /**
   * Callback when autosuggest needs to update suggestions. Given the value as a keyword and the
   * current config group category, this function fetches a list of config group objects from
   * server and updates the current suggestions.
   */
  const onSuggestionsFetchRequested = useMemo(() =>
    debounce(({ value }) => {
      const keyword = value.trim().toLowerCase();
      if (!keyword) {
        setSuggestions([]);
        return;
      }

      const filteredSuggestions = ReleaseStatics.JobContextList.filter((jobContext) => {
        const cleanedJobGroupName = jobContext.name.toLowerCase();
        return cleanedJobGroupName.indexOf(keyword) >= 0;
      });

      if (filteredSuggestions.length === 0 && keyword.length > 0) {
        setSuggestions([{ isAddNew: true }]);
        return;
      }
      
      if (keyword.length > 0 && !ReleaseStatics.JobContextList.find(
        jobContext => jobContext.name.toLowerCase() === keyword,
      )) {
        filteredSuggestions.push({ isAddNew: true });
      }
      
      setSuggestions(filteredSuggestions);
    }, 300),
    []
  );

  const onSuggestionsClearRequested = useCallback(() => {
    setSuggestions([]);
  }, []);

  const onSuggestionSelected = useCallback((event, { suggestion }) => {
    if (suggestion) {
      const jobContextList = ReleaseStatics.JobContextList;
      if (suggestion.isAddNew) {
        const newOption = { name: currentValue, id: currentValue };
        jobContextList.push(newOption);
        onChange(newOption);
      } else {
        onChange(suggestion);
      }
    }
  }, [currentValue, onChange]);

  /**
   * Given an object in Autosuggest's suggestion list, this function renders it to HTML.
   */
  const onRenderSuggestion = useCallback((jobContext) => {
    if (jobContext.isAddNew) {
      return (
      <span>
        [+] Add new: 
        <strong>{currentValue}</strong>
      </span>
    );
    }
    
    const jobGroupName = jobContext.name;
    const index = jobGroupName.indexOf(currentValue);
    if (index < 0) {
      return <div>{jobGroupName}</div>;
    }
    
    const prefix = jobGroupName.substr(0, index);
    const suffix = jobGroupName.substr(index + currentValue.length);
    return (
      <div>
        {prefix}
        <strong>{currentValue}</strong>
        {suffix}
      </div>
    );
  }, [currentValue]);

  const onChangeCurrentValue = useCallback((event, { newValue }) => {
    setCurrentValue(newValue);
    if (!newValue) {
      onChange(null);
    }
  }, [onChange]);

  const onClearCurrentValue = useCallback(() => {
    if (!allowsClear) {
      return;
    }
    setCurrentValue('');
    setSuggestions([]);
    onChange(null);
  }, [allowsClear, onChange]);

  const jobContextList = ReleaseStatics.JobContextList;

  if (jobContextList === null) {
    return <input className="form-control" type="text" placeholder="Loading job contexts..." readOnly />;
  }

  if (jobContextList instanceof Error) {
    return (
      <div className="alert alert-danger">
        <i className="fa fa-fw fa-exclamation-triangle" />
        {' Fail to load job contexts.'}
      </div>
    );
  }

  let clearButton = null;
  if (allowsClear) {
    clearButton = (
      <div className="my-1">
        <button 
          className="anchor text-muted" 
          type="button" 
          onClick={onClearCurrentValue}
        >
          <i className="fa fa-fw fa-times" />
          {' Clear value'}
        </button>
      </div>
    );
  }

  const inputProps = {
    placeholder: 'Type a job context name',
    value: currentValue,
    onChange: onChangeCurrentValue,
  };

  return (
    <div>
      <Autosuggest 
        shouldRenderSuggestions={shouldRenderSuggestions} 
        suggestions={suggestions} 
        onSuggestionsFetchRequested={onSuggestionsFetchRequested} 
        onSuggestionsClearRequested={onSuggestionsClearRequested} 
        onSuggestionSelected={onSuggestionSelected} 
        renderSuggestion={onRenderSuggestion} 
        getSuggestionValue={suggestion => (suggestion.isAddNew ? currentValue : suggestion.name)} 
        inputProps={inputProps} 
      />
      {clearButton}
    </div>
  );
};

export default JobContextAutosuggest;