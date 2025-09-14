import React from 'react';
import ParametersTable from '../../components/ParametersTable';

function getMethodToTipMap() {
  return {
    submitJob: 'Submit Job',
    submitBatchWithBatchName: 'Submit Batch',
    submitBatch: 'Submit Batch With Hierarchy',
    submitBatchWithLabel: 'Submit Batch With Label',
    submitPipeline: 'Submit Pipeline',
  };
}

function getScheduleDetailInfo(scheduleReleaseDetails) {
  const methodToTipMap = getMethodToTipMap();
  if (!scheduleReleaseDetails) {
    return null;
  }

  const schedule = scheduleReleaseDetails.newCronExpression
    ? scheduleReleaseDetails.newCronExpression : scheduleReleaseDetails.cronExpression;
  
  const scheduleDetailInfo = [
    ['Name', scheduleReleaseDetails.jobName],
    ['Description', scheduleReleaseDetails.jobNameDescription],
    ['Schedule', schedule],
    ['timeZone', scheduleReleaseDetails.timeZone],
    ['Method', methodToTipMap[scheduleReleaseDetails.method]],
    ['Next Execution Time', scheduleReleaseDetails.nextFireTime],
    ['Previous Successful Run', scheduleReleaseDetails.previousSuccessfulRun],
    ['Skip Concurrent Run', scheduleReleaseDetails.skipConcurrentRun ? 'Y' : 'N'],
    ['Priority Run', scheduleReleaseDetails.priorityRun ? 'Y' : 'N'],
  ];

  const scheduleDetailInfoRows = scheduleDetailInfo.map(([name, value]) =>
    React.createElement('tr', { key: `info-${name}` },
      React.createElement('th', { 
        className: 'nowrap', 
        style: { width: '30%' } 
      }, name),
      <td>{value}</td>
    )
  );

  return React.createElement('div', null,
    React.createElement('section', null,
      React.createElement('h3', { className: 'display-6' }, 'Schedule Info'),
      <table className="table table-striped table-fixed">{<tbody>{...scheduleDetailInfoRows}</tbody>}</table>
    ),
    React.createElement('section', null,
      React.createElement('h3', { className: 'display-6' }, 'End Point Parameters'),
      scheduleReleaseDetails.overrideParameters && 
        <ParametersTable parameters={scheduleReleaseDetails.overrideParameters} />
    )
  );
}

export default getScheduleDetailInfo;