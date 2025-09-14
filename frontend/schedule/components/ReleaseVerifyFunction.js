function getValidStyle() {
  return {
    success: 'has-success',
    valid: 'is-valid',
    feedback: 'valid-feedback',
    message: '',
  };
}

function getInValidStyle() {
  return {
    success: 'has-danger',
    valid: 'is-invalid',
    feedback: 'invalid-feedback',
    message: 'This value should not be empty.',
  };
}

function verifyFieldValue(fieldName, value, validStyle) {
  let style = getValidStyle();
  if (!value) {
    style = getInValidStyle();
  }

  let verifyResult;
  switch (fieldName) {
    case 'jobName':
      verifyResult = Object.assign({}, validStyle, { scheduleName: style });
      break;
    case 'cronExpression':
      verifyResult = Object.assign({}, validStyle, { cronExpression: style });
      break;
    case 'newCronExpression':
      verifyResult = Object.assign({}, validStyle, { newCronExpression: style });
      break;
    default:
      verifyResult = Object.assign({}, validStyle, { others: style });
      break;
  }
  return verifyResult;
}

function deleteItemByName(list, value) {
  const resultList = list.filter(item => item !== value);
  return resultList;
}

export default {
  verifyFieldValue,
  getValidStyle,
  getInValidStyle,
  deleteItemByName,
};
