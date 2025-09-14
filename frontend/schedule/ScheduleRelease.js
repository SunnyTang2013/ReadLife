import React, { useState, useEffect, useCallback } from 'react';

import { Link, useNavigate, useParams } from 'react-router-dom';
import LoadingIndicator from '../components/LoadingIndicator';

import ErrorAlert from '../components/ErrorAlert';
import ScheduleForm from './components/ScheduleForm';
import schedulingService from '../backend/schedulingService';
import Alert from '../components/Alert';
import ScheduleUpdateForm from './components/ScheduleUpdateForm';
import ScheduleDeleteForm from './components/ScheduleDeleteForm';
import ScheduleComparisonForm from './components/ScheduleComparisonForm';

export function getMethodToTipMap() {
  return {
    submitJob: 'Submit Job',
    submitBatchWithBatchName: 'Submit Batch',
    submitBatch: 'Submit Batch With Hierarchy',
    submitBatchWithLabel: 'Submit Batch With Label',
    submitPipeline: 'Submit Pipeline',
  };
}

function getNewSchedule() {
  return {
    action: 'create',
    jobName: '',
    jobNameDescription: '',
    applicationName: 'SCORCH-PDN-CLUSTER',
    cronExpression: '',
    method: 'submitBatch',
    isNormalRun: true,
    timeZone: '',
    skipConcurrentRun: false,
    overrideParameters: {
      entries: {},
    },
  };
}

function getDeleteSchedule() {
  return {
    action: 'delete',
    jobName: '',
    applicationName: 'SCORCH-PDN-CLUSTER',
    cronExpression: '',
    method: 'submitBatch',
  };
}

function getUpdateSchedule() {
  return {
    action: 'update',
    jobName: '',
    updateMethod: false,
    isNormalRun: false,
    method: 'submitJob',
    cronExpression: '',
    updateSchedule: false,
    updateCron: false,
    newCronExpression: '',
    updatePriorityRun: false,
    priorityRun: false,
    updateDescription: false,
    jobNameDescription: '',
    applicationName: 'SCORCH-PDN-CLUSTER',
    updateTimeZone: false,
    timeZone: 'UTC',
    updateSkipConcurrent: false,
    skipConcurrentRun: false,
    updateOverride: false,
    updateFields: [],
    overrideParameters: {
      entries: {},
    },
  };
}

const ScheduleRelease = () => {
  const [releaseList, setReleaseList] = useState(null);
  const [newSchedule, setNewSchedule] = useState(getNewSchedule());
  const [updateSchedule, setUpdateSchedule] = useState(getUpdateSchedule());
  const [deleteSchedule, setDeleteSchedule] = useState(getDeleteSchedule());
  const [scheduleComparison, setScheduleComparison] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [updateFlag, setUpdateFlag] = useState(false);
  const [releaseType, setReleaseType] = useState('create');
  const [timezoneList, setTimezoneList] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertType, setAlertType] = useState(null);
  const modalId = 'createPackageModal';

  const navigate = useNavigate();
  const { packageVersion } = useParams();

  const onAddSchedule = useCallback((schedule) => {
    setReleaseList(prevState => {
      const exists = prevState.some(
        item => item.jobName === schedule.jobName
          && item.cronExpression === schedule.cronExpression,
      );
      return exists
        ? prevState.map(
          item => (item.jobName === schedule.jobName
          && item.cronExpression === schedule.cronExpression ? schedule : item),
        )
        : [...prevState, schedule];
    });
    setScheduleComparison(null);
  }, []);

  const onSwitchTab = useCallback((releaseType) => {
    setReleaseType(releaseType);
  }, []);

  const onReviewItem = useCallback((schedule) => {
    if (schedule.action === 'create') {
      setNewSchedule(Object.assign({}, getNewSchedule(), schedule));
    } else if (schedule.action === 'update') {
      setUpdateSchedule(Object.assign({}, getUpdateSchedule(), schedule));
    } else if (schedule.action === 'delete') {
      setDeleteSchedule(Object.assign({}, getDeleteSchedule(), schedule));
    }
    setReleaseType(schedule.action);
  }, []);

  const onRemoveItem = useCallback((schedule) => {
    setReleaseList(prevState => 
      prevState.filter(item => item.jobName !== schedule.jobName
        || item.cronExpression !== schedule.cronExpression)
    );
    setScheduleComparison(null);
  }, []);

  const onCreateRelease = useCallback(() => {
    setIsSaving(true);
    setAlertMessage(null);
    setAlertType(null);
    setSaveError(null);
    
    schedulingService.createScheduleReleasePackage(releaseList)
      .then((result) => {
        if (result.status === 'SUCCESS') {
          setAlertMessage(result.message);
          setAlertType('primary');
          setIsSaving(false);
        } else {
          setAlertMessage(result.message);
          setAlertType('danger');
          setIsSaving(false);
        }
      })
      .catch((error) => {
        setReleaseList([]);
        setIsSaving(false);
        setSaveError(error);
      });
  }, [releaseList]);

  const onComparison = useCallback(() => {
    if (!releaseList || releaseList.length === 0) {
      return;
    }
    setIsSaving(true);
    setScheduleComparison(null);
    
    schedulingService.compareSchedule(releaseList)
      .then((result) => {
        setIsSaving(false);
        setScheduleComparison(result.data);
      })
      .catch((error) => {
        setIsSaving(false);
        setSaveError(error);
      });
  }, [releaseList]);

  const onCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const renderReleaseList = useCallback(() => {
    const $rows = releaseList.map((item, index) => 
      React.createElement('tr', { key: index },
        <td>{item.jobName}</td>,
        <td>{item.cronExpression}</td>,
        <td>{item.method}</td>,
        <td>{item.action}</td>,
        React.createElement('td', null,
          React.createElement('button', {
            type: 'button',
            className: 'btn btn-primary mr-1',
            onClick: () => onReviewItem(item)
          },
            <i className="fa fa-fw fa-eye" />
          ),
          <button type="button" className="btn btn-primary" onClick={() => onRemoveItem(item)}>{<i className="fa fa-fw fa-trash-o" />}</button>
        )
      )
    );

    return React.createElement('table', { className: 'table table-striped' },
      React.createElement('thead', null,
        React.createElement('tr', null,
          React.createElement('th', { className: 'col-4' }, 'Name'),
          <th className="col-3">Schedule</th>,
          <th className="col-1">Method</th>,
          <th className="col-1">Action</th>,
          <th className="col-3" />
        )
      ),
      <tbody>{...$rows}</tbody>
    );
  }, [releaseList, onReviewItem, onRemoveItem]);

  const loadData = useCallback(() => {
    if (packageVersion) {
      schedulingService.getScheduleReleasePackage(packageVersion)
        .then((result) => {
          if (result.status === 'SUCCESS') {
            setReleaseList(result.data.packageDetail.scheduleReleaseDetails);
          } else {
            setReleaseList([]);
            setAlertType('danger');
            setAlertMessage(result.message);
          }
        })
        .catch((error) => {
          setReleaseList(error);
        });
    } else {
      setReleaseList([]);
    }
  }, [packageVersion]);

  const loadTimezoneList = useCallback(() => {
    schedulingService.getTimezoneList()
      .then((timezoneList) => {
        setTimezoneList(timezoneList);
      })
      .catch((error) => {
        setTimezoneList(error);
      });
  }, []);

  useEffect(() => {
    loadData();
    loadTimezoneList();
  }, [loadData, loadTimezoneList]);

  if (timezoneList === null || releaseList === null) {
    return <LoadingIndicator />;
  }
  if (timezoneList instanceof Error) {
    return <ErrorAlert error={timezoneList} />;
  }
  if (releaseList instanceof Error) {
    return <ErrorAlert error={releaseList} />;
  }

  const $releaseList = renderReleaseList();
  return React.createElement('div', null,
    React.createElement('nav', null,
      React.createElement('ol', { className: 'breadcrumb' },
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: '/list' }, 'Schedule List')
        ),
        <li className="breadcrumb-item active">Release Schedule</li>
      )
    ),
    <h2 className="display-4">Release Schedule</h2>,
    <span className="text-muted font-13">{"Don't forget to click ADD button when you changed items"}</span>,
    React.createElement('hr'),
    <ErrorAlert error={saveError} />,
    alertMessage && <Alert type={alertType} text={alertMessage} />,
    React.createElement('div', { className: 'row' },
      React.createElement('div', { className: 'col-7' },
        React.createElement('ul', { className: 'nav nav-tabs' },
          React.createElement('li', { className: 'nav-item' },
            React.createElement('a', {
              className: `nav-link ${releaseType === 'create' ? 'active' : ''}`,
              'data-toggle': 'tab',
              href: '#create',
              onClick: () => onSwitchTab('create')
            }, 'Create New')
          ),
          React.createElement('li', { className: 'nav-item' },
            React.createElement('a', {
              className: `nav-link ${releaseType === 'update' ? 'active' : ''}`,
              'data-toggle': 'tab',
              href: '#update',
              onClick: () => onSwitchTab('update')
            }, 'Update')
          ),
          React.createElement('li', { className: 'nav-item' },
            React.createElement('a', {
              className: `nav-link ${releaseType === 'delete' ? 'active' : ''}`,
              'data-toggle': 'tab',
              href: '#delete',
              onClick: () => onSwitchTab('delete')
            }, 'Delete')
          )
        ),
        React.createElement('div', { id: 'myTabContent', className: 'tab-content' },
          React.createElement('div', {
            className: `tab-pane fade ${releaseType === 'create' ? 'active show' : ''}`,
            id: 'create'
          },
            <ScheduleForm schedule={newSchedule} onSave={onAddSchedule} onCancel={onCancel} disabled={isSaving} updateFlag={updateFlag} />
          ),
          React.createElement('div', {
            className: `tab-pane fade ${releaseType === 'update' ? 'active show' : ''}`,
            id: 'update'
          },
            <ScheduleUpdateForm schedule={updateSchedule} onAdd={onAddSchedule} updateFlag={updateFlag} disabled={isSaving} methods={getMethodToTipMap()} timezoneList={timezoneList} />
          ),
          React.createElement('div', {
            className: `tab-pane fade ${releaseType === 'delete' ? 'active show' : ''}`,
            id: 'delete'
          },
            <ScheduleDeleteForm schedule={deleteSchedule} onAdd={onAddSchedule} updateFlag={updateFlag} disabled={isSaving} methods={getMethodToTipMap()} />
          )
        )
      ),
      React.createElement('div', { className: 'col-5' },
        $releaseList,
        React.createElement('div', { className: 'form-group' },
          React.createElement('button', {
            className: 'btn btn-primary mr-2',
            type: 'button',
            'data-toggle': 'modal',
            disabled: releaseList.length === 0,
            'data-target': `#${modalId}`,
            onClick: onComparison
          }, 'Create Package')
        )
      )
    ),
    React.createElement('div', {
      id: modalId,
      className: 'modal fade',
      tabIndex: '-1',
      role: 'dialog'
    },
      React.createElement('div', { className: 'modal-dialog modal-80', role: 'document' },
        React.createElement('div', { className: 'modal-content' },
          React.createElement('div', { className: 'modal-body' },
            <ScheduleComparisonForm scheduleComparisons={scheduleComparison} onCreateRelease={onCreateRelease} />
          )
        )
      )
    )
  );
};

export default ScheduleRelease;
