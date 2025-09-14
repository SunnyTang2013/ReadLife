import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { cloneDeep, isEqual } from 'lodash';
import AutoGrowTextarea from './AutoGrowTextarea';

// Helper function extracted outside component
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
const ValuesTable = ({ values, onChange, valueTitle }) => {
  const [parameters, setParameters] = useState([...values]);
  const [pendingParameter, setPendingParameter] = useState('');

  // Update parameters when props.values changes
  useEffect(() => {
    if (!isEqual(values, parameters)) {
      setParameters([...values]);
    }
  }, [values, parameters]);

  const onChangeParameter = useCallback((event) => {
    if (!onChange) {
      return;
    }
    const { name, value } = event.target;
    setParameters((prevParameters) => {
      const newParameters = cloneDeep(prevParameters);
      newParameters.entries[name] = replaceLineBreaks(value);
      // Call onChange with the updated parameters
      onChange(cloneDeep(newParameters));
      return newParameters;
    });
  }, [onChange]);

  const onDeleteParameter = useCallback((name) => {
    if (!onChange) {
      return;
    }
    setParameters((prevParameters) => {
      const itemIndex = prevParameters.indexOf(name);
      if (itemIndex !== -1) {
        const parametersCopy = [...prevParameters];
        parametersCopy.splice(itemIndex, 1);
        // Call onChange with the updated parameters
        onChange(cloneDeep(parametersCopy));
        return parametersCopy;
      }
      return prevParameters;
    });
  }, [onChange]);

  const onChangePendingParameter = useCallback((event) => {
    if (!onChange) {
      return;
    }
    const { value } = event.target;
    setPendingParameter(replaceLineBreaks(value));
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
    setParameters((prevParameters) => {
      const value = pendingParameter;
      const newParameters = cloneDeep(prevParameters);
      newParameters.push(value);
      // Call onChange with the updated parameters
      onChange(cloneDeep(newParameters));
      return newParameters;
    });
    setPendingParameter(''); // Reset pending parameter after add
  }, [onChange, pendingParameter]);

  // If no `onChange` callback is provided, the parameters table is considered read-only.
  const readonly = !onChange;

  const $parameterRows = parameters.map((name) => {
    let $valueCell = null;
    let $buttonCell = null;
    if (readonly) {
      $valueCell = (
        <td className="text-code" style={{ whiteSpace: 'pre-wrap' }}>
          {name}
        </td>
      );
    } else {
      $valueCell = (
        <td>
          <AutoGrowTextarea
            className="form-control"
            name={name}
            placeholder="Value"
            value={name}
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
          <AutoGrowTextarea
            className="form-control"
            name="value"
            placeholder="Value"
            value={pendingParameter}
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
          <th style={{ width: '60%' }}>{valueTitle}</th>
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
};

ValuesTable.propTypes = {
  valueTitle: PropTypes.string,
  values: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func,
};

ValuesTable.defaultProps = {
  valueTitle: 'Value',
  onChange: null,
  values: [],
};

export default ValuesTable;