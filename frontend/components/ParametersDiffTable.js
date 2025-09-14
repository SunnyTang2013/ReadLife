import React from 'react';
import PropTypes from 'prop-types';

import { isEqual } from 'lodash';

import ScorchPropTypes from '../proptypes/scorch';
import { sortCaseInsensitive } from '../utils/utilities';


/**
 * This component renders an HTML table to compare two sets of parameters.
 */
export default function ParametersDiffTable({ left, right }) {
  const parameterNames = sortCaseInsensitive(Object.keys(
    Object.assign({}, left.parameters.entries, right.parameters.entries),
  ));
  const $parameterRows = parameterNames.map((name) => {
    const leftValue = left.parameters.entries[name];
    const rightValue = right.parameters.entries[name];
    let rowClassName = '';
    if (leftValue !== rightValue) {
      rowClassName = 'bg-highlight';
    }
    return (
      <tr key={`parameter-${name}`} className={rowClassName}>
        <td className="text-code">{name}</td>
        <td className="text-code">{leftValue || '(N/A)'}</td>
        <td className="text-code">{rightValue || '(N/A)'}</td>
      </tr>
    );
  });

  let $alert = null;
  if (isEqual(left.parameters, right.parameters)) {
    $alert = (
      <div className="alert alert-success">
        <i className="fa fa-fw fa-check mr-1" />
        No difference between left side and right side.
      </div>
    );
  } else {
    $alert = (
      <div className="alert alert-warning">
        <i className="fa fa-fw fa-info-circle mr-1" />
        Left side and right side are different.
      </div>
    );
  }

  return (
    <div>
      {$alert}
      <table className="table table-fixed">
        <thead>
          <tr>
            <th style={{ width: '20%' }}>Name</th>
            <th style={{ width: '40%' }}>{left.label}</th>
            <th style={{ width: '40%' }}>{right.label}</th>
          </tr>
        </thead>
        <tbody>
          {$parameterRows}
        </tbody>
      </table>
    </div>
  );
}


ParametersDiffTable.propTypes = {
  left: PropTypes.shape({
    label: PropTypes.string.isRequired,
    parameters: ScorchPropTypes.parameters().isRequired,
  }).isRequired,
  right: PropTypes.shape({
    label: PropTypes.string.isRequired,
    parameters: ScorchPropTypes.parameters().isRequired,
  }).isRequired,
};
