export function getBatchRequestProgress(batchRequest) {
  if (batchRequest.totalCount <= 0) {
    return '0';
  }
  const doneCount = batchRequest.successCount
    + batchRequest.failureCount + batchRequest.ignoreCount;
  const percentage = (doneCount * 100) / batchRequest.totalCount;
  if (percentage >= 100) {
    return '100';
  }
  // If it's below 100%, set an upper bound of 95%. This will make the progress bar visually clear
  // that it is not yet complete.
  if (percentage >= 95) {
    return '95';
  }
  return `${Math.floor(percentage)}`;
}

export default {
  getBatchRequestProgress,
};
