import React from 'react';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';
import Autosuggest from 'react-autosuggest';

import batchService from '../../backend/batchService';

export default class OriginalDefinitionBlock extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // Currently selected job group or label.
      currentType: '',

      // Current job group/label keyword shown in the autosuggest input.
      currentKeyword: '',

      // Current job group/label suggestions for the selected type. Each item in the array is
      // an object of type `JobGroupSummary`.
      currentSuggestions: [],

      // Current status text shown below the autosuggest input.
      autosuggestStatus: '',
    };

    this.onSelectType = this.onSelectType.bind(this);
    this.autosuggestOnChangeValue = this.autosuggestOnChangeValue.bind(this);
    this.autosuggestOnFetch = debounce(this.autosuggestOnFetch.bind(this), 300);
    this.autosuggestOnClear = this.autosuggestOnClear.bind(this);
    this.autosuggestGetSuggestionValue = this.autosuggestGetSuggestionValue.bind(this);
    this.autosuggestRenderSuggestion = this.autosuggestRenderSuggestion.bind(this);
  }

  onSelectType(event) {
    const currentType = this.state.currentType;
    const nextType = event.target.value;
    if (nextType !== currentType) {
      this.setState({
        currentType: nextType,
        currentKeyword: '',
        currentSuggestions: [],
      }, this.props.onChangeType(nextType));
    }
  }

  autosuggestOnChangeValue(event, { newValue }) {
    if (!this.state.currentType) {
      return;
    }
    this.setState({
      currentKeyword: newValue,
    });
  }

  /**
   * Callback when autosuggest needs to update suggestions. Given the value as a keyword and the
   * current type, this function fetches a list of job group objects from
   * server and updates the current suggestions.
   */
  autosuggestOnFetch({ value }) {
    const currentType = this.state.currentType;
    if (!currentType) {
      return;
    }

    this.setState({
      autosuggestStatus: `Searching ${currentType} ...`,
    });
    batchService.findJobGroupList(currentType, value)
      .then((results) => {
        let autosuggestStatus = null;
        if (results.length === 0) {
          autosuggestStatus = 'No results found.';
        } else {
          autosuggestStatus = `Showing ${results.length} results.`;
        }
        this.setState({
          currentSuggestions: results,
          autosuggestStatus: autosuggestStatus,
        });
      });
  }

  /**
   * Callback when autosuggest needs to clear suggestions.
   */
  autosuggestOnClear() {
    console.log(this.state);
    // Do nothing. TODO: What is the right usage of this function?
  }

  /**
   * Given an object in the current suggestions, this function extracts and returns the input value
   * of the suggestion. The returned value is a plain string.
   */
  autosuggestGetSuggestionValue(batch) {
    this.props.onChangeOriginalId(batch.id, batch.name);
    return batch.name;
  }

  /**
   * Given an object in the current suggestions, this function renders it to HTML.
   */
  autosuggestRenderSuggestion(batch) {
    const keyword = this.state.currentKeyword;
    const index = batch.name.indexOf(keyword);
    if (index < 0) {
      return <div>{batch.name}</div>;
    }
    const prefix = batch.name.substr(0, index);
    const suffix = batch.name.substr(index + keyword.length);
    return (
      <div>{prefix}<strong>{keyword}</strong>{suffix}</div>
    );
  }

  _renderEditor() {
    // Check if editing is enabled.
    if (this.props.onChangeType === null || this.props.onChangeOriginalId === null) {
      return null;
    }

    const {
      currentType,
      currentKeyword,
      currentSuggestions,
      autosuggestStatus,
    } = this.state;

    const typeList = ['HIERARCHY', 'LABEL', 'CONTEXT'];
    const $typeOptions = typeList.map(type => (
      <option key={type} value={type}>
        {type}
      </option>
    ));
    $typeOptions.unshift((
      <option key="" value="">----</option>
    ));

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
      onChange: this.autosuggestOnChangeValue,
    };

    return (
      <div className="form-group row">
        <label htmlFor="batch-detail-select-type col-form-label" className="col-1 col-form-label">Type</label>
        <div className="col-2">
          <select
            id="batch-detail-select-type"
            className="form-control"
            value={currentType}
            onChange={this.onSelectType}
          >
            {$typeOptions}
          </select>
        </div>

        <label htmlFor="batch-detail-source-name" className="col-1 text-right col-form-label">
          Original_Definition
        </label>
        <div className="col-5">
          <Autosuggest
            id="batch-detail-source-name"
            suggestions={currentSuggestions || []}
            onSuggestionsFetchRequested={this.autosuggestOnFetch}
            onSuggestionsClearRequested={this.autosuggestOnClear}
            getSuggestionValue={this.autosuggestGetSuggestionValue}
            renderSuggestion={this.autosuggestRenderSuggestion}
            inputProps={autosuggestInputProps}
          />
          <small className="form-text text-muted">{autosuggestStatus}</small>
        </div>
        <div className="col-2">
          <button className="btn btn-outline-primary" type="button" onClick={this.props.onSearchJobs}>
            Search Jobs
          </button>
        </div>
      </div>
    );
  }

  render() {
    const $editor = this._renderEditor();
    return (
      <div>
        {$editor}
      </div>
    );
  }
}


OriginalDefinitionBlock.propTypes = {
  onChangeType: PropTypes.func.isRequired,
  onSearchJobs: PropTypes.func.isRequired,
  onChangeOriginalId: PropTypes.func.isRequired,
};

// endregion
