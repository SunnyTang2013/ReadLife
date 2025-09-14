import React, { useState, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import Autosuggest from 'react-autosuggest';

// Static property to store job list
let jobList = [];

const shouldRenderSuggestions = () => {
  return true;
};

const JobAutosuggest = ({ allowsClear = false, onChange }) => {
  const [currentValue, setCurrentValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const onSuggestionsFetchRequested = useMemo(() => 
    debounce(({ value }) => {
      const keyword = value.trim().toLowerCase();
      if (!keyword) {
        setSuggestions([]);
        return;
      }

      const filteredSuggestions = jobList.filter((job) => {
        const cleanedJobName = job.name.toLowerCase();
        return cleanedJobName.indexOf(keyword) >= 0;
      });

      if (filteredSuggestions.length === 0 && keyword.length > 0) {
        setSuggestions([{ isAddNew: true }]);
        return;
      }
      
      if (keyword.length > 0 && !jobList.find(job => job.name.toLowerCase() === keyword)) {
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
      if (suggestion.isAddNew) {
        const newOption = { name: currentValue, id: currentValue };
        jobList.push(newOption);
        onChange(newOption);
      } else {
        onChange(suggestion);
      }
    }
  }, [currentValue, onChange]);

  const onRenderSuggestion = useCallback((job) => {
    if (job.isAddNew) {
      return (
        <span>
          [+] Add new: 
          <strong>{currentValue}</strong>
        </span>
      );
    }
    
    const jobName = job.name;
    const index = jobName.indexOf(currentValue);
    if (index < 0) {
      return <div>{jobName}</div>;
    }
    
    const prefix = jobName.substr(0, index);
    const suffix = jobName.substr(index + currentValue.length);
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

  if (jobList === null) {
    return <input className="form-control" type="text" placeholder="Loading job ..." readOnly />;
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
    placeholder: 'Type a job name',
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

// Export static property access
JobAutosuggest.jobList = jobList;

export default JobAutosuggest;