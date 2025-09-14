import PropTypes from 'prop-types';

// This file provides prop types for Scorch DTO objects.

function currentUser() {
  // The shape of the `currentUser` property with minimal requirements.
  return PropTypes.shape({
    username: PropTypes.string.isRequired,
    canRead: PropTypes.bool.isRequired,
    canExecute: PropTypes.bool.isRequired,
    canWrite: PropTypes.bool.isRequired,
  });
}

function parameters() {
  return PropTypes.shape({
    // An object with property values of string type.
    entries: PropTypes.objectOf(PropTypes.string.isRequired).isRequired,
  });
}

function executionSystem() {
  return PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string.isRequired,
    baseUrl: PropTypes.string.isRequired,
    maxRunning: PropTypes.string.isRequired,
  });
}

function jobGroupSummary() {
  return PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string.isRequired,
    parentId: PropTypes.number,
  });
}

function jobGroupTree() {
  return PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string.isRequired,
    parentId: PropTypes.number,
    // The `children` property is an array of `jobGroupTree` itself.
    // But we can't make a recursive reference, or there will be an infinite loop.
    // TODO: There should be a solution to this!
    children: PropTypes.arrayOf(PropTypes.object).isRequired,
  });
}

function forest() {
  return PropTypes.shape({
    name: PropTypes.string.isRequired,
    parentName: PropTypes.string,
    // The `children` property is an array of `jobGroupTree` itself.
    // But we can't make a recursive reference, or there will be an infinite loop.
    // TODO: There should be a solution to this!
    children: PropTypes.arrayOf(PropTypes.object).isRequired,
  });
}

function jobConfigGroup() {
  return PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    description: PropTypes.string,
    parameters: parameters(),
    createTime: PropTypes.string,
    updateTime: PropTypes.string,
    jobCount: PropTypes.number,
    contextCount: PropTypes.number,
  });
}

function jobContext() {
  return PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string.isRequired,
    executionSystem: executionSystem(),
    configGroups: PropTypes.arrayOf(jobConfigGroup()).isRequired,
  });
}

function label() {
  return PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string.isRequired,
  });
}

function job() {
  return PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    priority: PropTypes.number.isRequired,
    owner: PropTypes.string.isRequired,
    jobGroups: PropTypes.arrayOf(jobGroupSummary()).isRequired,
    context: jobContext(),
    configGroups: PropTypes.arrayOf(jobConfigGroup()).isRequired,
    variables: parameters().isRequired,
    labels: PropTypes.arrayOf(label()).isRequired,
    location: PropTypes.string.isRequired,
    jobScope: PropTypes.string.isRequired,
    jobConsumer: PropTypes.string.isRequired,
  });
}

function jobRequest() {
  return PropTypes.shape({
    id: PropTypes.number.isRequired,
    jobId: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    executionType: PropTypes.string.isRequired,
    executionSystem: executionSystem().isRequired,
    batchUuid: PropTypes.string.isRequired,
    jobGroupName: PropTypes.string,
    createTime: PropTypes.string.isRequired,
    startTime: PropTypes.string,
    endTime: PropTypes.string,
    status: PropTypes.string.isRequired,
    stage: PropTypes.string.isRequired,
    stageTransition: PropTypes.arrayOf(PropTypes.string.isRequired),
    outputs: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string.isRequired,
      filename: PropTypes.string.isRequired,
      quantity: PropTypes.string,
      totalBytes: PropTypes.number,
    })).isRequired,
    alertCount: PropTypes.number,
    tradeErrorCount: PropTypes.number,
    jobScope: PropTypes.string,
    jobConsumer: PropTypes.string,
  });
}

function batchRequest() {
  return PropTypes.shape({
    id: PropTypes.number.isRequired,
    startTime: PropTypes.string,
    endTime: PropTypes.string,
    lastJobRequestEndTime: PropTypes.string,
    name: PropTypes.string.isRequired,
    failureCount: PropTypes.number.isRequired,
    ongoingCount: PropTypes.number.isRequired,
    pendingCount: PropTypes.number.isRequired,
    successCount: PropTypes.number.isRequired,
    ignoreCount: PropTypes.number,
    totalCount: PropTypes.number.isRequired,
    usedSeconds: PropTypes.number,
    runningSequence: PropTypes.number,
    status: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    uuid: PropTypes.string.isRequired,
    suberrorsCount: PropTypes.number,
  });
}

function batchAvgElapsedTime() {
  return PropTypes.shape({
    avgElapsedTime: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    nowTime: PropTypes.string.isRequired,
  });
}

function pageOf(pageItemPropType) {
  const pageShape = {
    totalPages: PropTypes.number.isRequired,
    totalElements: PropTypes.number.isRequired,
    numberOfElements: PropTypes.number.isRequired,
    number: PropTypes.number.isRequired,
    first: PropTypes.bool.isRequired,
    last: PropTypes.bool.isRequired,
  };
  if (pageItemPropType) {
    pageShape.content = PropTypes.arrayOf(pageItemPropType).isRequired;
  }
  return PropTypes.shape(pageShape);
}

function page() {
  return pageOf(null);
}

function releaseItems() {
  return PropTypes.shape({
    type: PropTypes.string,
    name: PropTypes.string,
  });
}

function triggerDetail() {
  return PropTypes.shape({
    skipConcurrentRun: PropTypes.bool,
    applicationName: PropTypes.string,
    cronExpression: PropTypes.string,
    overrideParameters: parameters(),
    scheduleTime: PropTypes.string,
    timeZone: PropTypes.string,
    nextFireTime: PropTypes.string,
    previousSuccessfulRun: PropTypes.string,
    createBy: PropTypes.string,
    lastUpdateBy: PropTypes.string,
    createTime: PropTypes.string,
    updateTime: PropTypes.string,
    triggerState: PropTypes.string,
    triggerKeyName: PropTypes.string,
    serverUrl: PropTypes.string,
  });
}

function schedule() {
  return PropTypes.shape({
    jobName: PropTypes.string.isRequired,
    jobNameDescription: PropTypes.string,
    applicationName: PropTypes.string,
    triggerDetails: PropTypes.arrayOf(triggerDetail()),
  });
}

function hierarchyBundle() {
  return PropTypes.shape({
    name: PropTypes.string.isRequired,
    maxRunningJobs: PropTypes.number,
    parentJobGroup: PropTypes.shape({
      className: PropTypes.string.isRequired,
      naturalKey: PropTypes.string.isRequired,
    }),
  });
}

function jobAvgElapsedTime() {
  return PropTypes.shape({
    jobId: PropTypes.number.isRequired,
    avgElapsedTime: PropTypes.number.isRequired,
    nowTime: PropTypes.string.isRequired,
  });
}

function jobPlainInfo() {
  return PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    priority: PropTypes.number.isRequired,
    owner: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    type: PropTypes.string,
  });
}

function batchSummary() {
  return PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string.isRequired,
    overriddenParameters: parameters(),
    updateTime: PropTypes.string,
    owner: PropTypes.string,
    jobCount: PropTypes.number,
    pipelineCount: PropTypes.number,
    type: PropTypes.string,
    originalId: PropTypes.number,
    originalName: PropTypes.string,
    jobPlainInfos: PropTypes.arrayOf(jobPlainInfo()).isRequired,
    entity: PropTypes.string,
    containInJobName: PropTypes.string,
    notContainInJobName: PropTypes.string,
    configGroupVariables: parameters(),
    adGroups: PropTypes.arrayOf(PropTypes.string),
    rodParameters: parameters(),
  });
}

function pipelineNodeSummary() {
  return PropTypes.shape({
    id: PropTypes.number,
    pipelineId: PropTypes.number,
    parentPipelineId: PropTypes.number,
    sequence: PropTypes.number.isRequired,
    batchSummary: batchSummary(),
    lightRun: PropTypes.string,
  });
}

function pipelineSummary() {
  return PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    isParent: PropTypes.bool,
    owner: PropTypes.string,
    description: PropTypes.string,
    createTime: PropTypes.string,
    pipelineNodeSummaries: PropTypes.arrayOf(pipelineNodeSummary()).isRequired,
  });
}

function profileNodeSummary() {
  return PropTypes.shape({
    id: PropTypes.number,
    profileId: PropTypes.number,
    pipelineId: PropTypes.number,
    batchSummary: batchSummary(),
  });
}
function profileSummary() {
  return PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    isParent: PropTypes.bool,
    owner: PropTypes.string,
    description: PropTypes.string,
    createTime: PropTypes.string,
    profileNodeSummaries: PropTypes.arrayOf(profileNodeSummary()).isRequired,
  });
}

function quantAqsCoverage() {
  return PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string.isRequired,
    jobName: PropTypes.string,
    lastUpdatedBy: PropTypes.string,
    createdBy: PropTypes.string,
    description: PropTypes.string,
    createTime: PropTypes.string,
    updateTime: PropTypes.string,
    location: PropTypes.string,
    parameters: parameters(),
  });
}

function searchCriteria() {
  return PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string.isRequired,
    jobName: PropTypes.string,
    lastUpdatedBy: PropTypes.string,
    createdBy: PropTypes.string,
    description: PropTypes.string,
    createTime: PropTypes.string,
    updateTime: PropTypes.string,
    location: PropTypes.string,
    parameters: parameters(),
  });
}


function compareReport() {
  return PropTypes.shape({
    addNewItems: PropTypes.number.isRequired,
    updatedItems: PropTypes.number.isRequired,
    unMatchItemsMap: PropTypes.objectOf(PropTypes.array).isRequired,
    releaseItems: PropTypes.arrayOf(PropTypes.object).isRequired,
    newItemNames: PropTypes.arrayOf(PropTypes.string).isRequired,
  });
}

function runNotice() {
  return PropTypes.shape({
    id: PropTypes.number,
    refType: PropTypes.string.isRequired,
    typeName: PropTypes.string.isRequired,
    enableJenkins: PropTypes.bool.isRequired,
    callJenkinsParameters: parameters(),
    enableSymphony: PropTypes.bool.isRequired,
    symphonyRoom: PropTypes.string.isRequired,
    lastUpdatedBy: PropTypes.string.isRequired,
    updateTime: PropTypes.string,
  });
}

function chartData() {
  return PropTypes.shape({
    dimensions: PropTypes.arrayOf(PropTypes.string).isRequired,
    data: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  });
}

function ganttData() {
  return PropTypes.shape({
    requestNames: chartData(),
    requestList: chartData(),
  });
}

function resubmissionRule() {
  return PropTypes.shape({
    seq: PropTypes.string.isRequired,
    rule: PropTypes.string.isRequired,
    errorFrom: PropTypes.string.isRequired,
    enable: PropTypes.string.isRequired,
  });
}

function resubmissionSetting() {
  return PropTypes.shape({
    id: PropTypes.number,
    rules: PropTypes.arrayOf(resubmissionRule()),
    maxRetry: PropTypes.number,
    retryDelayMin: PropTypes.number,
    enable: PropTypes.string,
    updateTime: PropTypes.string,
    updateBy: PropTypes.string,
  });
}

function scheduleReleaseDetails() {
  return PropTypes.shape({
    applicationName: PropTypes.string.isRequired,
    jobName: PropTypes.string.isRequired,
    cronExpression: PropTypes.string.isRequired,
    method: PropTypes.string,
    overrideParameters: parameters(),
    timeZone: PropTypes.string,
    skipConcurrentRun: PropTypes.bool,
    priorityRun: PropTypes.bool,
    action: PropTypes.string,
    newCronExpression: PropTypes.string,
    updateFields: PropTypes.arrayOf(PropTypes.string),
  });
}

function scheduleCompareEntities() {
  return PropTypes.shape({
    jobName: PropTypes.string.isRequired,
    schedule: PropTypes.string.isRequired,
    action: PropTypes.string.isRequired,
    existsRef: PropTypes.bool.isRequired,
    scheduleDetails: scheduleReleaseDetails(),
    scheduleReleaseDetails: scheduleReleaseDetails().isRequired,
    compareItems: PropTypes.arrayOf(PropTypes.object),
  });
}

function scheduleComparison() {
  return PropTypes.shape({
    create: PropTypes.number.isRequired,
    update: PropTypes.number.isRequired,
    delete: PropTypes.number.isRequired,
    compareEntities: PropTypes.arrayOf(scheduleCompareEntities()).isRequired,
  });
}

export default {
  currentUser,
  executionSystem,
  job,
  jobConfigGroup,
  jobContext,
  jobGroupSummary,
  jobGroupTree,
  jobRequest,
  batchRequest,
  batchAvgElapsedTime,
  page,
  pageOf,
  parameters,
  releaseItems,
  triggerDetail,
  schedule,
  hierarchyBundle,
  jobAvgElapsedTime,
  label,
  jobPlainInfo,
  batchSummary,
  pipelineNodeSummary,
  pipelineSummary,
  profileSummary,
  quantAqsCoverage,
  searchCriteria,
  compareReport,
  runNotice,
  ganttData,
  resubmissionRule,
  resubmissionSetting,
  scheduleComparison,
  forest,
};
