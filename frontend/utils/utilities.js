import moment from 'moment';


/**
 * Sorts the given array the case-insensitive way. This function returns a copy of the sorted array
 * while keeping the original array unchanged.
 */
export function sortCaseInsensitive(array, key = x => x) {
  const sortedArray = array.slice();
  sortedArray.sort((a, b) => {
    const lowerA = String(key(a)).toLowerCase();
    const lowerB = String(key(b)).toLowerCase();
    if (lowerA < lowerB) {
      return -1;
    }
    if (lowerA > lowerB) {
      return 1;
    }
    return 0;
  });
  return sortedArray;
}

export function sortCaseInsensitiveDesc(array, key = x => x) {
  const sortedArray = array.slice();
  sortedArray.sort((a, b) => {
    const lowerA = String(key(a)).toLowerCase();
    const lowerB = String(key(b)).toLowerCase();
    if (lowerA < lowerB) {
      return 1;
    }
    if (lowerA > lowerB) {
      return -1;
    }
    return 0;
  });
  return sortedArray;
}

export function sortDataArray(dataArray, key = x => x) {
  return dataArray.sort((a, b) => (new Date(key(a)) - new Date(key(b))));
}

export function sortNumberAsc(array, key = x => x) {
  const sortedArray = array.slice();
  sortedArray.sort((a, b) => {
    const numA = Number.parseInt(key(a), 10);
    const numB = Number.parseInt(key(b), 10);
    if (numA > numB) {
      return 1;
    }
    if (numA < numB) {
      return -1;
    }
    return 0;
  });
  return sortedArray;
}

export function slugify(text) {
  return text.replace(/[^\w-]+/g, '-');
}


export function truncateChars(text, maxLength) {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return `${text.substr(0, maxLength - 3)}...`;
}


export function formatTime(timeStr, format = 'YYYY-MM-DD HH:mm') {
  if (!timeStr) {
    return null;
  }
  let timeString = timeStr;
  if (!timeStr.includes('Z')) {
    timeString = `${timeStr}Z`;
  }
  return moment(timeString).format(format);
}

export function formatDuration(fromTimeStr, toTimeStr) {
  if (!fromTimeStr || !toTimeStr) {
    return null;
  }
  const seconds = moment(toTimeStr).unix() - moment(fromTimeStr).unix();

  if (seconds && seconds / 3600 > 1) {
    const hour = Math.floor(seconds / 3600);
    const mins = Math.ceil(seconds / 60) - hour * 60;
    if (mins !== 60) {
      return `${hour} hour ${mins} minutes`;
    }
  }
  return moment.duration(seconds, 'seconds').humanize();
}

export function formatTimeByFormatStr(timeStr, formatStr) {
  if (!timeStr || !formatStr) {
    return null;
  }
  return moment(timeStr).format(formatStr);
}

export function sortBySequencyAndName(a, b) {
  const numA = Number.parseInt(a.sequence, 10);
  const numB = Number.parseInt(b.sequence, 10);
  if (numA === numB) {
    if (a.name === b.name) {
      return 0;
    }
    if (a.name > b.name) {
      return 1;
    }
    return -1;
  }
  if (numA > numB) {
    return 1;
  }
  return -1;
}

export function extractFavouritesFromData(data, favouritesId) {
  if (!data || data.length === 0) {
    return [];
  }
  let results = data.filter(jobGroup => favouritesId.includes(jobGroup.id));
  for (let i = 0; i < data.length; i++) {
    const currentData = data[i];
    const childResults = extractFavouritesFromData(currentData.children, favouritesId);
    results = results.concat(childResults);
  }
  return sortCaseInsensitive(results, item => item.name);
}

export const exportToCsv = (filename, arrayOfJson) => {
  if (!arrayOfJson) {
    return;
  }

  const replacer = (key, value) => (value === null ? '' : value);
  const header = Object.keys(arrayOfJson[0]);
  let csv = arrayOfJson.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(';'));
  csv.unshift(header.join(';'));
  csv = csv.join('\r\n');

  const link = document.createElement('a');
  link.setAttribute('href', `data:text/csv;charset=utf-8,%EF%BB%BF${encodeURIComponent(csv)}`);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export function loadReleaseJobItemsFromLocalStorage(packageNameKey) {
  const textValue = localStorage.getItem(packageNameKey);
  if (!textValue) {
    return [];
  }
  try {
    return JSON.parse(textValue);
  } catch (err) {
    console.log(`Fail to parse JSON text in local storage (${packageNameKey}): ${textValue}`);
    localStorage.removeItem(packageNameKey);
    return [];
  }
}

export function updateReleaseJobItemsToLocalStorage(packageNameKey, releaseItems) {
  try {
    localStorage.setItem(packageNameKey, JSON.stringify(releaseItems));
  } catch (err) {
    console.log(`Fail to parse JSON Object in local storage (${packageNameKey}): ${releaseItems}`);
    localStorage.removeItem(packageNameKey);
  }
}

/**
 * scorch.ui.cobdate OR
 * as_of_date OR
 * market_date OR
 * trade_as_of_date, is within five calendar day from now on
 */
export function checkWithinFiveCalendarDays(asofday, marketdate, tradeasofdate, cobdate) {
  const FIVE = 5;
  const currentDate = parseInt(formatTime(new Date().toISOString(), 'YYYYMMDD'), 10);

  const formattedAsofdate = formatTimeByFormatStr(asofday, 'YYYYMMDD');
  const formattedMarketdate = formatTimeByFormatStr(marketdate, 'YYYYMMDD');
  const formattedTradeasofdate = formatTimeByFormatStr(tradeasofdate, 'YYYYMMDD');

  let isChanged = false;
  if (formattedAsofdate
    && currentDate - parseInt(formattedAsofdate, 10) <= FIVE) {
    isChanged = true;
  } else if (!isChanged && formattedMarketdate
    && currentDate - parseInt(formattedMarketdate, 10) <= FIVE) {
    isChanged = true;
  } else if (!isChanged && formattedTradeasofdate
    && currentDate - parseInt(formattedTradeasofdate, 10) <= FIVE) {
    isChanged = true;
  } else if (!isChanged && !formattedAsofdate
    && !formattedMarketdate && !formattedTradeasofdate) {
    // If asofdate, marketdate, tradeasofdate none of them presented, then we consider cobdate.
    if (cobdate === 'JobContext') {
      isChanged = true;
    } else if (currentDate - parseInt(cobdate, 10) <= FIVE) {
      isChanged = true;
    }
  }

  return isChanged;
}

export function removeSpecialCharacters(supportNotes) {
  if (supportNotes) {
    const supportNotesTrimmed = [];
    for (let i = 0; i < supportNotes.length; i++) {
      if (supportNotes[i] === '"') {
        // eslint-disable-next-line no-continue
        continue;
      } else if (i != supportNotes.length - 1
        && supportNotes[i] === '\\'
        && supportNotes[i] !== 'n') {
        // eslint-disable-next-line no-continue,no-plusplus
        i++; // skip forward two steps
      } else {
        supportNotesTrimmed.push(supportNotes[i]);
      }
    }
    return supportNotesTrimmed.join('');
  }
  return '';
}

export function getAssignmentGroupFromLocalStorage() {
  const assignmentGroupOnScorchRequest = localStorage.getItem('assignmentGroupOnScorchRequest');
  if (!assignmentGroupOnScorchRequest || assignmentGroupOnScorchRequest === '') {
    return '';
  }
  return assignmentGroupOnScorchRequest;
}

export function getRandomString() {
  return Math.random() * (100000 - 1) + 1;
}
