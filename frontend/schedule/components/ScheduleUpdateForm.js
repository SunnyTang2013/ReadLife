import React, { useState, useEffect, useCallback } from 'react';
import { cloneDeep } from 'lodash';
import Toggle from 'react-toggle';
import ParametersTable from '../../components/ParametersTable';
import Alert from '../../components/Alert';
import CronDoc from './CronDoc';
import PriorityRunDoc from './PriorityRunDoc';
import { sortCaseInsensitive } from '../../utils/utilities';

import ReleaseVerifyFunction from './ReleaseVerifyFunction';

const ScheduleUpdateForm = ({ schedule, onAdd, updateFlag, disabled = false, methods, timezoneList }) => {
  const [input, setInput] = useState(schedule);
  const [errorMessage, setErrorMessage] = useState(null);
  const [validStyle, setValidStyle] = useState({
    scheduleName: ReleaseVerifyFunction.getInValidStyle(),
    cronExpression: ReleaseVerifyFunction.getInValidStyle(),
    newCronExpression: ReleaseVerifyFunction.getInValidStyle(),
  });

  const clearAndLoad = useCallback(() => {
    setInput(schedule);
    setErrorMessage(null);
    setValidStyle({
      scheduleName: ReleaseVerifyFunction.getValidStyle(),
      cronExpression: ReleaseVerifyFunction.getValidStyle(),
      newCronExpression: ReleaseVerifyFunction.getValidStyle(),
    });
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

  const onChangeScheduleUpdateOptions = useCallback((name, event) => {
    const checked = event.target.checked;
    setInput(prevInput => {
      const newInput = cloneDeep(prevInput);
      newInput.updateFields = ReleaseVerifyFunction.deleteItemByName(newInput.updateFields, name);
      if (checked) {
        newInput.updateFields.push(name);
      }
      return newInput;
    });
    setErrorMessage(null);
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
    if (!inputData.cronExpression) {
      setErrorMessage('Please fulfill schedule.');
      return;
    }
    if (inputData.updateFields.length === 0) {
      setErrorMessage('You have choose any update filed.');
      return;
    }
    const emptyValue = [];
    inputData.updateFields.forEach((key) => {
      if (inputData[key] === '') {
        emptyValue.push(key);
      }
      if (key === 'cronExpression' && !inputData.newCronExpression) {
        emptyValue.push('newCronExpression');
      }
    });
    if (emptyValue.length > 0) {
      setErrorMessage(`Please fulfill value ${emptyValue.join(',')}.`);
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

  const onSwitchStatus = useCallback((event) => {
    const isNormalRun = event.target.checked;
    setInput(prevInput => {
      const newInput = cloneDeep(prevInput);
      newInput.isNormalRun = isNormalRun;
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

  const timezoneNames = sortCaseInsensitive(Object.keys(timezoneList));
  const timezoneOptions = timezoneNames.map((key) => {
    const value = timezoneList[key];
    return React.createElement('option', { 
      value: key, 
      key: `timezone-${key}` 
    }, value);
  });

  const methodToTipMap = methods;

  return React.createElement('form', { className: 'my-2' },
    React.createElement('fieldset', { disabled },
      React.createElement('section', null,
        React.createElement('h5', { className: 'display-7' }, 'Input Change Entity'),
        React.createElement('div', { className: 'row' },
          React.createElement('div', { className: 'col-6' },
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
        ),
        <h5 className="display-7">Select And Input Changes</h5>,
        React.createElement('div', { className: 'row' },
          React.createElement('div', { className: 'col-6' },
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', { htmlFor: 'is-pause' }, 'Update Status'),
              <div className="form-check">{<input className="form-check-input position-static large-checkbox" type="checkbox" id="is-pause" checked={input.updateFields.isNormalRun} onChange={event => onChangeScheduleUpdateOptions('isNormalRun'} event}</div> />
              )
            )
          ),
          React.createElement('div', { className: 'col-6' },
            React.createElement('div', { className: 'form-group' },
              React.createElement('fieldset', { disabled: input.updateFields.indexOf('isNormalRun') === -1 },
                <label htmlFor="update-is-pause">Pause Or Run Job</label>,
                React.createElement('div', { id: 'update-is-pause' },
                  <Toggle checked={input.isNormalRun} onChange={onSwitchStatus} />,
                  React.createElement('span', { className: 'ml-2' }, 
                    input.isNormalRun ? 'Run Job' : 'To Stop Running'
                  )
                )
              )
            )
          )
        ),
        React.createElement('div', { className: 'row' },
          React.createElement('div', { className: 'col-6' },
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', { 
                htmlFor: 'update-schedule-div', 
                className: 'form-check-label' 
              }, 'Update Schedule'),
              <div className="form-check">{<input className="form-check-input position-static large-checkbox" type="checkbox" id="update-schedule-div" checked={input.updateFields.cronExpression} onChange={event => onChangeScheduleUpdateOptions('cronExpression'} event}</div> />
              )
            )
          ),
          React.createElement('div', { className: 'col-6' },
            React.createElement('div', { className: `form-group ${validStyle.newCronExpression.success}` },
              React.createElement('fieldset', { disabled: input.updateFields.indexOf('cronExpression') === -1 },
                <label className="mr-2" htmlFor="schedule-cron">Schedule(',
                  React.createElement('a', { 'data-toggle': 'collapse', href: '#cron-doc' }, 'Cron Expression</label>,
                  ')'
                ),
                React.createElement('input', {
                  id: 'schedule-cron',
                  className: `form-control ${input.updateSchedule && validStyle.newCronExpression.valid}`,
                  type: 'text',
                  placeholder: '* * * * * ?',
                  value: input.newCronExpression,
                  onChange: event => onChangeScheduleProperty('newCronExpression', event)
                }),
                input.updateSchedule && <div className={validStyle.newCronExpression.feedback}>{validStyle.newCronExpression.message}</div>
              )
            ),
            React.createElement('div', { className: 'card border-info mb-3 collapse', id: 'cron-doc' },
              React.createElement('div', { className: 'card-body' },
                <CronDoc />
              )
            )
          )
        ),
        React.createElement('div', { className: 'row' },
          React.createElement('div', { className: 'col-6' },
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', { htmlFor: 'update-method' }, 'Update Method'),
              <div className="form-check">{<input className="form-check-input position-static large-checkbox" type="checkbox" id="update-method" checked={input.updateFields.method} onChange={event => onChangeScheduleUpdateOptions('method'} event}</div> />
              )
            )
          ),
          React.createElement('div', { className: 'col-6' },
            React.createElement('div', { className: 'form-group' },
              React.createElement('fieldset', { disabled: input.updateFields.indexOf('method') === -1 },
                <label htmlFor="schedule-method">Method</label>,
                React.createElement('select', {
                  id: 'schedule-method',
                  className: 'form-control',
                  value: input.method || 'submitJob',
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
          )
        ),
        React.createElement('div', { className: 'row' },
          React.createElement('div', { className: 'col-6' },
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', { htmlFor: 'skip-concurrent-run' }, 'Update Skip Concurrent Run'),
              <div className="form-check">{<input className="form-check-input position-static large-checkbox" type="checkbox" id="skip-concurrent-run" checked={input.updateFields.skipConcurrentRun} onChange={event => onChangeScheduleUpdateOptions('skipConcurrentRun'} event}</div> />
              )
            )
          ),
          React.createElement('div', { className: 'col-6' },
            React.createElement('div', { className: 'form-group' },
              React.createElement('fieldset', { disabled: input.updateFields.indexOf('skipConcurrentRun') === -1 },
                <label htmlFor="update-skip-concurrent-run">Skip Concurrent Run</label>,
                <div id="update-skip-concurrent-run">{<Toggle checked={input.skipConcurrentRun} onChange={onSwitchSkipConcurrentRun} />}</div>
              )
            )
          )
        ),
        React.createElement('div', { className: 'row' },
          React.createElement('div', { className: 'col-6' },
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', { htmlFor: 'update-priority-run' }, 'Update Priority Run'),
              <div className="form-check">{<input className="form-check-input position-static large-checkbox" type="checkbox" id="skip-priority-run" checked={input.updateFields.priorityRun} onChange={event => onChangeScheduleUpdateOptions('priorityRun'} event}</div> />
              )
            )
          ),
          React.createElement('div', { className: 'col-6' },
            React.createElement('div', { className: 'form-group' },
              React.createElement('fieldset', { disabled: input.updateFields.indexOf('priorityRun') === -1 },
                <label htmlFor="priority-run">Priority Run(',
                  React.createElement('a', { 'data-toggle': 'collapse', href: '#priority-run-doc' }, 'Tutorial</label>,
                  ')'
                ),
                <div id="priority-run">{<Toggle checked={input.priorityRun} onChange={onSwitchPriorityRun} />}</div>
              )
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
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', { htmlFor: 'update-time-zone' }, 'Update Time Zone'),
              <div className="form-check">{<input className="form-check-input position-static large-checkbox" type="checkbox" id="update-time-zone" checked={input.updateFields.timeZone} onChange={event => onChangeScheduleUpdateOptions('timeZone'} event}</div> />
              )
            )
          ),
          React.createElement('div', { className: 'col-6' },
            React.createElement('div', { className: 'form-group' },
              React.createElement('fieldset', { disabled: input.updateFields.indexOf('timeZone') === -1 },
                <label htmlFor="schedule-timezone">Time Zone</label>,
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
          )
        ),
        React.createElement('div', { className: 'row' },
          React.createElement('div', { className: 'col-6' },
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', { htmlFor: 'update-description' }, 'Update Description'),
              <div className="form-check">{<input className="form-check-input position-static large-checkbox" type="checkbox" id="update-description" checked={input.updateFields.jobNameDescription} onChange={event => onChangeScheduleUpdateOptions('jobNameDescription'} event}</div> />
              )
            )
          ),
          React.createElement('div', { className: 'col-6' },
            React.createElement('div', { className: 'form-group' },
              React.createElement('fieldset', { disabled: input.updateFields.indexOf('jobNameDescription') === -1 },
                <label htmlFor="schedule-description">Description</label>,
                <textarea id="schedule-description" className="form-control" placeholder="Schedule description" value={input.jobNameDescription} onChange={event => onChangeScheduleProperty('jobNameDescription'} event) />
              )
            )
          )
        )
      ),
      React.createElement('section', { className: 'my-3' },
        React.createElement('h3', { className: 'display-7' }, 'End Point Parameters'),
        React.createElement('div', { className: 'row' },
          React.createElement('div', { className: 'col-6' },
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', { htmlFor: 'update-override' }, 'Update Parameters'),
              <div className="form-check">{<input className="form-check-input position-static large-checkbox" type="checkbox" id="update-override" checked={input.updateFields.overrideParameters} onChange={event => onChangeScheduleUpdateOptions('overrideParameters'} event}</div> />
              )
            )
          ),
          React.createElement('div', { className: 'col-6' },
            React.createElement('fieldset', { disabled: input.updateFields.indexOf('overrideParameters') === -1 },
              <ParametersTable parameters={input.overrideParameters} onChange={onChangeParameters} />
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

export default ScheduleUpdateForm;