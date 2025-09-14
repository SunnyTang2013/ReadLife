export function getExecutionSystemTypeList() {
  return [
    'VS',
    'GE',
    'DATAFLOW',
    'DUMMY',
    'SURFACE',
    'TOULON',
    'SCOMPARE',
    'RUNDECK',
    'XARA_MF',
    'SUM_VAR',
    'SILICOMP',
    'IQS',
    'GFX',
    'SNAP',
    'VAULT_REC',
  ];
}

/**
 * Returns an object representing the job config categories grouped by type (functional, technical).
 */
export function getJobConfigCategoriesByType() {
  return {
    functional: [
      'MARKET_DATA',
      'REPORT',
      'TRADE_SET',
      'PRICER',
      'SCENARIO',
      'OUTPUT',
      'TIME_OF_DAY',
      'DOWNSTREAM',
      'MANIFEST',
      'AD_GROUP',
      'EXECUTION_SYSTEM',
      'MISCELLANEOUS_GROUP',
      'QTF_SCOPE',
      'ENTITY',
    ],
    technical: [
      'AQS',
      'SUMMIT',
      'TRADE_CACHE',
      'XDS',
      'GOLDEN_EYE',
      'JOB_CONSUMER',
      'QUERY_TIME',
      'SOLACE',
      'DATAFLOW',
      'GOLDENEYE_GRIDLIB',
      'XARA_MANIFEST',
      'EXECUTION_ENV',
      'DS_BROKER',
      'RUNDECK_LAUNCHER',
      'SUMMIT_FILTER',
      'SILICON',
    ],
    legacy: [
      'MARKET_DATA_V1',
      'REPORT_V1',
      'TRADE_SET_V1',
    ],
  };
}

/**
 * Returns a list of valid location names and regions. See `Location` enum in Java.
 */
export function getLocationRegionList() {
  return [
    ['GLOBAL', 'GLOBAL'],

    ['HASEHK', 'HASE'],
    ['CADBSM', 'HBAM'],

    // HBAP (Asia-Pacific).
    ['HBMBKLH', 'HBAP'],
    ['HKBASYD', 'HBAP'],
    ['HSBCBKH', 'HBAP'],
    ['HSBCHK', 'HBAP'],
    ['HSBCJAK', 'HBAP'],
    ['HSBCMNL', 'HBAP'],
    ['HSBCMUM', 'HBAP'],
    ['HSBCSEL', 'HBAP'],
    ['HSBCSGH', 'HBAP'],
    ['HSBCSHH', 'HBAP'],
    ['HSBCTAI', 'HBAP'],
    ['HSBCTKY', 'HBAP'],

    // HBCA.
    ['CADRATES', 'HBCA'],

    // HBEU (Europe).
    ['LONDON', 'HBEU'],
    ['NEWYORK', 'HBEU'],
    ['HBEUTEL', 'HBEU'],
    ['HBMA', 'HBEU'],
    ['HHQ ', 'HBEU'],

    // HBFR (France).
    ['PARIS', 'HBFR'],
    ['HBFRATH', 'HBFR'],
    ['HBFRMAD', 'HBFR'],
    ['HBFRPRA', 'HBFR'],
    ['HBFRWAR', 'HBFR'],
    ['HBDEDUS', 'HBFR'],

    ['HBMEDUB', 'HBME'],
    ['HBMEDIFC', 'HBME'],

    ['MEXGCI', 'HBMX'],
    ['MEXRATES', 'HBMX'],
    ['MEXICO', 'HBMX'],

    // HBUS (USA).
    ['INFOTECHTEST', 'HBUS'],
    ['USBSM', 'HBUS'],
    ['USHBIO', 'HBUS'],
    ['USHSI', 'HBUS'],
    ['USOTH', 'HBUS'],
    ['USRATES', 'HBUS'],
  ];
}

export default {
  getExecutionSystemTypeList,
  getJobConfigCategoriesByType,
  getLocationRegionList,
};
