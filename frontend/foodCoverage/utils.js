
export function convertParametersToString(parametersMap) {
  let parameterString = '';
  if (parametersMap && parametersMap.entries) {
    Object.keys(parametersMap.entries).forEach((key) => {
      const value = parametersMap.entries[key];
      parameterString += `"${key}":"${value}"&&`;
    });
  }
  return parameterString;
}

export default {
  convertParametersToString,
};
