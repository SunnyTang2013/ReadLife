import React, { useState, useEffect, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import Toggle from 'react-toggle';
import Alert from './Alert';
import './style.css';
import AutoGrowTextarea from './AutoGrowTextarea';
import ParametersTable from './ParametersTable';
import { checkWithinFiveCalendarDays } from '../utils/utilities';

function getDefaultQuery() {
  return {
    openUseAdvanced: localStorage.getItem('openUseAdvanced') || false,
    as_of_date: localStorage.getItem('as_of_date') || '',
    market_date: localStorage.getItem('market_date') || '',
    trade_as_of_date: localStorage.getItem('trade_as_of_date') || '',
    tradeOption: localStorage.getItem('tradeOption') || 'INCLUDE',
    tradedIdList: localStorage.getItem('tradedIdList') || '',
    generateQIA: localStorage.getItem('generateQIA') || '',
    parameters: localStorage.getItem('parameters'),
  };
}


function isChangingManifestFilter(advancedParameters, parameters) {
  const manifestFilter = parameters.entries['goldeneye.manifestFilter'];
  const vaultSnapid = parameters.entries['vault.snapID'];
  const goldeneyeOptions = parameters.entries['goldeneye.options'];

  const asofdate = advancedParameters.as_of_date;
  const marketdate = advancedParameters.market_date;
  const tradeasofdate = advancedParameters.trade_as_of_date;
  const cobdate = sessionStorage.getItem('scorch.ui.cobdate');

  const isWithinFiveCalendarDays = checkWithinFiveCalendarDays(asofdate,
    marketdate,
    tradeasofdate,
    cobdate);

  return !!(isWithinFiveCalendarDays
    && (manifestFilter || vaultSnapid || goldeneyeOptions));
}

function getDateOption(dateOption) {
  switch (dateOption) {
    case 'asOfDate':
      return {
        labelName: 'Pricing Date',
        keyName: 'as_of_date',
        placeholderName: 'ASOFDATE',
      };
    case 'marketDate':
      return {
        labelName: 'Market Date',
        keyName: 'market_date',
        placeholderName: 'MARKETDATE',
      };
    case 'tradeAsOfDate':
      return {
        labelName: 'Trade As Of Date',
        keyName: 'trade_as_of_date',
        placeholderName: 'trade_as_of_date',
      };
    default:
      return null;
  }
}

function toDate(dateStr) {
  let date = null;
  if (dateStr) {
    date = new Date(dateStr);
  }
  return date;
}

function validateTradeIdList(tradeIds, generateQIA) {
  if (!tradeIds || tradeIds.length === 0) {
    return false;
  }
  if (generateQIA && tradeIds.split(',').length > 50) {
    return false;
  }
  return true;
}

function validateDate(date) {
  if (!date) {
    return false;
  }
  return true;
}

function inputRightOptions(advancedParameters, parameters) {
  let emptySomeDate = false;
  Object.keys(advancedParameters).forEach((key) => {
    if ((key === 'as_of_date' || key === 'market_date' || key === 'trade_as_of_date')
      && !validateDate(advancedParameters[key])) {
      emptySomeDate = true;
    }
  });

  let emptyAllDate = false;
  if (!validateDate(advancedParameters.as_of_date)
    && !validateDate(advancedParameters.market_date)
    && !validateDate(advancedParameters.trade_as_of_date)) {
    emptyAllDate = true;
  }

  if (!emptySomeDate || (emptyAllDate && validateTradeIdList(advancedParameters.tradedIdList))) {
    if (advancedParameters.generateQIA && advancedParameters.generateQIA !== 'false') {
      if (validateTradeIdList(advancedParameters.tradedIdList, true)
        && advancedParameters.tradeOption === 'INCLUDE') {
        return true;
      }
      return false;
    }
    return true;
  }
  if (emptyAllDate
    && advancedParameters.tradedIdList.length === 0
    && Object.keys(parameters.entries).length > 0
  ) {
    return true;
  }
  return false;
}

const Advanced = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [closeTradeOption, setCloseTradeOption] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [advancedParameters, setAdvancedParameters] = useState({});
  const [parameters, setParameters] = useState({ entries: {} });
  const [switchTab, setSwitchTab] = useState('Date');
  const [isManifestHintsOpen, setIsManifestHintsOpen] = useState(false);

  const onResetAdvanced = useCallback(() => {
    const defaultAdvancedParameters = getDefaultQuery();
    const overrideParameters = defaultAdvancedParameters.parameters;

    if (defaultAdvancedParameters.openUseAdvanced && defaultAdvancedParameters.openUseAdvanced !== 'false') {
      defaultAdvancedParameters.openUseAdvanced = true;
    } else {
      defaultAdvancedParameters.openUseAdvanced = false;
    }

    if (!validateDate(defaultAdvancedParameters.as_of_date)
      && !validateDate(defaultAdvancedParameters.market_date)
      && !validateDate(defaultAdvancedParameters.trade_as_of_date)
      && !validateTradeIdList((defaultAdvancedParameters.tradedIdList || '').trim())
      && !overrideParameters) {
      defaultAdvancedParameters.openUseAdvanced = false;
    }

    if (overrideParameters) {
      defaultAdvancedParameters.parameters = JSON.parse(overrideParameters);
    } else {
      defaultAdvancedParameters.parameters = { entries: {} };
    }

    const newParameters = defaultAdvancedParameters.parameters;
    const newSwitchTab = localStorage.getItem('switchTab') || 'Date';
    
    setAdvancedParameters(defaultAdvancedParameters);
    setParameters(newParameters);
    setSwitchTab(newSwitchTab);
  }, []);

  useEffect(() => {
    onResetAdvanced();
  }, [onResetAdvanced]);

  const onCancel = useCallback(() => {
    setIsModalOpen(false);
    setErrorMessage(null);
    setIsManifestHintsOpen(false);
    onResetAdvanced();
  }, [onResetAdvanced]);

  const onAdvanced = useCallback((event) => {
    event.preventDefault();
    const queryOverrides = Object.assign({}, advancedParameters);
    Object.keys(queryOverrides).forEach((key) => {
      if (key !== 'openUseAdvanced' && key !== 'generateQIA' && key !== 'parameters') {
        queryOverrides[key] = (queryOverrides[key] || '').trim();
      }
    });

    if (queryOverrides.openUseAdvanced
      && queryOverrides.openUseAdvanced !== 'false') {
      const currentAdvancedParameters = Object.assign({}, advancedParameters);
      if (!inputRightOptions(currentAdvancedParameters, parameters)) {
        if (currentAdvancedParameters.generateQIA && currentAdvancedParameters.generateQIA !== 'false') {
          setErrorMessage('To generate QIA, please fulfill dates and'
            + ' include at least 1 trade but no more than 50.');
        } else {
          setErrorMessage('Advanced on, please'
            + ' fulfill trade id list or all the dates.');
        }
        return;
      }
      if (!isManifestHintsOpen
        && isChangingManifestFilter(currentAdvancedParameters, parameters)) {
        setErrorMessage("You're changing Manifest generation query, please ensure"
          + " that you've known this won't impact PPE & QTF manifest or other users.");
        setIsManifestHintsOpen(true);
        return;
      }
    }

    Object.keys(queryOverrides).forEach((key) => {
      if (key !== 'parameters') {
        localStorage.setItem(key, queryOverrides[key]);
      } else {
        localStorage.setItem('parameters', JSON.stringify(parameters));
      }
    });

    setIsModalOpen(false);
    setIsManifestHintsOpen(false);
    setErrorMessage(null);
  }, [advancedParameters, parameters, isManifestHintsOpen]);

  const onChangeDate = useCallback((name, dateTime) => {
    setAdvancedParameters(prevState => {
      const newAdvancedParameters = Object.assign({}, prevState);
      if (dateTime) {
        newAdvancedParameters[name] = dateTime.toISOString();
      } else {
        newAdvancedParameters[name] = '';
      }
      return newAdvancedParameters;
    });
  }, []);

  const onChangeTradeOption = useCallback((event) => {
    const tradeOption = event.target.value;
    setAdvancedParameters(prevState => {
      const newAdvancedParameters = Object.assign({}, prevState, { tradeOption });
      return newAdvancedParameters;
    });
  }, []);

  const onChangeTrades = useCallback((event) => {
    const tradedIdList = event.target.value;
    setAdvancedParameters(prevState => {
      const newAdvancedParameters = Object.assign({}, prevState, { tradedIdList });
      return newAdvancedParameters;
    });
  }, []);

  const onOff = useCallback((event) => {
    const openUseAdvanced = event.target.checked;
    setAdvancedParameters(prevState => {
      const newAdvancedParameters = Object.assign({}, prevState, { openUseAdvanced });
      return newAdvancedParameters;
    });
    setErrorMessage(null);
  }, []);

  const onChangeGenerateQIA = useCallback((event) => {
    const generateQIA = event.target.checked;
    setAdvancedParameters(prevState => {
      const newAdvancedParameters = Object.assign({}, prevState, { generateQIA });
      if (generateQIA) {
        newAdvancedParameters.tradeOption = 'INCLUDE';
      }
      return newAdvancedParameters;
    });
    setCloseTradeOption(generateQIA);
    setErrorMessage(null);
  }, []);

  const onChangeParameters = useCallback((newParameters) => {
    setParameters(newParameters);
  }, []);

  const onSwitchTab = useCallback((newSwitchTab) => {
    localStorage.setItem('switchTab', newSwitchTab);
    setSwitchTab(newSwitchTab);
  }, []);

  const renderDate = useCallback((selectedDate, dateOption) => {
    const currentAdvancedParameters = Object.assign({}, advancedParameters);

    return (
      <div className="form-group row">
        <label htmlFor="advanced-pricing-date" className="col-sm-3 col-form-label">{dateOption.labelName}:</label>
        <div>
          <DatePicker
            selected={selectedDate}
            onChange={date => onChangeDate(`${dateOption.keyName}`, date)}
            className="form-control"
            dateFormat="yyyyMMdd"
            isClearable={currentAdvancedParameters.openUseAdvanced}
            disabled={!currentAdvancedParameters.openUseAdvanced}
            peekNextMonth
            showMonthDropdown
            showYearDropdown
          />
        </div>
      </div>
    );
  }, [advancedParameters, onChangeDate]);

  const renderModal = useCallback(() => {
    let generateQIA = false;
    if (advancedParameters.generateQIA && advancedParameters.generateQIA !== 'false') {
      generateQIA = true;
    }

    if (!isModalOpen) {
      return <div style={{ display: 'none' }} />;
    }

    const $header = (
      <div className="modal-header">
        <h3 className="lighter">
          Advanced Override And Filter
        </h3>
        <div className="pull-right text-primary" style={{ paddingTop: '7px' }}>
          <Toggle
            id="cheese-status"
            checked={advancedParameters.openUseAdvanced}
            onChange={onOff}
          />
        </div>
      </div>
    );

    const $trades = (
      <div className="form-group row">
        <label htmlFor="trade-id-list" className="col-sm-3 col-form-label">Trades/InstrumentId:</label>
        <div className="input-group col-sm-9" id="trade-id-list" style={{ paddingLeft: '0px' }}>
          <select
            disabled={closeTradeOption}
            id="trade-option"
            className="col-sm-2 form-control input-group-prepend"
            style={{ padding: '0px', height: 'auto' }}
            onChange={onChangeTradeOption}
            value={advancedParameters.tradeOption}
          >
            <option value="INCLUDE">Include</option>
            <option value="EXCLUDE">Exclude</option>
          </select>
          <AutoGrowTextarea
            className="form-control col-sm-10"
            name="trade-list"
            placeholder="123456P, 234567P, 345678P"
            value={advancedParameters.tradedIdList}
            onChange={onChangeTrades}
          />
        </div>
      </div>
    );

    const $generateQIA = (
      <div className="form-group row">
        <div className="col-sm-3">Generate QIA :</div>
        <div className="custom-control custom-checkbox form-inline">
          <input
            type="checkbox"
            className="custom-control-input"
            id="generate-qia"
            checked={generateQIA}
            onChange={onChangeGenerateQIA}
          />
          <label className="custom-control-label" htmlFor="generate-qia" />
        </div>
      </div>
    );

    return (
      <div className="overlayStyle">
        <div className="modal show modalStyle" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-width" role="document">
            <div className="modal-content">
              {$header}
              <div className="modal-body">
                <ul className="nav nav-tabs" id="advancedTab" role="tablist">
                  <li className="nav-item" role="presentation">
                    <a
                      className={`nav-link ${switchTab === 'Date' ? 'active' : ''} text-primary`}
                      id="date-tab"
                      data-toggle="tab"
                      href="#date"
                      role="tab"
                      aria-controls="date"
                      aria-selected={switchTab === 'Date'}
                      onClick={() => onSwitchTab('Date')}
                    >
                      Date and Trade Filter
                    </a>
                  </li>
                  <li className="nav-item" role="presentation">
                    <a
                      className={`nav-link ${switchTab === 'Parameters' ? 'active' : ''} text-primary`}
                      id="parameters-tab"
                      data-toggle="tab"
                      href="#parameters"
                      role="tab"
                      aria-controls="parameters"
                      aria-selected={switchTab === 'Parameters'}
                      onClick={() => onSwitchTab('Parameters')}
                    >
                      Parameters
                    </a>
                  </li>
                </ul>
                <div
                  className="tab-content"
                  id="advancedTabContent"
                >
                  <div
                    className={`tab-pane fade ${switchTab === 'Date' ? 'show active' : ''}`}
                    id="date"
                    role="tabpanel"
                    aria-labelledby="date-tab"
                  >
                    <form className="my-2">
                      <fieldset disabled={!advancedParameters.openUseAdvanced}>
                        {renderDate(toDate(advancedParameters.as_of_date), getDateOption('asOfDate'))}
                        {renderDate(toDate(advancedParameters.market_date), getDateOption('marketDate'))}
                        {renderDate(toDate(advancedParameters.trade_as_of_date), getDateOption('tradeAsOfDate'))}
                        {$trades}
                        {$generateQIA}
                      </fieldset>
                      {errorMessage && <Alert type="warning" text={errorMessage} />}
                    </form>
                  </div>
                  <div
                    className={`tab-pane fade ${switchTab === 'Parameters' ? 'show active' : ''}`}
                    id="parameters"
                    role="tabpanel"
                    aria-labelledby="parameters-tab"
                  >
                    <form className="my-2">
                      <fieldset disabled={!advancedParameters.openUseAdvanced}>
                        <div className="form-group">
                          <h3 className="display-6">Parameters</h3>
                          <ParametersTable
                            parameters={parameters}
                            onChange={onChangeParameters}
                          />
                        </div>
                        {errorMessage && <Alert type="warning" text={errorMessage} />}
                      </fieldset>
                    </form>
                  </div>
                </div>
              </div>
              <div className="modal-footer footer-content">
                <div className="form-group">
                  <button type="button" className="btn btn-primary mr-2" onClick={onAdvanced}>
                    OK
                  </button>
                  <button type="button" className="btn btn-default" onClick={onCancel}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }, [isModalOpen, advancedParameters, closeTradeOption, switchTab, errorMessage, parameters, 
      onOff, onChangeTradeOption, onChangeTrades, onChangeGenerateQIA, onSwitchTab, 
      renderDate, onChangeParameters, onAdvanced, onCancel]);

  const btnFontClass = advancedParameters.openUseAdvanced ? 'blinking' : '';

  return (
    <div>
      <button
        className="btn nav-link btn-outline-primary"
        type="button"
        onClick={() => setIsModalOpen(true)}
      >
        <span className={btnFontClass}><i className="fa fa-fw fa-sliders" /> Advanced</span>
      </button>

      {renderModal()}
    </div>
  );
};

export default Advanced;
