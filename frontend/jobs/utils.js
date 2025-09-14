// To keep compatibility with IE, we should only use text format.
const DRAG_PAYLOAD_FORMAT = 'text';

export function populateDragData(event, effectAllowed, payload) {
  const dataTransfer = event.dataTransfer;
  dataTransfer.effectAllowed = effectAllowed;
  dataTransfer.setData(DRAG_PAYLOAD_FORMAT, JSON.stringify(payload));
}

export function retrieveDragData(event) {
  const payloadJson = event.dataTransfer.getData(DRAG_PAYLOAD_FORMAT);
  try {
    return JSON.parse(payloadJson);
  } catch (err) {
    console.log(`Fail to parse payload JSON from dataTransfer: ${payloadJson} (${err})`);
    return null;
  }
}

export function saveJobListByJobGroupOptions(jobGroupId, options) {
  const key = `JobListByJobGroupOptions_${jobGroupId}`;
  sessionStorage.setItem(key, JSON.stringify(options));
  return options;
}

export function loadJobListByJobGroupOptions(jobGroupId, defaultValue) {
  const key = `JobListByJobGroupOptions_${jobGroupId}`;
  const textValue = sessionStorage.getItem(key);
  if (!textValue) {
    return defaultValue;
  }
  try {
    return JSON.parse(textValue) || {};
  } catch (err) {
    console.log(`Fail to parse JSON text in session storage (${key}): ${textValue}`);
    sessionStorage.removeItem(key);
    return defaultValue;
  }
}


export default {
  populateDragData,
  retrieveDragData,
  saveJobListByJobGroupOptions,
  loadJobListByJobGroupOptions,
};
