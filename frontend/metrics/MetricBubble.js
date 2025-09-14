import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import queryString from 'query-string';
import DatePicker from 'react-datepicker';
import ReactEcharts from 'echarts-for-react';
import { isEqual } from 'lodash';

import metrics from '../backend/metrics';
import './style.css';

import LoadingIndicator from '../components/LoadingIndicator';
import ErrorAlert from '../components/ErrorAlert';

function last24Hours() {
  let currentTime = new Date().getTime();
  currentTime -= currentTime % 1000;
  return new Date(currentTime - 24 * 60 * 60 * 1000);
}

function getDefaultQuery() {
  return {
    testType: 'PANDORA',
    startDate: last24Hours().toISOString(),
    endDate: '',
  };
}

const MetricBubble = () => {
  const [metricsDetail, setMetricsDetail] = useState([]);
  const [filteringOptions, setFilteringOptions] = useState({});
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const query = useCallback(() => {
    const defaultQuery = getDefaultQuery();
    const searchQuery = queryString.parse(location.search);
    return Object.assign({}, defaultQuery, searchQuery);
  }, [location.search]);

  const getQueryUrl = useCallback((overrides) => {
    const nextQuery = Object.assign({}, query(), overrides);
    return `${location.pathname}?${queryString.stringify(nextQuery)}`;
  }, [query, location.pathname]);

  useEffect(() => {
    setMetricsDetail([]);
    setLoading(true);
    loadPipelineRequestPage();
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

  const loadPipelineRequestPage = useCallback(async () => {
    try {
      console.log('_loadPipelineRequestPage');
      const pipelineRequestPage = await metrics.getMetricBubblePipelinesList(query());
      setMetricsDetail(pipelineRequestPage);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load bubble metrics:', error);
      setMetricsDetail(error);
      setLoading(false);
    }
  }, [query]);

  const onChangeCreateTimeRange = useCallback((name, dateTime) => {
    setFilteringOptions(prevState => {
      const newOptions = Object.assign({}, prevState);
      if (!dateTime) {
        newOptions[name] = null;
      } else {
        newOptions[name] = dateTime.toISOString();
      }
      return newOptions;
    });
  }, []);

  const onChangeTestType = useCallback((event) => {
    const testType = event.target.value;
    setFilteringOptions(prevState => ({
      ...prevState,
      testType
    }));
  }, []);

  const onResetFilteringOptions = useCallback(() => {
    const defaultQuery = getDefaultQuery();
    const queryOverrides = {
      startDate: defaultQuery.startDate,
      endDate: defaultQuery.endDate,
      testType: defaultQuery.testType,
      page: 0,
    };
    setFilteringOptions({});
    const url = getQueryUrl(queryOverrides);
    navigate(url);
  }, [getQueryUrl, navigate]);

  const onApplyFilteringOptions = useCallback(() => {
    const queryOverrides = Object.assign({}, filteringOptions);
    Object.keys(queryOverrides).forEach((key) => {
      queryOverrides[key] = (queryOverrides[key] || '').trim();
    });

    queryOverrides.page = 0;
    const url = getQueryUrl(queryOverrides);
    navigate(url);
  }, [filteringOptions, getQueryUrl, navigate]);

  const renderFilteringOptions = () => {
    const filterOptions = Object.assign({}, query(), filteringOptions);

    let startDate = null;
    if (filterOptions.startDate) {
      startDate = new Date(filterOptions.startDate);
    }
    let endDate = null;
    if (filterOptions.endDate) {
      endDate = new Date(filterOptions.endDate);
    }

    return React.createElement('aside', null,
      React.createElement('h2', { className: 'display-6' }, 'Filtering Options'),
      React.createElement('div', { className: 'card' },
        React.createElement('div', { className: 'card-body' },
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
            React.createElement('label', { htmlFor: 'query-p-start-date' }, 'Start Date:'),
            <DatePicker id="query-p-start-date" className="form-control" selected={startDate} onChange={selected => onChangeCreateTimeRange('startDate'} selected) dateFormat="yyyy-MM-dd HH:mm" showTimeSelect timeFormat="HH:mm" timeIntervals={30} timeCaption="time" showMonthYearDropdown />
          ),
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', { htmlFor: 'query-p-end-date' }, 'End Date:'),
            <DatePicker id="query-p-end-date" className="form-control" selected={endDate} onChange={selected => onChangeCreateTimeRange('endDate'} selected) dateFormat="yyyy-MM-dd HH:mm" showTimeSelect timeFormat="HH:mm" timeIntervals={30} timeCaption="time" showMonthYearDropdown />
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

  const renderMetricLines = (metricsData) => {
    if (!metricsData || metricsData.length === 0) {
      return <div className="alert alert-warning">No bubble metrics data found for the selected criteria.</div>;
    }

    const rows = metricsData.map((metric, index) =>
      <tr key={index}>{<td>{metric.name || 'N/A'}</td>,
        <td>{metric.status || 'N/A'}</td>,
        <td>{metric.bubbleCount || 0}</td>,
        <td>{metric.elapsedTime || 'N/A'}</td>}</tr>
    );

    return React.createElement('div', { className: 'table-responsive' },
      React.createElement('table', { className: 'table table-striped' },
        React.createElement('thead', null,
          React.createElement('tr', null,
            <th>Name</th>,
            <th>Status</th>,
            <th>Bubble Count</th>,
            <th>Elapsed Time</th>
          )
        ),
        <tbody>{...rows}</tbody>
      )
    );
  };

  const generateChart = () => {
    if (!metricsDetail || metricsDetail.length === 0) {
      return <div>{<h3>No data available for bubble chart</h3>}</div>;
    }

    // Simplified bubble chart - you would implement full chart logic here
    const option = {
      title: {
        text: 'Bubble Metrics Chart'
      },
      xAxis: {
        name: 'Time'
      },
      yAxis: {
        name: 'Count'
      },
      series: [{
        name: 'Bubbles',
        data: [[10, 20, 30], [15, 25, 35], [20, 30, 40]],
        type: 'scatter',
        symbolSize: function (data) {
          return data[2];
        }
      }]
    };

    return React.createElement('div', null,
      <h3>Bubble Metrics Chart</h3>,
      React.createElement(ReactEcharts, { option: option, style: { height: '400px' } })
    );
  };

  if ((metricsDetail.length === 0) && (loading === true)) {
    return <LoadingIndicator text="Loading ..." />;
  }

  if (metricsDetail instanceof Error) {
    return <ErrorAlert error={metricsDetail} />;
  }

  const filteringOptionsElement = renderFilteringOptions();
  const rowList = renderMetricLines(metricsDetail);
  const charts = generateChart();
  const currentQuery = query();

  return React.createElement('div', null,
    filteringOptionsElement,
    React.createElement('div', { className: 'shadow p-3 mb-5 bg-white rounded' },
      charts
    ),
    React.createElement('div', { className: 'shadow p-3 mb-5 bg-white rounded' },
      React.createElement('nav', null,
        React.createElement('ol', { className: 'breadcrumb' },
          React.createElement('li', { className: 'breadcrumb-item active' }, 'Pipeline Metrics'),
          <li className="breadcrumb-item active">{currentQuery.testType}</li>,
          <li className="breadcrumb-item active">{`Start Time: ${currentQuery.startDate}, End Time: ${currentQuery.endDate}`}</li>
        )
      ),
      rowList
    )
  );
};

export default MetricBubble;