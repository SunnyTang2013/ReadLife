import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import queryString from 'query-string';
import DatePicker from 'react-datepicker';
import ReactEcharts from 'echarts-for-react';
import { isEqual } from 'lodash';

import metrics from '../backend/metrics';
import './style.css';
import colors from './colors';

import LoadingIndicator from '../components/LoadingIndicator';
import ErrorAlert from '../components/ErrorAlert';

function last24Hours() {
  let currentTime = new Date().getTime();
  currentTime -= currentTime % 1000;
  return new Date(currentTime - 24 * 60 * 60 * 1000);
}

function getDefaultQuery() {
  return {
    name: '',
    pipelineRequestUUID: '',
    showRootRequest: true,
    minCreateTime: last24Hours().toISOString(),
    maxCreateTime: '',
    status: '',
    username: '',
    pandoraBuildKey: '',
    pandoraVersion: '',
    sort: 'createTime,desc',
    page: 0,
    size: 500,
  };
}

const MetricQtf = () => {
  const [pandoraBuildKey, setPandoraBuildKey] = useState('');
  const [pandoraVersion, setPandoraVersion] = useState('');
  const [distinctNames, setDistinctNames] = useState([]);
  const [metricsDetail, setMetricsDetail] = useState(null);
  const [filteringOptions, setFilteringOptions] = useState({});

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
      const pipelineRequestPage = await metrics.getMetricQtfPipelinesList(query());
      setMetricsDetail(pipelineRequestPage);
      filterFeeds(pipelineRequestPage);
    } catch (error) {
      console.error('Failed to load pipeline metrics:', error);
      setMetricsDetail(error);
    }
  }, [query]);

  const filterFeeds = useCallback((pipelineRequestPage) => {
    if (!pipelineRequestPage || !pipelineRequestPage.content) {
      return;
    }

    const tempListNames = pipelineRequestPage.content.map(item => item.name);
    const distinctNamesFiltered = tempListNames.filter((item, idx) => (tempListNames.indexOf(item) === idx));
    setDistinctNames(distinctNamesFiltered);
  }, []);

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

  const onChangeShowRootRequestCheck = useCallback((event) => {
    const showRootRequest = event.target.checked;
    setFilteringOptions(prevState => ({
      ...prevState,
      showRootRequest
    }));
  }, []);

  const onChangeName = useCallback((event) => {
    const name = event.target.value;
    setFilteringOptions(prevState => ({
      ...prevState,
      name
    }));
  }, []);

  const onChangePandoraVersion = useCallback((event) => {
    const pandoraVersion = event.target.value;
    setFilteringOptions(prevState => ({
      ...prevState,
      pandoraVersion
    }));
  }, []);

  const onChangePandoraBuildKey = useCallback((event) => {
    const pandoraBuildKey = event.target.value;
    setFilteringOptions(prevState => ({
      ...prevState,
      pandoraBuildKey
    }));
  }, []);

  const onChangeStatus = useCallback((event) => {
    const status = event.target.value;
    setFilteringOptions(prevState => ({
      ...prevState,
      status
    }));
  }, []);

  const onResetFilteringOptions = useCallback(() => {
    const defaultQuery = getDefaultQuery();
    const queryOverrides = {
      nameKeyword: defaultQuery.nameKeyword,
      batchUuid: defaultQuery.batchUuid,
      minCreateTime: defaultQuery.minCreateTime,
      maxCreateTime: defaultQuery.maxCreateTime,
      status: defaultQuery.status,
      overrun: defaultQuery.overrun,
      pandoraVersion: defaultQuery.pandoraVersion,
      pandoraBuildKey: defaultQuery.pandoraBuildKey,
      page: 0,
    };
    setFilteringOptions({});
    const url = getQueryUrl(queryOverrides);
    navigate(url);
  }, [getQueryUrl, navigate]);

  const onApplyFilteringOptions = useCallback(() => {
    const queryOverrides = Object.assign({}, filteringOptions);
    Object.keys(queryOverrides).forEach((key) => {
      if (key !== 'showRootRequest') {
        queryOverrides[key] = (queryOverrides[key] || '').trim();
      }
    });

    queryOverrides.page = 0;
    const url = getQueryUrl(queryOverrides);
    navigate(url);
  }, [filteringOptions, getQueryUrl, navigate]);

  const renderFilteringOptions = () => {
    const filterOptions = Object.assign({}, query(), filteringOptions);

    let minCreateTime = null;
    if (filterOptions.minCreateTime) {
      minCreateTime = new Date(filterOptions.minCreateTime);
    }
    let maxCreateTime = null;
    if (filterOptions.maxCreateTime) {
      maxCreateTime = new Date(filterOptions.maxCreateTime);
    }

    const distinctNamesOptions = distinctNames.map(name =>
      <option key={name} value={name}>{name}</option>
    );
    distinctNamesOptions.unshift(
      <option key="" value="">----</option>
    );

    return React.createElement('aside', null,
      React.createElement('h2', { className: 'display-6' }, 'Filtering Options'),
      React.createElement('div', { className: 'card' },
        React.createElement('div', { className: 'card-body' },
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', { htmlFor: 'query-p-name' }, 'Pipeline Name:'),
            <select id="query-p-name" className="form-control" value={filterOptions.name || ''} onChange={onChangeName}>{...distinctNamesOptions}</select>
          ),
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', { htmlFor: 'query-p-build-key' }, 'Pandora Build Key:'),
            <input id="query-p-build-key" className="form-control" value={filterOptions.pandoraBuildKey || ''} onChange={onChangePandoraBuildKey} />
          ),
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', { htmlFor: 'query-p-version' }, 'Pandora Version:'),
            <input id="query-p-version" className="form-control" value={filterOptions.pandoraVersion || ''} onChange={onChangePandoraVersion} />
          ),
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', { htmlFor: 'query-p-min-create-time' }, 'From Time:'),
            <DatePicker id="query-p-min-create-time" className="form-control" selected={minCreateTime} onChange={selected => onChangeCreateTimeRange('minCreateTime'} selected) dateFormat="yyyy-MM-dd HH:mm" showTimeSelect timeFormat="HH:mm" timeIntervals={30} timeCaption="time" showMonthYearDropdown />
          ),
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', { htmlFor: 'query-p-max-create-time' }, 'Till Time:'),
            <DatePicker id="query-p-max-create-time" className="form-control" selected={maxCreateTime} onChange={selected => onChangeCreateTimeRange('maxCreateTime'} selected) dateFormat="yyyy-MM-dd HH:mm" showTimeSelect timeFormat="HH:mm" timeIntervals={30} timeCaption="time" showMonthYearDropdown />
          ),
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', { htmlFor: 'query-p-status' }, 'Status:'),
            React.createElement('select', {
              id: 'query-p-status',
              className: 'form-control',
              onChange: onChangeStatus,
              value: filterOptions.status || ''
            },
              React.createElement('option', { value: '' }, 'All'),
              <option value="SUCCESS">Success</option>,
              <option value="FAILURE">Failure</option>,
              <option value="ONGOING">Ongoing</option>
            )
          ),
          React.createElement('div', { className: 'form-group form-inline' },
            React.createElement('label', { htmlFor: 'query-p-show-root', className: 'mr-3' }, 'Show Root Request:'),
            <div className="custom-control custom-checkbox">{<input type="checkbox" className="custom-control-input" id="query-p-show-root" checked={filterOptions.showRootRequest || false} onChange={onChangeShowRootRequestCheck} />,
              <label className="custom-control-label" htmlFor="query-p-show-root" />}</div>
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
    if (!metricsData || !metricsData.content || metricsData.content.length === 0) {
      return <div className="alert alert-warning">No metrics data found for the selected criteria.</div>;
    }

    const rows = metricsData.content.map((metric, index) =>
      <tr key={index}>{<td>{metric.name || 'N/A'}</td>,
        <td>{metric.status || 'N/A'}</td>,
        <td>{metric.createTime || 'N/A'}</td>,
        <td>{metric.elapsedTime || 'N/A'}</td>}</tr>
    );

    return React.createElement('div', { className: 'table-responsive' },
      React.createElement('table', { className: 'table table-striped' },
        React.createElement('thead', null,
          React.createElement('tr', null,
            <th>Name</th>,
            <th>Status</th>,
            <th>Create Time</th>,
            <th>Elapsed Time</th>
          )
        ),
        <tbody>{...rows}</tbody>
      )
    );
  };

  const generateChart = () => {
    if (!metricsDetail || !metricsDetail.content) {
      return <div>{<h3>No data available for chart</h3>}</div>;
    }

    // Simplified chart - you would implement full chart logic here
    const option = {
      title: {
        text: 'Pipeline Metrics'
      },
      xAxis: {
        type: 'category',
        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        data: [120, 200, 150, 80, 70, 110, 130],
        type: 'bar'
      }]
    };

    return React.createElement('div', null,
      <h3>Metrics Chart</h3>,
      React.createElement(ReactEcharts, { option: option, style: { height: '400px' } })
    );
  };

  if (metricsDetail === null) {
    return <LoadingIndicator />;
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
          <li className="breadcrumb-item active">{currentQuery.name}</li>,
          <li className="breadcrumb-item active">{`Start Time: ${currentQuery.minCreateTime}, End Time: ${currentQuery.maxCreateTime}`}</li>
        )
      ),
      rowList
    )
  );
};

export default MetricQtf;