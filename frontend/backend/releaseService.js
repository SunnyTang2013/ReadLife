import rest from './rest';

export default {

  getReleaseList(query) {
    const url = '/api/v2/releases/list';
    return rest.get(url, query).then(response => rest.handleJSONResponse(response));
  },

  getRelease(releaseId) {
    const url = `/api/v2/releases/detail/${releaseId}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  exportUrlForJobGroupBundle(jobGroupId) {
    return `/api/v2/releases/export-job-group-bundle/${jobGroupId}`;
  },

  verifyJobGroupBundle(releaseName, jobGroupBundle) {
    const url = `/api/v2/releases/verify-job-group-bundle/${releaseName}`;
    return rest.post(url, jobGroupBundle).then(response => rest.handleJSONResponse(response));
  },

  releaseJobGroupBundle(releaseName, jobGroupBundle) {
    const url = `/api/v2/releases/release-job-group-bundle/${releaseName}`;
    return rest.post(url, jobGroupBundle).then(response => rest.handleJSONResponse(response));
  },

  addTagToConfigGroups(jobGroupId) {
    const url = `/api/v2/releases/add-prod-tag-to-config-groups/${jobGroupId}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  createReleasePackage(jiraKey, releasePackageInput) {
    const url = `/api/v2/releases/create-package/${jiraKey}`;
    return rest.post(url, releasePackageInput).then(response => rest.handleJSONResponse(response));
  },

  releasePackage(packageName, crNumber) {
    const url = `/api/v2/releases/publish-package/${packageName}/${crNumber}`;
    return rest.post(url).then(response => rest.handleJSONResponse(response));
  },

  checkPackageSensitive(packageName) {
    const url = `/api/v2/releases/verify-release-items-before-release/${packageName}`;
    return rest.post(url).then(response => rest.handleJSONResponse(response));
  },

  checkPackageDetailSensitive(env, releasePackageInput) {
    const url = `/api/v2/releases/verify-release-items-before-create/${env}`;
    return rest.post(url, releasePackageInput).then(response => rest.handleJSONResponse(response));
  },

  analyzePackageFromCreate(env, packageInput) {
    const url = `/api/v2/releases/verify-release-items/${env}`;
    return rest.post(url, packageInput).then(response => rest.handleJSONResponse(response));
  },

  analyzePackageFromUpdate(env, packageInput, packageName) {
    const url = `/api/v2/releases/verify-release-items/${env}/${packageName}`;
    return rest.post(url, packageInput).then(response => rest.handleJSONResponse(response));
  },

  listPackage(createDate) {
    const url = `/api/v2/releases/list-package/${createDate}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  packageDetail(packageName) {
    const url = `/api/v2/releases/package-detail/${packageName}`;
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

  compareVersionsFromCreate(env, packageInput) {
    const url = `/api/v2/releases/get-packages-for-comparison/${env}`;
    return rest.post(url, packageInput).then(response => rest.handleJSONResponse(response));
  },

  compareVersionsFromUpdate(env, packageInput, packageName) {
    const url = `/api/v2/releases/get-packages-for-comparison/${env}/${packageName}`;
    return rest.post(url, packageInput).then(response => rest.handleJSONResponse(response));
  },

  rollbackPackage(packageName) {
    const url = `/api/v2/releases/rollback/${packageName}`;
    return rest.post(url).then(response => rest.handleJSONResponse(response));
  },

  backupPackage(packageBackupInput) {
    const url = '/api/v2/releases/backup-package';
    return rest.post(url, packageBackupInput).then(response => rest.handleJSONResponse(response));
  },

  delBackupPackage(packageBackupInput) {
    const url = '/api/v2/releases/del-backup-package';
    return rest.delete(url, packageBackupInput).then(response => rest.handleJSONResponse(response));
  },

  listBackupPackages() {
    const url = '/api/v2/releases/list-backup-packages';
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

};
