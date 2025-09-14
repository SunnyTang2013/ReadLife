import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isEqual } from 'lodash';
import queryString from 'query-string';

import metrics from '../backend/metrics';
import './style.css';
import LoadingIndicator from '../components/LoadingIndicator';
import ErrorAlert from '../components/ErrorAlert';

function getDefaultQuery() {
  return {
    testType: 'PANDORA',
    pandoraBuildKey: '',
  };
}

const MetricTradeError = () => {
  const [testType, setTestType] = useState('PANDORA');
  const [loading, setLoading] = useState(false);
  const [metricsDetail, setMetricsDetail] = useState([]);
  const [filteringOptions, setFilteringOptions] = useState({
    testType: 'PANDORA',
    pandoraBuildKey: '',
  });

  const navigate = useNavigate();
  const location = useLocation();

  const query = useCallback(() => {
    const defaultQuery = getDefaultQuery();
    const searchQuery = queryString.parse(location.search);
    return Object.assign({}, defaultQuery, filteringOptions, searchQuery);
  }, [location.search, filteringOptions]);

  const getQueryUrl = useCallback((overrides) => {
    const nextQuery = Object.assign({}, query(), overrides);
    return `${location.pathname}?${queryString.stringify(nextQuery)}`;
  }, [query, location.pathname]);

  useEffect(() => {
    console.log('filtering mount');
    const filterOptions = query();

    if (filterOptions.pandoraBuildKey && filterOptions.testType) {
      setLoading(true);
      setFilteringOptions(filterOptions);
      loadMetricsById(filterOptions.pandoraBuildKey, filterOptions.testType);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.keyCode === 13 && e.target.id && e.target.id.indexOf('query-p') !== -1) {
        onApplyFilteringOptions();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const loadMetricsById = useCallback(async (id, testTypeValue) => {
    try {
      const data = await metrics.getTradeErrorsById(id, testTypeValue);
      setMetricsDetail(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load trade errors:', error);
      setMetricsDetail(error);
      setLoading(false);
    }
  }, []);

  const onChangePandoraBuildKey = useCallback((event) => {
    const pandoraBuildKey = event.target.value;
    setFilteringOptions(prevState => ({
      ...prevState,
      pandoraBuildKey
    }));
  }, []);

  const onChangeTestType = useCallback((event) => {
    const testType = event.target.value;
    setFilteringOptions(prevState => ({
      ...prevState,
      testType
    }));
  }, []);

  const onChangePandoraVersion = useCallback((event) => {
    const pandoraVersion = event.target.value;
    console.log('pandoraVersion', pandoraVersion);
  }, []);

  const onResetFilteringOptions = useCallback(() => {
    setFilteringOptions({});
    
    const queryOverrides = {
      pandoraBuildKey: '',
      testType: 'PANDORA',
    };

    const url = getQueryUrl(queryOverrides);
    navigate(url);
  }, [getQueryUrl, navigate]);

  const onApplyFilteringOptions = useCallback(() => {
    const queryOverrides = Object.assign({}, filteringOptions);
    const url = getQueryUrl(queryOverrides);
    navigate(url);
  }, [filteringOptions, getQueryUrl, navigate]);

  const renderFilteringOptions = () => {
    const filterOptions = Object.assign({}, query(), filteringOptions);

    return React.createElement('aside', null,
      React.createElement('h2', { className: 'display-6' }, 'Filtering Options'),
      React.createElement('div', { className: 'card' },
        React.createElement('div', { className: 'card-body' },
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', { htmlFor: 'query-p-build-key' }, 'Pandora Build Key:'),
            <input id="query-p-build-key" className="form-control" value={filterOptions.pandoraBuildKey || ''} onChange={onChangePandoraBuildKey} />
          ),
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', { htmlFor: 'query-p-test-type' }, 'Test Type:'),
            React.createElement('select', {
              id: 'query-p-test-type',
              className: 'form-control',
              value: filterOptions.testType || 'PANDORA',
              onChange: onChangeTestType
            },
              React.createElement('option', { value: 'PANDORA' }, 'PANDORA'),
              <option value="OTHER">OTHER</option>
            )
          ),
          React.createElement('div', { className: 'form-group' },
            React.createElement('button', {
              type: 'button',
              className: 'btn btn-primary mr-2',
              onClick: onApplyFilteringOptions
            }, 'Apply'),
            <button type="button" className="btn btn-light" onClick={onResetFilteringOptions}>Reset</button>
          )
        )
      )
    );
  };

  const renderTradeErrors = (errorData) => {
    if (!errorData || errorData.length === 0) {
      return <div>{<h2>No trade errors data available</h2>}</div>;
    }

    const rows = errorData.map((error, index) =>
      <tr key={index}>{<td>{error.tradeId || 'N/A'}</td>,
        <td>{error.errorType || 'N/A'}</td>,
        <td>{error.errorMessage || 'N/A'}</td>,
        <td>{error.timestamp || 'N/A'}</td>,
        <td>{error.severity || 'N/A'}</td>}</tr>
    );

    return React.createElement('div', null,
      React.createElement('h2', { className: 'display-4' }, 'Trade Errors'),
      React.createElement('div', { className: 'table-responsive' },
        React.createElement('table', { className: 'table table-striped' },
          React.createElement('thead', null,
            React.createElement('tr', null,
              <th>Trade ID</th>,
              <th>Error Type</th>,
              <th>Error Message</th>,
              <th>Timestamp</th>,
              <th>Severity</th>
            )
          ),
          <tbody>{...rows}</tbody>
        )
      ),
      React.createElement('div', { className: 'mt-3' },
        React.createElement('p', { className: 'text-muted' },
          `Total errors found: ${errorData.length}`
        )
      )
    );
  };

  console.log('filtering 1');

  if ((metricsDetail.length === 0) && (loading === true)) {
    return <LoadingIndicator text="Loading ..." />;
  }

  if (metricsDetail instanceof Error) {
    return <ErrorAlert error={metricsDetail} />;
  }

  const filteringOptionsElement = renderFilteringOptions();
  let tableErrors = <h2>We will show Results here</h2>;

  // Speed up so we start generating table only once all available
  if (!loading) {
    tableErrors = renderTradeErrors(metricsDetail);
  }

  return React.createElement('div', null,
    filteringOptionsElement,
    React.createElement('div', { className: 'shadow p-3 mb-5 bg-white rounded' },
      tableErrors
    )
  );
};

export default MetricTradeError;