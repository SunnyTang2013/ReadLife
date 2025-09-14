import React, { useState, useEffect, useCallback } from 'react';

import { debounce } from 'lodash';
import Autosuggest from 'react-autosuggest';

import jobGroupService from '../../backend/jobGroupService';


const JobGroupAutosuggest = ({ defaultJobGroupId = null, allowsClear = false, onChange }) => {
  const [jobGroupList, setJobGroupList] = useState(null);
  const [currentValue, setCurrentValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    _loadJobGroupList();
  }, [defaultJobGroupId]);

  /**
   * Callback when autosuggest needs to update suggestions. Given the value as a keyword and the
   * current config group category, this function fetches a list of config group objects from
   * server and updates the current suggestions.
   */
  const onSuggestionsFetchRequested = useCallback(
    debounce(({ value }) => {
      const keyword = value.trim().toLowerCase();
      if (!keyword) {
        setSuggestions([]);
        return;
      }

      if (jobGroupList && Array.isArray(jobGroupList)) {
        const newSuggestions = jobGroupList.filter((jobGroup) => {
          const cleanedJobGroupName = jobGroup.name.toLowerCase();
          return cleanedJobGroupName.indexOf(keyword) >= 0;
        });
        setSuggestions(newSuggestions);
      }
    }, 300),
    [jobGroupList]
  );

  const onSuggestionsClearRequested = () => {
    setSuggestions([]);
  };

  const onSuggestionSelected = (event, { suggestion }) => {
    if (suggestion) {
      onChange(suggestion);
    }
  };

  /**
   * Given an object in Autosuggest's suggestion list, this function renders it to HTML.
   */
  const onRenderSuggestion = (jobGroup) => {
    const jobGroupName = jobGroup.name;
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
  };

  const onChangeCurrentValue = (event, { newValue }) => {
    setCurrentValue(newValue);
  };

  const onClearCurrentValue = () => {
    if (!allowsClear) {
      return;
    }
    setCurrentValue('');
    setSuggestions([]);
    onChange(null);
  };

  const _loadJobGroupList = () => {
    jobGroupService.getJobGroupList()
      .then((jobGroupList) => {
        const suggestions = jobGroupList.filter(item => item.id === Number(defaultJobGroupId));
        let currentValue = '';
        if (suggestions && suggestions.length > 0) {
          currentValue = suggestions[0].name;
        }
        setJobGroupList(jobGroupList);
        setCurrentValue(currentValue);
        setSuggestions(suggestions);
      })
      .catch((error) => {
        setJobGroupList(error);
      });
  };

  if (jobGroupList === null) {
    return <input className="form-control" type="text" placeholder="Loading job groups..." readOnly />;
  }

  if (jobGroupList instanceof Error) {
    return (
      <div className="alert alert-danger">
        <i className="fa fa-fw fa-exclamation-triangle" />
        {' Fail to load job groups.'}
      </div>
    );
  }

  let $clearButton = null;
  if (allowsClear) {
    $clearButton = (
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
    placeholder: 'Type a job group name',
    value: currentValue,
    onChange: onChangeCurrentValue,
  };

  return (
    <div>
      <Autosuggest 
        suggestions={suggestions} 
        onSuggestionsFetchRequested={onSuggestionsFetchRequested} 
        onSuggestionsClearRequested={onSuggestionsClearRequested} 
        onSuggestionSelected={onSuggestionSelected} 
        renderSuggestion={onRenderSuggestion} 
        getSuggestionValue={suggestion => suggestion.name} 
        inputProps={inputProps} 
      />
      {$clearButton}
    </div>
  );
};

export default JobGroupAutosuggest;