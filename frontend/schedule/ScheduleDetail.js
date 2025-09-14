import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import schedulingService from '../backend/schedulingService';

import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';
import ParametersTable from '../components/ParametersTable';
import { getMethodToTipMap } from './components/ScheduleForm';
import Alert from '../components/Alert';

const ScheduleDetail = () => {
  const [scheduleDetail, setScheduleDetail] = useState(null);
  
  const navigate = useNavigate();
  const { jobName, triggerKeyName } = useParams();

  const onQuickRun = useCallback((jobName, triggerKeyName) => {
    schedulingService.submitJob(jobName, triggerKeyName)
      .then((scorchRequest) => {
        if (scorchRequest.status && scorchRequest.status === 'FAILED') {
          toast.error(`${scorchRequest.name} submit failed, status: ${scorchRequest.status}`);
        } else {
          toast.success(`${scorchRequest.name} submit successfully, status: ${scorchRequest.status}`);
        }
      })
      .catch((error) => {
        toast.error(`Failed to submit job: ${error}`);
      });
  }, []);

  const onDelete = useCallback(() => {
    if (scheduleDetail === null || scheduleDetail instanceof Error) {
      return;
    }
    schedulingService.deleteSchedule(jobName, triggerKeyName)
      .then(() => {
        toast.success(`Schedule #${jobName} is deleted successfully.`);
        navigate('/list');
      })
      .catch((error) => {
        toast.error(`Fail to delete schedule: ${error}`);
      });
  }, [scheduleDetail, jobName, triggerKeyName, navigate]);

  const loadData = useCallback(() => {
    schedulingService.getScheduleDetail(jobName, triggerKeyName)
      .then(scheduleDetail => {
        setScheduleDetail(scheduleDetail);
      })
      .catch((error) => {
        setScheduleDetail(error);
      });
  }, [jobName, triggerKeyName]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const $methodToTipMap = getMethodToTipMap();
  
  if (scheduleDetail === null) {
    return <LoadingIndicator />;
  }
  if (scheduleDetail instanceof Error) {
    return <ErrorAlert error={scheduleDetail} />;
  }

  if (!scheduleDetail.jobName) {
    return React.createElement(Alert, { 
      type: 'danger', 
      text: `Scheduler ${jobName} - ${triggerKeyName} Not Found` 
    });
  }

  const scheduleDetailInfo = [
    ['Name', scheduleDetail.jobName],
    ['Description', scheduleDetail.jobNameDescription],
    ['Schedule', scheduleDetail.triggerDetails[0].cronExpression],
    ['Method', $methodToTipMap[scheduleDetail.triggerDetails[0].method]],
    ['Next Execution Time', scheduleDetail.triggerDetails[0].nextFireTime],
    ['Previous Successful Run', scheduleDetail.triggerDetails[0].previousSuccessfulRun],
    ['Skip Concurrent Run', scheduleDetail.triggerDetails[0].skipConcurrentRun ? 'Y' : 'N'],
    ['Priority Run', scheduleDetail.triggerDetails[0].priorityRun ? 'Y' : 'N'],
    ['Create By', scheduleDetail.triggerDetails[0].createBy],
    ['Last Updated By', scheduleDetail.triggerDetails[0].lastUpdateBy],
    ['Create Time(UTC)', scheduleDetail.triggerDetails[0].createTime],
    ['Update Time(UTC)', scheduleDetail.triggerDetails[0].updateTime],
  ];

  const $scheduleDetailInfoRows = scheduleDetailInfo.map(([name, value]) => 
    React.createElement('tr', { key: `info-${name}` },
      React.createElement('th', { 
        className: 'nowrap', 
        style: { width: '30%' } 
      }, name),
      <td>{value}</td>
    )
  );

  return React.createElement('div', null,
    React.createElement('nav', null,
      React.createElement('ol', { className: 'breadcrumb' },
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: '/list' }, 'Schedule List')
        ),
        <li className="breadcrumb-item active">{scheduleDetail.jobName}</li>
      )
    ),
    <h2 className="display-4">{scheduleDetail.jobName}</h2>,
    React.createElement('div', { className: 'mb-2' },
      React.createElement(Link, {
        to: `/update/${encodeURIComponent(scheduleDetail.jobName)}/${scheduleDetail.triggerDetails[0].triggerKeyName}`,
        className: 'btn btn-sm btn-primary btn-light-primary mr-2'
      },
        <i className="fa fa-fw fa-pencil" />,
        ' Update'
      ),
      React.createElement(Link, {
        to: `/copy/${encodeURIComponent(scheduleDetail.jobName)}/${scheduleDetail.triggerDetails[0].triggerKeyName}`,
        className: 'btn btn-sm btn-primary btn-light-primary mr-2'
      },
        <i className="fa fa-fw fa-copy" />,
        ' Clone'
      ),
      <button className="btn btn-sm btn-primary btn-light-primary mr-2" type="button" onClick={() => onQuickRun(scheduleDetail.jobName} scheduleDetail.triggerDetails[0].triggerKeyName)>Quick Run</button>,
      <button className="btn btn-sm btn-danger" type="button" onClick={onDelete}>{<i className="fa fa-fw fa-trash" />,
        ' Delete'}</button>
    ),
    React.createElement('section', null,
      React.createElement('h3', { className: 'display-6' }, 'Schedule Info'),
      <table className="table table-striped table-fixed">{<tbody>{...$scheduleDetailInfoRows}</tbody>}</table>
    ),
    React.createElement('section', null,
      React.createElement('h3', { className: 'display-6' }, 'End Point Parameters'),
      <ParametersTable parameters={scheduleDetail.triggerDetails[0].overrideParameters} />
    )
  );
};

export default ScheduleDetail;
