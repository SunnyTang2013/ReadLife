import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import Toggle from 'react-toggle';

import Statics from './Statics';

/**
 * This component renders a table showing a list of job config groups.
 */
const ScheduleListTable = ({ scheduleList, onSchedule, onQuickRun }) => {
  const handleSchedule = useCallback((schedule, triggerDetail) => {
    if (triggerDetail.triggerState === Statics.PAUSED
      || triggerDetail.triggerState === Statics.BLOCKED) {
      onSchedule(schedule, triggerDetail, Statics.RESUME);
    } else {
      onSchedule(schedule, triggerDetail, Statics.PAUSED);
    }
  }, [onSchedule]);

  const renderTriggerDetails = useCallback((schedule, triggerDetailList) => {
    if (triggerDetailList) {
      return triggerDetailList.map((triggerDetail, index) => {
        const actionFont = Statics.getActionFont(triggerDetail.triggerState);

        let nextFireTime = null;
        if (actionFont) {
          nextFireTime = triggerDetail.nextFireTime;
        } else {
          nextFireTime = 'PAUSED';
        }

        let scorchJobLink = null;
        if (schedule.method === 'submitJob') {
          scorchJobLink = React.createElement('a', {
            className: 'nav-link',
            target: '_blank',
            rel: 'noopener noreferrer',
            href: `${triggerDetail.serverUrl}/frontend/jobs/?filterScope=Job_Name&jobNameKeyword=${encodeURIComponent(schedule.jobName)}`
          }, schedule.jobName);
        } else if (triggerDetail.method === 'submitBatchWithBatchName') {
          scorchJobLink = React.createElement('a', {
            className: 'nav-link',
            target: '_blank',
            rel: 'noopener noreferrer',
            href: `${triggerDetail.serverUrl}/frontend/batches/list?name=${encodeURIComponent(schedule.jobName)}`
          }, schedule.jobName);
        } else if (triggerDetail.method === 'submitBatch') {
          scorchJobLink = React.createElement('a', {
            className: 'nav-link',
            target: '_blank',
            rel: 'noopener noreferrer',
            href: `${triggerDetail.serverUrl}/frontend/jobs/job/list-by-group-name/${encodeURIComponent(schedule.jobName)}`
          }, schedule.jobName);
        } else if (triggerDetail.method === 'submitBatchWithLabel') {
          scorchJobLink = React.createElement('a', {
            className: 'nav-link',
            target: '_blank',
            rel: 'noopener noreferrer',
            href: `${triggerDetail.serverUrl}/frontend/jobs/?filterScope=Label&jobNameKeyword=${encodeURIComponent(schedule.jobName)}`
          }, schedule.jobName);
        } else if (triggerDetail.method === 'submitPipeline') {
          scorchJobLink = React.createElement('a', {
            className: 'nav-link',
            target: '_blank',
            rel: 'noopener noreferrer',
            href: `${triggerDetail.serverUrl}/frontend/pipelines/list?name=${encodeURIComponent(schedule.jobName)}`
          }, schedule.jobName);
        }

        if (index === 0) {
          return React.createElement('tr', { key: triggerDetail.triggerKeyName },
            React.createElement('td', { 
              rowSpan: triggerDetailList.length, 
              className: 'align-middle' 
            }, scorchJobLink),
            <td rowSpan={triggerDetailList.length} className="align-middle">{schedule.jobNameDescription}</td>,
            React.createElement('td', null,
              React.createElement(Link, {
                to: `/detail/${encodeURIComponent(schedule.jobName)}/${triggerDetail.triggerKeyName}`
              }, triggerDetail.cronExpression)
            ),
            <td>{nextFireTime}</td>,
            <td>{triggerDetail.previousSuccessfulRun}</td>,
            <td>{triggerDetail.lastUpdateBy}</td>,
            <td>{<Toggle checked={actionFont} onChange={(}</td> => handleSchedule(schedule} triggerDetail) />
            ),
            React.createElement('td', null,
              React.createElement('button', {
                className: 'btn btn-primary btn-light-primary mr-2',
                type: 'button',
                onClick: () => onQuickRun(schedule.jobName, triggerDetail.triggerKeyName)
              }, 'Quick Run')
            )
          );
        }

        return React.createElement('tr', { key: triggerDetail.triggerKeyName },
          React.createElement('td', null,
            React.createElement(Link, {
              to: `/detail/${encodeURIComponent(schedule.jobName)}/${triggerDetail.triggerKeyName}`
            }, triggerDetail.cronExpression)
          ),
          <td>{nextFireTime}</td>,
          <td>{triggerDetail.previousSuccessfulRun}</td>,
          <td>{triggerDetail.lastUpdateBy}</td>,
          <td>{<Toggle checked={actionFont} onChange={(}</td> => handleSchedule(schedule} triggerDetail) />
          ),
          React.createElement('td', null,
            React.createElement('button', {
              className: 'btn btn-primary btn-light-primary mr-2',
              type: 'button',
              onClick: () => onQuickRun(schedule.jobName, triggerDetail.triggerKeyName)
            }, 'Quick Run')
          )
        );
      });
    }
    return null;
  }, [handleSchedule, onQuickRun]);

  const rows = scheduleList.map(schedule => {
    const triggerDetailList = schedule.triggerDetails;
    return renderTriggerDetails(schedule, triggerDetailList);
  });

  return React.createElement('table', { className: 'table solid-border-bottom' },
    React.createElement('thead', null,
      React.createElement('tr', null,
        <th>Job Name</th>,
        <th>Job Description</th>,
        <th>Cron Schedule</th>,
        <th>Next Execution Time</th>,
        <th>Previous Execution Time</th>,
        <th>Last Updated By</th>,
        <th>Action</th>,
        <th>Quick Run</th>
      )
    ),
    <tbody>{...rows}</tbody>
  );
};

export default ScheduleListTable;