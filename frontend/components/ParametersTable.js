import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { cloneDeep, isEqual } from 'lodash';
import ScorchPropTypes from '../proptypes/scorch';
import { sortCaseInsensitive } from '../utils/utilities';
import AutoGrowTextarea from './AutoGrowTextarea';

function replaceLineBreaks(str) {
  return (str || '').replace(/[\n\r]/g, ' ');
}

/**
 * This component renders an HTML table for the given parameters. The parameters should be a JSON
 * representation of the `Parameters` Java class, containing an `entries` property with key-value
 * pairs.
 *
 * The table is either editable or read-only, depending on whether an `onChange` callback is passed
 * in. The `onChange` function will be called with a **copy** of the latest `parameters` object,
 * every time a change happens (adding, updating, or deleting of a parameter).
 */
function ParametersTable({ parameters: propParameters, onChange }) {
  const [parameters, setParameters] = useState(() => cloneDeep(propParameters));
  const [pendingParameter, setPendingParameter] = useState({ name: '', value: '' });

  // Update internal state when props change
  useEffect(() => {
    if (!isEqual(propParameters, parameters)) {
      setParameters(cloneDeep(propParameters));
    }
  }, [propParameters, parameters]);

  const onChangeParameter = useCallback((event) => {
    if (!onChange) {
      return;
    }
    const { name, value } = event.target;
    setParameters((prevParameters) => {
      const newParameters = cloneDeep(prevParameters);
      newParameters.entries[name] = replaceLineBreaks(value);
      return newParameters;
    });
  }, [onChange]);

  // Call onChange after parameters state update
  useEffect(() => {
    if (onChange) {
      onChange(cloneDeep(parameters));
    }
  }, [parameters, onChange]);

  const onDeleteParameter = useCallback((name) => {
    if (!onChange) {
      return;
    }
    setParameters((prevParameters) => {
      const newParameters = cloneDeep(prevParameters);
      delete newParameters.entries[name];
      return newParameters;
    });
  }, [onChange]);

  const onChangePendingParameter = useCallback((event) => {
    if (!onChange) {
      return;
    }
    const { name, value } = event.target;
    setPendingParameter((prevPending) => {
      const newPending = Object.assign({}, prevPending);
      newPending[name] = replaceLineBreaks(value);
      return newPending;
    });
  }, [onChange]);

  const onKeyPressForPendingParameter = useCallback((event) => {
    if (event.key === 'Enter') {
      // Pressing the 'Enter' key will add the pending parameter if possible.
      event.preventDefault();
      onAddPendingParameter();
    }
  }, []);

  const onAddPendingParameter = useCallback(() => {
    if (!onChange) {
      return;
    }
    const { name, value } = pendingParameter;
    // Empty parameter name is not allowed.
    if (!name || !name.trim()) {
      return;
    }
    setParameters((prevParameters) => {
      const newParameters = cloneDeep(prevParameters);
      newParameters.entries[name.trim()] = value.trim();
      return newParameters;
    });
    setPendingParameter({ name: '', value: '' }); // Reset pending parameter after add.
  }, [onChange, pendingParameter]);

  // If no `onChange` callback is provided, the parameters table is considered read-only.
  const readonly = !onChange;

  const parameterNames = sortCaseInsensitive(Object.keys(parameters.entries));
  const $parameterRows = parameterNames.map((name) => {
    const value = parameters.entries[name];
    let $valueCell = null;
    let $buttonCell = null;
    if (readonly) {
      $valueCell = (
        <td className="text-code" style={{ whiteSpace: 'pre-wrap' }}>
          {value}
        </td>
      );
    } else {
      $valueCell = (
        <td>
          <AutoGrowTextarea
            className="form-control"
            name={name}
            placeholder="Value"
            value={value}
            onChange={onChangeParameter}
          />
        </td>
      );
      $buttonCell = (
        <td className="text-nowrap">
          <button
            className="anchor text-muted"
            type="button"
            title="Delete this parameter"
            onClick={() => onDeleteParameter(name)}
          >
            <i className="fa fa-fw fa-trash" />
          </button>
        </td>
      );
    }
    return (
      <tr key={`parameter-${name}`}>
        <td className="text-code">{name}</td>
        {$valueCell}
        {$buttonCell}
      </tr>
    );
  });

  let $pendingParameterRow = null;
  if (!readonly) {
    $pendingParameterRow = (
      <tr>
        <td>
          <input
            className="form-control"
            name="name"
            placeholder="Name"
            value={pendingParameter.name}
            onKeyPress={onKeyPressForPendingParameter}
            onChange={onChangePendingParameter}
          />
        </td>
        <td>
          <AutoGrowTextarea
            className="form-control"
            name="value"
            placeholder="Value"
            value={pendingParameter.value}
            onKeyPress={onKeyPressForPendingParameter}
            onChange={onChangePendingParameter}
          />
        </td>
        <td className="text-nowrap">
          <button
            type="button"
            className="btn btn-primary btn-light-primary"
            onClick={onAddPendingParameter}
          >
            <i className="fa fa-fw fa-plus" />
          </button>
        </td>
      </tr>
    );
  }

  return (
    <table className="table table-striped table-fixed my-0">
      <thead>
        <tr>
          <th style={{ width: '25%' }}>Name</th>
          <th style={{ width: '35%' }}>Value</th>
          {!readonly && (
            <th style={{ width: '10%' }}>{' '}</th>
          )}
        </tr>
      </thead>
      <tbody>
        {$parameterRows}
        {$pendingParameterRow}
      </tbody>
    </table>
  );
}

ParametersTable.propTypes = {
  parameters: ScorchPropTypes.parameters().isRequired,
  onChange: PropTypes.func,
};

ParametersTable.defaultProps = {
  onChange: null,
};

export default ParametersTable;