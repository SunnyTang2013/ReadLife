import React, { useState, useEffect, useCallback } from 'react';

import { Link, useNavigate, useParams } from 'react-router-dom';
import LoadingIndicator from '../components/LoadingIndicator';

import ErrorAlert from '../components/ErrorAlert';
import ScheduleForm from './components/ScheduleForm';
import schedulingService from '../backend/schedulingService';
import Alert from '../components/Alert';

const ScheduleCreate = () => {
  const [newSchedule, setNewSchedule] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertType, setAlertType] = useState(null);
  const [updateFlag, setUpdateFlag] = useState(false);

  const navigate = useNavigate();
  const { jobName, triggerKeyName } = useParams();

  const onSaveSchedule = useCallback((schedule) => {
    setIsSaving(true);
    setAlertMessage(null);
    setAlertType(null);
    
    schedulingService.createSchedule(schedule)
      .then((result) => {
        if (result.status === 'SUCCESS') {
          navigate(`/detail/${encodeURIComponent(result.data.jobName)}/${result.data.triggerKeyName}`);
        } else {
          setAlertMessage(result.message);
          setAlertType('danger');
          setIsSaving(false);
        }
      })
      .catch((error) => {
        setNewSchedule(schedule);
        setIsSaving(false);
        setSaveError(error);
      });
  }, [navigate]);

  const onCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const loadSchedule = useCallback(() => {
    if (!jobName || !triggerKeyName) {
      setNewSchedule({
        jobName: '',
        jobNameDescription: '',
        applicationName: 'SCORCH',
        cronExpression: '',
        method: 'submitBatch',
        timeZone: '',
        skipConcurrentRun: false,
        overrideParameters: {
          entries: {},
        },
      });
      setIsSaving(false);
      setSaveError(null);
      return;
    }

    schedulingService.getScheduleDetail(jobName, triggerKeyName)
      .then((fromSchedule) => {
        if (fromSchedule.triggerDetails.length === 0) {
          setNewSchedule(new Error('Trigger Detail No Found'));
          setIsSaving(false);
          setSaveError(null);
        } else {
          const scheduleDetail = Object.assign({}, fromSchedule, fromSchedule.triggerDetails[0]);
          setNewSchedule(Object.assign({}, scheduleDetail, {
            jobName: '',
            jobNameDescription: '',
          }));
          setIsSaving(false);
          setSaveError(null);
        }
      })
      .catch((error) => {
        setNewSchedule(error);
        setIsSaving(false);
        setSaveError(null);
      });
  }, [jobName, triggerKeyName]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  if (newSchedule === null) {
    return <LoadingIndicator />;
  }
  if (newSchedule instanceof Error) {
    return <ErrorAlert error={newSchedule} />;
  }

  return React.createElement('div', null,
    React.createElement('nav', null,
      React.createElement('ol', { className: 'breadcrumb' },
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: '/list' }, 'Schedule List')
        ),
        <li className="breadcrumb-item active">Create New Schedule</li>
      )
    ),
    <h2 className="display-4">New Schedule</h2>,
    <ErrorAlert error={saveError} />,
    alertMessage && <Alert type={alertType} text={alertMessage} />,
    <ScheduleForm schedule={newSchedule} onSave={onSaveSchedule} onCancel={onCancel} disabled={isSaving} updateFlag={updateFlag} />
  );
};

export default ScheduleCreate;
