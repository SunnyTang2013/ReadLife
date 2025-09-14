import rest from './rest';
import { addCobDateParam } from './jobExecution';

export default {

  getScheduleList(query) {
    const url = '/api/v2/scheduling/schedules';
    return rest.get(url, query).then(response => rest.handleJSONResponse(response));
  },

  getScheduleDetail(jobName, triggerKeyName) {
    const url = `/api/v2/scheduling/detail/${jobName}/${triggerKeyName}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  getSchedule(jobName) {
    const url = `/api/v2/scheduling/detail/${encodeURIComponent(jobName)}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  updateSchedule(schedule) {
    const url = '/api/v2/scheduling/update-schedule';
    return rest.put(url, schedule).then(response => rest.handleJSONResponse(response));
  },

  deleteSchedule(jobName, triggerKeyName) {
    const url = `/api/v2/scheduling/deleteSchedule/${jobName}/${triggerKeyName}`;
    return rest.delete(url).then(response => rest.handleJSONResponse(response));
  },

  createSchedule(schedule) {
    const url = '/api/v2/scheduling/create-schedule';
    return rest.post(url, schedule).then(response => rest.handleJSONResponse(response));
  },

  getNextFireTime(cron, timeZone) {
    const url = `/api/v2/scheduling/nextFireTime?scheduleTime=${cron}&timeZone=${timeZone}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  getTimezoneList() {
    const url = '/api/v2/scheduling/listTimezones';
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  pauseJobTrigger(jobName, triggerKeyName) {
    const url = `/api/v2/scheduling/pauseJobTrigger/${encodeURIComponent(jobName)}/${triggerKeyName}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  resumeJobTrigger(jobName, triggerKeyName) {
    const url = `/api/v2/scheduling/resumeJobTrigger/${encodeURIComponent(jobName)}/${triggerKeyName}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  submitJob(jobName, triggerKeyName) {
    const url = `/api/v2/scheduling/submit/${encodeURIComponent(jobName)}/${triggerKeyName}`;
    return rest.post(url, addCobDateParam()).then(response => rest.handleJSONResponse(response));
  },

  getScheduleHistories(query) {
    const url = '/api/v2/scheduling/schedule-history/list';
    return rest.get(url, query).then(response => rest.handleJSONResponse(response));
  },

  compareSchedule(detailsList) {
    const url = '/api/v2/scheduling/compare-release-schedule';
    return rest.post(url, detailsList).then(response => rest.handleJSONResponse(response));
  },

  createScheduleReleasePackage(detailsList) {
    const url = '/api/v2/scheduling/create-release-package';
    return rest.post(url, detailsList).then(response => rest.handleJSONResponse(response));
  },

  getScheduleReleasePackage(packageVersion) {
    const url = `/api/v2/scheduling/get-release-package/${packageVersion}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

};
