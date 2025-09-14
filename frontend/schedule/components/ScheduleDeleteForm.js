import React, { useState, useEffect, useCallback } from 'react';
import { cloneDeep } from 'lodash';
import Alert from '../../components/Alert';
import CronDoc from './CronDoc';

import ReleaseVerifyFunction from './ReleaseVerifyFunction';

function getInputStyle(schedule) {
  const validStyle = {
    scheduleName: ReleaseVerifyFunction.getInValidStyle(),
    cronExpression: ReleaseVerifyFunction.getInValidStyle(),
  };
  if (schedule.jobName) {
    validStyle.scheduleName = ReleaseVerifyFunction.getValidStyle();
  }
  if (schedule.cronExpression) {
    validStyle.cronExpression = ReleaseVerifyFunction.getValidStyle();
  }
  return validStyle;
}

const ScheduleDeleteForm = ({ schedule, onAdd, updateFlag, disabled = false, methods }) => {
  const [input, setInput] = useState(schedule);
  const [errorMessage, setErrorMessage] = useState(null);
  const [validStyle, setValidStyle] = useState({
    scheduleName: ReleaseVerifyFunction.getInValidStyle(),
    cronExpression: ReleaseVerifyFunction.getInValidStyle(),
  });

  const clearAndLoad = useCallback(() => {
    setInput(schedule);
    setErrorMessage(null);
    setValidStyle(getInputStyle(schedule));
  }, [schedule]);

  useEffect(() => {
    clearAndLoad();
  }, [clearAndLoad]);

  const onChangeScheduleProperty = useCallback((name, event) => {
    const value = event.target.value;
    setInput(prevInput => {
      const newInput = cloneDeep(prevInput);
      newInput[name] = value;
      return newInput;
    });
    setErrorMessage(null);
    setValidStyle(prevValidStyle => 
      ReleaseVerifyFunction.verifyFieldValue(name, value, prevValidStyle)
    );
  }, []);

  const onChangeParameters = useCallback((overrideParameters) => {
    setInput(prevInput => ({
      ...prevInput,
      overrideParameters
    }));
  }, []);

  const handleAdd = useCallback((event) => {
    event.preventDefault();
    const inputData = cloneDeep(input);
    if (!inputData.jobName) {
      setErrorMessage('Please input a job to run.');
      return;
    }
    if (!inputData.method || !inputData.cronExpression) {
      setErrorMessage('Please choose method and fulfill schedule.');
      return;
    }
    onAdd(inputData);
  }, [input, onAdd]);

  const onSwitchSkipConcurrentRun = useCallback((event) => {
    const skipConcurrentRun = event.target.checked;
    setInput(prevInput => {
      const newInput = cloneDeep(prevInput);
      newInput.skipConcurrentRun = skipConcurrentRun;
      return newInput;
    });
  }, []);

  const onSwitchPriorityRun = useCallback((event) => {
    const priorityRun = event.target.checked;
    setInput(prevInput => {
      const newInput = cloneDeep(prevInput);
      newInput.priorityRun = priorityRun;
      return newInput;
    });
  }, []);

  const methodToTipMap = methods;

  return React.createElement('form', { className: 'my-2' },
    React.createElement('fieldset', { disabled },
      React.createElement('section', null,
        React.createElement('h5', { className: 'display-7' }, 'Input Change Entity'),
        React.createElement('div', { className: 'row' },
          React.createElement('div', { className: 'col' },
            React.createElement('div', { className: `form-group ${validStyle.scheduleName.success}` },
              React.createElement('label', { htmlFor: 'schedule-name' }, 'Schedule Name'),
              React.createElement('input', {
                id: 'schedule-name',
                className: `form-control ${validStyle.scheduleName.valid}`,
                type: 'text',
                disabled: updateFlag,
                placeholder: 'Job Group or Job Name, eg.ON_LONDON_RISK_PRIORITY_1',
                value: input.jobName,
                onChange: event => onChangeScheduleProperty('jobName', event)
              }),
              <div className={validStyle.scheduleName.feedback}>{validStyle.scheduleName.message}</div>
            )
          )
        ),
        React.createElement('div', { className: 'row' },
          React.createElement('div', { className: 'col-6' },
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', { htmlFor: 'schedule-method' }, 'Method'),
              React.createElement('select', {
                id: 'schedule-method',
                className: 'form-control',
                value: input.method || '',
                onChange: event => onChangeScheduleProperty('method', event)
              },
                React.createElement('option', { value: 'submitJob' }, methodToTipMap.submitJob),
                <option value="submitBatchWithBatchName">{methodToTipMap.submitBatchWithBatchName}</option>,
                <option value="submitBatch">{methodToTipMap.submitBatch}</option>,
                <option value="submitBatchWithLabel">{methodToTipMap.submitBatchWithLabel}</option>,
                <option value="submitPipeline">{methodToTipMap.submitPipeline}</option>
              )
            )
          ),
          React.createElement('div', { className: 'col-6' },
            React.createElement('div', { className: `form-group ${validStyle.cronExpression.success}` },
              React.createElement('label', { className: 'mr-2', htmlFor: 'schedule-cron' },
                'Schedule(',
                React.createElement('a', { 'data-toggle': 'collapse', href: '#cron-doc' }, 'Cron Expression'),
                ')'
              ),
              React.createElement('input', {
                id: 'schedule-cron',
                className: `form-control ${validStyle.cronExpression.valid}`,
                type: 'text',
                placeholder: '* * * * * ?',
                value: input.cronExpression,
                onChange: event => onChangeScheduleProperty('cronExpression', event)
              }),
              <div className={validStyle.cronExpression.feedback}>{validStyle.cronExpression.message}</div>
            ),
            React.createElement('div', { className: 'card border-info mb-3 collapse', id: 'cron-doc' },
              React.createElement('div', { className: 'card-body' },
                <CronDoc />
              )
            )
          )
        )
      ),
      React.createElement('div', { className: 'form-group' },
        React.createElement('button', {
          className: 'btn btn-primary mr-2',
          type: 'button',
          onClick: handleAdd
        }, 'Add')
      )
    ),
    errorMessage && <Alert type="warning" text={errorMessage} />
  );
};

export default ScheduleDeleteForm;