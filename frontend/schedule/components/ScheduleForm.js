import React, { useState, useEffect, useCallback } from 'react';
import { cloneDeep } from 'lodash';
import Toggle from 'react-toggle';
import ParametersTable from '../../components/ParametersTable';
import Alert from '../../components/Alert';
import CronDoc from './CronDoc';
import PriorityRunDoc from './PriorityRunDoc';
import LoadingIndicator from '../../components/LoadingIndicator';
import ErrorAlert from '../../components/ErrorAlert';
import { sortCaseInsensitive } from '../../utils/utilities';

import schedulingService from '../../backend/schedulingService';

export function getMethodToTipMap() {
  return {
    submitJob: 'Submit Job',
    submitBatchWithBatchName: 'Submit Batch',
    submitBatch: 'Submit Batch With Hierarchy',
    submitBatchWithLabel: 'Submit Batch With Label',
    submitPipeline: 'Submit Pipeline',
  };
}

const ScheduleForm = ({ schedule, onSave, onCancel, updateFlag, disabled = false }) => {
  const [input, setInput] = useState(schedule);
  const [errorMessage, setErrorMessage] = useState(null);
  const [nextFireTime, setNextFireTime] = useState(null);
  const [timezoneList, setTimezoneList] = useState(null);
  const [loadingTimezone, setLoadingTimezone] = useState(true);
  const [validStyle, setValidStyle] = useState({
    success: '',
    valid: '',
    feedback: '',
  });

  const loadTimezoneList = useCallback(async () => {
    try {
      const timezoneListResult = await schedulingService.getTimezoneList();
      setTimezoneList(timezoneListResult);
      setLoadingTimezone(false);
    } catch (error) {
      setTimezoneList(error);
      setLoadingTimezone(false);
    }
  }, []);

  const clearAndLoad = useCallback(() => {
    setInput(schedule);
    setErrorMessage(null);
    setNextFireTime(null);
  }, [schedule]);

  useEffect(() => {
    loadTimezoneList();
  }, [loadTimezoneList]);

  useEffect(() => {
    clearAndLoad();
  }, [clearAndLoad]);

  const getNextFireTime = useCallback((event) => {
    setTimeout(() => {
      event.persist();
      const inputData = cloneDeep(input);
      setNextFireTime(null);
      
      schedulingService.getNextFireTime(inputData.cronExpression, inputData.timeZone)
        .then((result) => {
          if (result.status === 'SUCCESS') {
            setNextFireTime(result.message);
            setValidStyle({
              success: 'has-success',
              valid: 'is-valid',
              feedback: 'valid-feedback',
            });
          } else {
            setNextFireTime(result.message);
            setValidStyle({
              success: 'has-danger',
              valid: 'is-invalid',
              feedback: 'invalid-feedback',
            });
          }
        })
        .catch(() => {
          setNextFireTime('');
        });
    }, 500);
  }, [input]);

  const onChangeScheduleProperty = useCallback((name, event) => {
    const value = event.target.value;
    setInput(prevInput => {
      const newInput = cloneDeep(prevInput);
      newInput[name] = value;
      return newInput;
    });
    setErrorMessage(null);
    
    if ((name === 'cronExpression' && value) || name === 'timeZone') {
      getNextFireTime(event);
    }
  }, [getNextFireTime]);

  const onChangeParameters = useCallback((overrideParameters) => {
    setInput(prevInput => ({
      ...prevInput,
      overrideParameters
    }));
  }, []);

  const handleSave = useCallback((event) => {
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
    if (!inputData.timeZone) {
      setErrorMessage('Please choose timezone.');
      return;
    }
    onSave(inputData);
  }, [input, onSave]);

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

  const handleCancel = useCallback((event) => {
    event.preventDefault();
    onCancel && onCancel(event);
  }, [onCancel]);

  if (timezoneList === null) {
    return <LoadingIndicator />;
  }
  if (timezoneList instanceof Error) {
    return <ErrorAlert error={timezoneList} />;
  }

  const timezoneNames = sortCaseInsensitive(Object.keys(timezoneList));
  const timezoneOptions = timezoneNames.map((key) => {
    const value = timezoneList[key];
    return React.createElement('option', { 
      value: key, 
      key: `timezone-${key}` 
    }, value);
  });

  const methodToTipMap = getMethodToTipMap();

  return React.createElement('form', { className: 'my-2' },
    React.createElement('fieldset', { disabled: disabled || loadingTimezone },
      React.createElement('section', null,
        React.createElement('div', { className: 'row' },
          React.createElement('div', { className: 'col-6' },
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', { htmlFor: 'schedule-name' }, 'Schedule Name'),
              <input id="schedule-name" className="form-control" type="text" disabled={updateFlag} placeholder="Job Group or Job Name, eg.ON_LONDON_RISK_PRIORITY_1" value={input.jobName} onChange={event => onChangeScheduleProperty('jobName'} event) />
            )
          ),
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
          )
        ),
        React.createElement('div', { className: 'row' },
          React.createElement('div', { className: 'col-2' },
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', { htmlFor: 'skip-concurrent-run mr-2' }, 'Skip Concurrent Run'),
              <div id="skip-concurrent-run">{<Toggle checked={input.skipConcurrentRun} onChange={onSwitchSkipConcurrentRun} />}</div>
            )
          ),
          React.createElement('div', { className: 'col-6' },
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', { htmlFor: 'priority-run mr-2' },
                'Priority Run(',
                React.createElement('a', { 'data-toggle': 'collapse', href: '#priority-run-doc' }, 'Tutorial'),
                ')'
              ),
              <div id="priority-run">{<Toggle checked={input.priorityRun} onChange={onSwitchPriorityRun} />}</div>
            ),
            React.createElement('div', { className: 'card border-info mb-3 collapse', id: 'priority-run-doc' },
              React.createElement('div', { className: 'card-body' },
                <PriorityRunDoc />
              )
            )
          )
        ),
        React.createElement('div', { className: 'row' },
          React.createElement('div', { className: 'col-6' },
            React.createElement('div', { className: `form-group ${validStyle.success}` },
              React.createElement('label', { className: 'mr-2', htmlFor: 'schedule-cron' },
                'Schedule(',
                React.createElement('a', { 'data-toggle': 'collapse', href: '#cron-doc' }, 'Cron Expression'),
                ')'
              ),
              React.createElement('input', {
                id: 'schedule-cron',
                className: `form-control ${validStyle.valid}`,
                type: 'text',
                placeholder: '* * * * * ?',
                value: input.cronExpression,
                onChange: event => onChangeScheduleProperty('cronExpression', event)
              }),
              nextFireTime && <div className={validStyle.feedback}>{nextFireTime}</div>
            ),
            React.createElement('div', { className: 'card border-info mb-3 collapse', id: 'cron-doc' },
              React.createElement('div', { className: 'card-body' },
                <CronDoc />
              )
            )
          ),
          React.createElement('div', { className: 'col-6' },
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', { htmlFor: 'schedule-timezone' }, 'Time Zone'),
              React.createElement('select', {
                id: 'schedule-timezone',
                className: 'form-control',
                value: input.timeZone || '',
                onChange: event => onChangeScheduleProperty('timeZone', event)
              },
                React.createElement('option', { value: '' }, '----'),
                ...timezoneOptions
              )
            )
          )
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', { htmlFor: 'schedule-description' }, 'Description'),
          <input id="schedule-description" className="form-control" type="text" placeholder="Schedule description" value={input.jobNameDescription} onChange={event => onChangeScheduleProperty('jobNameDescription'} event) />
        )
      ),
      React.createElement('section', { className: 'my-3' },
        React.createElement('h3', { className: 'display-6' }, 'End Point Parameters'),
        <ParametersTable parameters={input.overrideParameters} onChange={onChangeParameters} />
      ),
      React.createElement('div', { className: 'form-group' },
        React.createElement('button', {
          className: 'btn btn-primary mr-2',
          type: 'button',
          onClick: handleSave
        }, 'Save'),
        <button className="btn btn-secondary" type="button" onClick={handleCancel} 'data-dismiss'="modal">Cancel and Go Back</button>
      )
    ),
    errorMessage && <Alert type="warning" text={errorMessage} />
  );
};

export default ScheduleForm;