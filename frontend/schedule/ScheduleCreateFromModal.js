import React, { useState, useEffect, useCallback } from 'react';

import LoadingIndicator from '../components/LoadingIndicator';

import ErrorAlert from '../components/ErrorAlert';
import ScheduleFormForModal from './components/ScheduleFormForModal';
import schedulingService from '../backend/schedulingService';
import Alert from '../components/Alert';

const ScheduleCreateFromModal = ({ jobName, submitType }) => {
  const [newSchedule, setNewSchedule] = useState(null);
  const [triggerDetail, setTriggerDetail] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [isNewJob, setIsNewJob] = useState(false);
  const [isClone, setIsClone] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertType, setAlertType] = useState(null);
  const [currentCron, setCurrentCron] = useState(null);

  const onCancel = useCallback(() => {
    setIsClone(false);
  }, []);

  const onSaveSchedule = useCallback((schedule, isSaveNew, event) => {
    event.preventDefault();
    setIsSaving(true);
    setAlertMessage(null);
    setAlertType(null);
    setNewSchedule(null);
    setTriggerDetail(null);
    const wasClone = isClone;
    setIsClone(false);
    
    if (isSaveNew || wasClone) {
      schedulingService.createSchedule(schedule)
        .then((result) => {
          if (result.status === 'SUCCESS') {
            setAlertMessage('Set up schedule successfully.');
            setAlertType('success');
            setIsSaving(false);
            setIsNewJob(false);
            loadSchedule();
          } else {
            setAlertMessage(result.message);
            setAlertType('danger');
            setIsSaving(false);
            setIsNewJob(true);
          }
        })
        .catch((error) => {
          setNewSchedule(schedule);
          setIsSaving(false);
          setSaveError(error);
        });
    } else {
      schedulingService.updateSchedule(schedule)
        .then((result) => {
          if (result.status === 'SUCCESS') {
            setAlertMessage('Update schedule successfully.');
            setAlertType('success');
            setIsSaving(false);
            loadSchedule();
          } else {
            setAlertMessage(result.message);
            setAlertType('danger');
            setIsSaving(false);
          }
        })
        .catch((error) => {
          setIsSaving(false);
          setSaveError(error);
        });
    }
  }, [isClone]);

  const onChangeCron = useCallback((event) => {
    const value = event.target.value;
    const trigger = newSchedule.triggerDetails[value];
    setCurrentCron(value);
    setIsSaving(true);
    onTriggerDetail(jobName, trigger.triggerKeyName);
  }, [newSchedule, jobName]);

  const onClone = useCallback(() => {
    setIsClone(!isClone);
  }, [isClone]);

  const onTriggerDetail = useCallback((jobName, triggerKeyName) => {
    if (jobName && triggerKeyName) {
      schedulingService.getScheduleDetail(encodeURIComponent(jobName), triggerKeyName)
        .then((schedule) => {
          const jobNameDescription = schedule.jobNameDescription;
          const triggerDetail = Object.assign({}, 
            { jobName: jobName, jobNameDescription: jobNameDescription }, 
            schedule.triggerDetails[0]
          );
          setTriggerDetail(triggerDetail);
          setIsSaving(false);
        })
        .catch((error) => {
          setNewSchedule(error);
          setIsSaving(false);
          setSaveError(null);
        });
    }
  }, []);

  const loadSchedule = useCallback(() => {
    schedulingService.getSchedule(jobName)
      .then((fromSchedule) => {
        if (fromSchedule && fromSchedule.triggerDetails !== null
          && fromSchedule.triggerDetails.length > 0) {
          setNewSchedule(fromSchedule);
          setIsSaving(false);
          setSaveError(null);
          setIsNewJob(false);
          initTriggerDetail(fromSchedule, false);
        } else {
          const newScheduleData = {
            jobName: jobName,
            jobNameDescription: '',
            applicationName: 'SCORCH',
            triggerDetails: [{
              cronExpression: '',
              method: submitType,
              timeZone: '',
              skipConcurrentRun: false,
              overrideParameters: { entries: {} },
            }],
          };
          setNewSchedule(newScheduleData);
          setIsSaving(false);
          setSaveError(null);
          setIsNewJob(true);
          initTriggerDetail(newScheduleData, true);
        }
      })
      .catch((error) => {
        setNewSchedule(error);
        setIsSaving(false);
        setSaveError(null);
      });
  }, [jobName, submitType]);

  const initTriggerDetail = useCallback((scheduleData, isNew) => {
    if (!isNew) {
      const trigger = scheduleData.triggerDetails[0];
      setCurrentCron(0);
      setIsSaving(true);
      onTriggerDetail(jobName, trigger.triggerKeyName);
    } else {
      const triggerDetail = Object.assign({}, 
        { jobName: scheduleData.jobName }, 
        scheduleData.triggerDetails[0]
      );
      setCurrentCron('0');
      setTriggerDetail(triggerDetail);
    }
  }, [jobName, onTriggerDetail]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  if (newSchedule === null || triggerDetail === null) {
    return <LoadingIndicator />;
  }
  if (newSchedule instanceof Error) {
    return <ErrorAlert error={newSchedule} />;
  }

  const validTriggers = newSchedule.triggerDetails.filter(
    trigger => trigger.cronExpression && trigger.cronExpression !== '',
  );
  const $options = validTriggers.map((schedule, index) => 
    React.createElement('option', { 
      value: index, 
      key: `timezone-${schedule.cronExpression}` 
    }, schedule.cronExpression)
  );

  return React.createElement('div', null,
    <ErrorAlert error={saveError} />,
    alertMessage && <Alert type={alertType} text={alertMessage} />,
    isClone && React.createElement('div', null,
      React.createElement('h3', { className: 'display-6' }, 'Clone New Schedule')
    ),
    !isClone && React.createElement('div', null,
      React.createElement('button', {
        className: 'btn btn-primary mr-2',
        type: 'button',
        onClick: onClone
      },
        <i className="fa fa-fw fa-copy" />,
        ' Clone'
      )
    ),
    !isClone && React.createElement('div', { className: 'form-group' },
      React.createElement('label', { htmlFor: 'schedule-cron-list' }, 'Cron List'),
      <select id="schedule-cron-list" className="form-control" value={currentCron || ''} onChange={onChangeCron}>{...$options}</select>
    ),
    <div className="card my-2">{<ScheduleFormForModal schedule={triggerDetail} onSave={onSaveSchedule} onCancel={onCancel} disabled={isSaving} />}</div>
  );
};

export default ScheduleCreateFromModal;
