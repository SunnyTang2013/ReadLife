import React, { useState, useEffect, useCallback } from 'react';
import { cloneDeep, debounce } from 'lodash';
import Autosuggest from 'react-autosuggest';

import batchService from '../../backend/batchService';
import configGroupService from '../../backend/configurations';
import { getJobConfigCategoriesByType } from '../../utils/constants';
import { sortCaseInsensitive } from '../../utils/utilities';

const OriginalDefinitionBlock = ({ type, categoryName, batchTypeName, onChangeType, onChangeCategory, onChangeOriginalId }) => {
  // State variables
  const [currentType, setCurrentType] = useState(cloneDeep(type));
  const [currentCategory, setCurrentCategory] = useState(cloneDeep(categoryName));
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [currentSuggestions, setCurrentSuggestions] = useState([]);
  const [autosuggestStatus, setAutosuggestStatus] = useState('');

  // Load initial data on mount
  useEffect(() => {
    loadCurrentType();
  }, [loadCurrentType]);

  // Function to load current type data
  const loadCurrentType = useCallback(() => {
    if ((type && type === 'FUNCTIONAL_CONFIG_GROUP') && batchTypeName) {
      configGroupService.findJobConfigGroupList(categoryName, batchTypeName)
        .then((results) => {
          let status = null;
          if (results.length === 0) {
            status = 'No results found.';
          } else {
            status = `Showing ${results.length} results.`;
          }
          setCurrentSuggestions(results);
          setCurrentKeyword(batchTypeName);
          setAutosuggestStatus(status);
        });
    } else if (type && batchTypeName) {
      batchService.findJobGroupList(type, batchTypeName)
        .then((results) => {
          let status = null;
          if (results.length === 0) {
            status = 'No results found.';
          } else {
            status = `Showing ${results.length} results.`;
          }
          setCurrentSuggestions(results);
          setCurrentKeyword(batchTypeName);
          setAutosuggestStatus(status);
        });
    }
  }, [type, categoryName, batchTypeName]);

  // Event handler for type selection
  const onSelectType = useCallback((event) => {
    const nextType = event.target.value;
    if (nextType !== currentType) {
      setCurrentType(nextType);
      setCurrentKeyword('');
      setCurrentSuggestions([]);
      onChangeType(nextType);
    }
  }, [currentType, onChangeType]);

  // Event handler for config group category selection
  const onSelectConfigGroupCategory = useCallback((event) => {
    const nextCategory = event.target.value;
    if (nextCategory !== currentCategory) {
      setCurrentCategory(nextCategory);
      setCurrentKeyword('');
      setCurrentSuggestions([]);
      onChangeCategory(nextCategory);
    }
  }, [currentCategory, onChangeCategory]);

  // Autosuggest change value handler
  const autosuggestOnChangeValue = useCallback((event, { newValue }) => {
    if (!currentType) {
      return;
    }
    setCurrentKeyword(newValue);
  }, [currentType]);

  // Autosuggest fetch handler with debouncing
  const autosuggestOnFetch = useCallback(
    debounce(({ value }) => {
      if (!currentType) {
        return;
      }

      setAutosuggestStatus(`Searching ${currentType} ...`);
      
      if (currentType === 'FUNCTIONAL_CONFIG_GROUP') {
        if (currentCategory) {
          configGroupService.findJobConfigGroupList(currentCategory, value)
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
      } else {
        batchService.findJobGroupList(currentType, value)
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
    }, 300),
    [currentType, currentCategory]
  );

  // Autosuggest clear handler
  const autosuggestOnClear = useCallback(() => {
    // Do nothing. TODO: What is the right usage of this function?
  }, []);

  // Get suggestion value for autosuggest
  const autosuggestGetSuggestionValue = useCallback((batch) => {
    onChangeOriginalId(batch.id, batch.name);
    return batch.name;
  }, [onChangeOriginalId]);

  // Render suggestion for autosuggest
  const autosuggestRenderSuggestion = useCallback((batch) => {
    const index = batch.name.indexOf(currentKeyword);
    if (index < 0) {
      return <div>{batch.name}</div>;
    }
    const prefix = batch.name.substr(0, index);
    const suffix = batch.name.substr(index + currentKeyword.length);
    return (
      <div>
        {prefix}
        <strong>{currentKeyword}</strong>
        {suffix}
      </div>
    );
  }, [currentKeyword]);


  // Render editor function
  const renderEditor = useCallback(() => {
    // Check if editing is enabled.
    if (onChangeType === null || onChangeOriginalId === null) {
      return null;
    }

    const typeList = ['HIERARCHY', 'LABEL', 'CONTEXT', 'CRITERIA', 'BATCH', 'FUNCTIONAL_CONFIG_GROUP'];
    const $typeOptions = typeList.map(type =>
      <option key={type} value={type}>{type}</option>
    );
    $typeOptions.unshift(
      <option key="" value="">----</option>
    );

    const categoriesByType = getJobConfigCategoriesByType();
    const groupCategories = [...categoriesByType.functional];
    const $categoryOptions = sortCaseInsensitive(groupCategories).map(category =>
      <option key={category} value={category}>{category}</option>
    );
    $categoryOptions.unshift(
      <option key="" value="">----</option>
    );

    let autosuggestPlaceholder = null;
    let autosuggestDisabled = false;
    if (currentType) {
      autosuggestPlaceholder = `Type a ${currentType} name with "%" or "_" for wildcard`;
      autosuggestDisabled = false;
    } else {
      autosuggestPlaceholder = 'Please select a type first.';
      autosuggestDisabled = true;
    }
    const autosuggestInputProps = {
      placeholder: autosuggestPlaceholder,
      disabled: autosuggestDisabled,
      value: currentKeyword,
      onChange: autosuggestOnChangeValue,
    };
    const showFilterJobConfigGroup = currentType === 'FUNCTIONAL_CONFIG_GROUP' ? {} : { display: 'none' };

    return (
      <div className="row">
        <div className="form-group col-6">
          <label htmlFor="batch-detail-select-type" className="col-form-label">
            Type
          </label>
          <div>
            <select
              id="batch-detail-select-type"
              className="form-control"
              value={currentType || ''}
              onChange={onSelectType}
            >
              {$typeOptions}
            </select>
          </div>
        </div>

        <div className="form-group col-6" style={showFilterJobConfigGroup}>
          <label htmlFor="batch-detail-select-category" className="col-form-label">
            Category
          </label>
          <div>
            <select
              id="batch-detail-select-category"
              className="form-control"
              value={currentCategory || ''}
              onChange={onSelectConfigGroupCategory}
            >
              {$categoryOptions}
            </select>
          </div>
        </div>

        <div className="form-group col-6">
          <label htmlFor="batch-detail-source-name">
            Original Definition
          </label>
          <div>
            <Autosuggest 
              id="batch-detail-source-name" 
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
      </div>
    );
  }, [currentType, currentCategory, currentKeyword, currentSuggestions, autosuggestStatus, onChangeType, onChangeOriginalId, onSelectType, onSelectConfigGroupCategory, autosuggestOnChangeValue, autosuggestOnFetch, autosuggestOnClear, autosuggestGetSuggestionValue, autosuggestRenderSuggestion]);

  // Main component render
  const $editor = renderEditor();
  return <div>{$editor}</div>;
};

export default OriginalDefinitionBlock;