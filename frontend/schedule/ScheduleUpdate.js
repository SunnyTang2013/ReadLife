import React, { useState, useEffect, useCallback } from 'react';

import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { isEqual } from 'lodash';
import LoadingIndicator from '../components/LoadingIndicator';

import ErrorAlert from '../components/ErrorAlert';
import ScheduleForm from './components/ScheduleForm';
import schedulingService from '../backend/schedulingService';
import Alert from '../components/Alert';

const ScheduleUpdate = () => {
  const [scheduleDetail, setScheduleDetail] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [updateFlag, setUpdateFlag] = useState(true);
  const [alertType, setAlertType] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);

  const navigate = useNavigate();
  const { jobName, triggerKeyName } = useParams();

  const onSave = useCallback((schedule) => {
    setIsSaving(true);
    schedulingService.updateSchedule(schedule)
      .then((result) => {
        if (result.status === 'SUCCESS') {
          toast.success('Schedule is updated successfully.');
          navigate(`/detail/${encodeURIComponent(schedule.jobName)}/${result.data.triggerKeyName}`, { replace: true });
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
  }, [navigate]);

  const onCancel = useCallback(() => {
    navigate(`/detail/${encodeURIComponent(jobName)}/${triggerKeyName}`, { replace: true });
  }, [navigate, jobName, triggerKeyName]);

  const loadScheduleDetail = useCallback(() => {
    console.log(`Loading Schedule Detail #${jobName}: ${triggerKeyName} ...`);
    schedulingService.getScheduleDetail(jobName, triggerKeyName)
      .then((schedule) => {
        if (schedule.triggerDetails.length === 0) {
          setScheduleDetail(new Error('Trigger Detail No Found'));
          setIsSaving(false);
          setSaveError(null);
        } else {
          const scheduleDetail = Object.assign({}, schedule, schedule.triggerDetails[0]);
          setScheduleDetail(scheduleDetail);
          setIsSaving(false);
          setSaveError(null);
        }
      })
      .catch((error) => {
        setScheduleDetail(error);
        setIsSaving(false);
        setSaveError(null);
      });
  }, [jobName, triggerKeyName]);

  useEffect(() => {
    loadScheduleDetail();
  }, [loadScheduleDetail]);

  if (scheduleDetail === null) {
    return <LoadingIndicator />;
  }
  if (scheduleDetail instanceof Error) {
    return <ErrorAlert error={scheduleDetail} />;
  }

  return React.createElement('div', null,
    React.createElement('nav', null,
      React.createElement('ol', { className: 'breadcrumb' },
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: '/list' }, 'Schedule List')
        ),
        <li className="breadcrumb-item active">{scheduleDetail.jobName}</li>
      )
    ),
    <h2 className="display-4">{`Update: ${scheduleDetail.jobName}`}</h2>,
    <ErrorAlert error={saveError} />,
    alertMessage && <Alert type={alertType} text={alertMessage} />,
    <ScheduleForm schedule={scheduleDetail} onSave={onSave} onCancel={onCancel} disabled={isSaving} updateFlag={updateFlag} />
  );
};

export default ScheduleUpdate;
