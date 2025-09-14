import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { cloneDeep, isEqual } from 'lodash';
import ScorchPropTypes from '../proptypes/scorch';
import AutoGrowTextarea from './AutoGrowTextarea';

function replaceLineBreaks(str) {
  return (str || '').replace(/[\n\r]/g, ' ');
}

function getMaxSeq(rules) {
  if (!rules || rules.length === 0) {
    return 0;
  }

  let maxSeq = 0;
  if (typeof rules[0].seq === 'string') {
    maxSeq = parseInt(rules[0].seq, 10);
  }
  rules.forEach(rule => {
    if (typeof rule.seq === 'string') {
      const seq = parseInt(rule.seq, 10);
      if (seq > maxSeq) {
        maxSeq = seq;
      }
    } else if (typeof rule.seq === 'number' && rule.seq > maxSeq) {
      maxSeq = rule.seq;
    }
  });
  return maxSeq;
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
const RulesTable = ({ rules: propsRules, onChange }) => {
  const [rules, setRules] = useState(() => cloneDeep(propsRules));
  const [pendingRule, setPendingRule] = useState({ rule: '', enable: 'Y', errorFrom: 'GCP', seq: 0 });

  useEffect(() => {
    if (!isEqual(propsRules, rules)) {
      setRules(cloneDeep(propsRules));
    }
  }, [propsRules, rules]);

  const onChangeRules = useCallback((seq, event) => {
    if (!onChange) {
      return;
    }
    const { name, value } = event.target;
    setRules((prevRules) => {
      const newRules = cloneDeep(prevRules);
      const index = newRules.indexOf(newRules.find(rule => rule.seq === seq));
      const existingRule = newRules[index];
      existingRule[name] = replaceLineBreaks(value);
      newRules[index] = existingRule;
      onChange(cloneDeep(newRules));
      return newRules;
    });
  }, [onChange]);

  const onChangeEnable = useCallback((event) => {
    if (!onChange) {
      return;
    }
    const { name, value } = event.target;
    setRules((prevRules) => {
      const newRules = cloneDeep(prevRules);
      let seq = name;
      if (typeof name === 'string') {
        seq = parseInt(name, 10);
      }
      const index = newRules.indexOf(newRules.find(rule => rule.seq === seq));
      const existingRule = newRules[index];
      existingRule.rule = replaceLineBreaks(value);
      newRules[index] = existingRule;
      onChange(cloneDeep(newRules));
      return newRules;
    });
  }, [onChange]);

  const onDeleteRule = useCallback((seq) => {
    if (!onChange) {
      return;
    }
    setRules((prevRules) => {
      const newRules = cloneDeep(prevRules);
      const filteredRules = newRules.filter(rule => rule.seq !== seq);
      onChange(cloneDeep(filteredRules));
      return filteredRules;
    });
  }, [onChange]);

  const onChangePendingRule = useCallback((event) => {
    if (!onChange) {
      return;
    }
    const { name, value } = event.target;
    setPendingRule((prevPendingRule) => {
      const newPendingRule = Object.assign({}, prevPendingRule);
      newPendingRule[name] = replaceLineBreaks(value);
      return newPendingRule;
    });
  }, [onChange]);

  const onKeyPressForPendingRule = useCallback((event) => {
    if (event.key === 'Enter') {
      // Pressing the 'Enter' key will add the pending parameter if possible.
      event.preventDefault();
      onAddPendingRule();
    }
  }, []);

  const onAddPendingRule = useCallback(() => {
    if (!onChange) {
      return;
    }
    // Empty rule is not allowed.
    if (!pendingRule.rule.trim()) {
      return;
    }

    if (rules.some(r => r.rule === pendingRule.rule.trim())) {
      return;
    }

    const maxSeq = getMaxSeq(rules);
    const newRule = { 
      rule: pendingRule.rule.trim(),
      enable: pendingRule.enable,
      seq: maxSeq + 1 
    };
    const newRules = [...rules, newRule];
    const newPendingRule = { rule: '', enable: 'Y', seq: 0 }; // Reset pending parameter after add.
    
    setRules(newRules);
    setPendingRule(newPendingRule);
    onChange(cloneDeep(newRules));
  }, [onChange, pendingRule, rules]);

  // If no `onChange` callback is provided, the parameters table is considered read-only.
  const readonly = !onChange;

  const $ruleRows = rules.map((rule) => {
    let $valueCell = null;
    let $errFromCell = null;
    let $enableCell = null;
    let $buttonCell = null;
    if (readonly) {
      $valueCell = (
        <td className="text-code" style={{ whiteSpace: 'pre-wrap' }}>
          {rule.rule}
        </td>
      );
    } else {
      $valueCell = (
        <td>
          <AutoGrowTextarea
            className="form-control"
            name="rule"
            placeholder="Value"
            value={rule.rule}
            onChange={event => onChangeRules(rule.seq, event)}
          />
        </td>
      );
      $errFromCell = (
        <td>
          <select
            id="job-config-group-category"
            className="form-control"
            value={rule.errorFrom || 'Y'}
            name="errorFrom"
            onChange={event => onChangeRules(rule.seq, event)}
          >
            <option value="GCP">GCP</option>
            <option value="SCORCH">SCORCH</option>
          </select>
        </td>
      );
      $enableCell = (
        <td>
          <select
            id="job-config-group-category"
            className="form-control"
            value={rule.enable || 'Y'}
            name="enable"
            onChange={event => onChangeRules(rule.seq, event)}
          >
            <option value="Y">YES</option>
            <option value="N">No</option>
          </select>
        </td>
      );
      $buttonCell = (
        <td className="text-nowrap">
          <button
            className="anchor text-muted"
            type="button"
            title="Delete this parameter"
            onClick={() => onDeleteRule(rule.seq)}
          >
            <i className="fa fa-fw fa-trash" />
          </button>
        </td>
      );
    }
    return (
      <tr key={`parameter-${rule.seq}`}>
        {$valueCell}
        {$errFromCell}
        {$enableCell}
        {$buttonCell}
      </tr>
    );
  });

  let $pendingRuleRow = null;
  if (!readonly) {
    $pendingRuleRow = (
      <tr>
        <td>
          <AutoGrowTextarea
            className="form-control"
            name="rule"
            placeholder="Rule"
            value={pendingRule.rule || ''}
            onKeyPress={onKeyPressForPendingRule}
            onChange={onChangePendingRule}
          />
        </td>
        <td>
          <select
            id="ChangePendingRuleEnableErrorFrom"
            className="form-control"
            value={pendingRule.errorFrom || 'SCORCH'}
            name="errorFrom"
            onChange={event => onChangePendingRule(event)}
          >
            <option value="GCP">GCP</option>
            <option value="SCORCH">SCORCH</option>
          </select>
        </td>
        <td>
          <select
            id="ChangePendingRuleEnable"
            className="form-control"
            value={pendingRule.enable || 'Y'}
            name="enable"
            onChange={event => onChangePendingRule(event)}
          >
            <option value="Y">Yes</option>
            <option value="N">No</option>
          </select>
        </td>
        <td className="text-nowrap">
          <button
            type="button"
            className="btn btn-primary btn-light-primary"
            onClick={onAddPendingRule}
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
          <th style={{ width: '25%' }}>Rule</th>
          <th style={{ width: '35%' }}>Error From</th>
          <th style={{ width: '35%' }}>Enable</th>
          {!readonly && (
            <th style={{ width: '10%' }}>{' '}</th>
          )}
        </tr>
      </thead>
      <tbody>
        {$ruleRows}
        {$pendingRuleRow}
      </tbody>
    </table>
  );
};

RulesTable.propTypes = {
  rules: PropTypes.arrayOf(ScorchPropTypes.resubmissionRule()).isRequired,
  onChange: PropTypes.func,
};

RulesTable.defaultProps = {
  onChange: null,
};

export default RulesTable;