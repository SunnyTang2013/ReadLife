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
    showVsJobOnly: true,
    minCreateTime: last24Hours().toISOString(),
    maxCreateTime: '',
    sort: 'createTime,desc',
    page: 0,
    size: 1500,
  };
}

const MetricRerun = () => {
  const [distinctNames, setDistinctNames] = useState([]);
  const [metricsDetail, setMetricsDetail] = useState([]);
  const [notesDetail, setNotesDetail] = useState([]);
  const [rerunJobList, setRerunJobList] = useState([]);
  const [loading, setLoading] = useState(false);
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
    loadQueryRequestPage();
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

  const loadQueryRequestPage = useCallback(async () => {
    try {
      setLoading(true);
      const currentQuery = query();
      
      const [metricsResult, notesResult, jobsResult] = await Promise.all([
        metrics.getMetricRerunPipelinesList(currentQuery),
        metrics.getMetricRerunNotes(currentQuery),
        metrics.getRerunJobList(currentQuery)
      ]);
      
      setMetricsDetail(metricsResult);
      setNotesDetail(notesResult);
      setRerunJobList(jobsResult);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load rerun metrics:', error);
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

  const onChangeShowVsJobOnlyCheck = useCallback((event) => {
    const showVsJobOnly = event.target.checked;
    setFilteringOptions(prevState => ({
      ...prevState,
      showVsJobOnly
    }));
  }, []);

  const onResetFilteringOptions = useCallback(() => {
    const defaultQuery = getDefaultQuery();
    const queryOverrides = {
      minCreateTime: defaultQuery.minCreateTime,
      maxCreateTime: defaultQuery.maxCreateTime,
      showVsJobOnly: defaultQuery.showVsJobOnly,
      page: 0,
    };
    setFilteringOptions({});
    const url = getQueryUrl(queryOverrides);
    navigate(url);
  }, [getQueryUrl, navigate]);

  const onApplyFilteringOptions = useCallback(() => {
    const queryOverrides = Object.assign({}, filteringOptions);
    Object.keys(queryOverrides).forEach((key) => {
      if (key !== 'showVsJobOnly') {
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

    return React.createElement('aside', null,
      React.createElement('h2', { className: 'display-6' }, 'Filtering Options'),
      React.createElement('div', { className: 'card' },
        React.createElement('div', { className: 'card-body' },
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', { htmlFor: 'query-p-min-create-time' }, 'From Time:'),
            <DatePicker id="query-p-min-create-time" className="form-control" selected={minCreateTime} onChange={selected => onChangeCreateTimeRange('minCreateTime'} selected) dateFormat="yyyy-MM-dd HH:mm" showTimeSelect timeFormat="HH:mm" timeIntervals={30} timeCaption="time" showMonthYearDropdown />
          ),
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', { htmlFor: 'query-p-max-create-time' }, 'Till Time:'),
            <DatePicker id="query-p-max-create-time" className="form-control" selected={maxCreateTime} onChange={selected => onChangeCreateTimeRange('maxCreateTime'} selected) dateFormat="yyyy-MM-dd HH:mm" showTimeSelect timeFormat="HH:mm" timeIntervals={30} timeCaption="time" showMonthYearDropdown />
          ),
          React.createElement('div', { className: 'form-group form-inline' },
            React.createElement('label', { htmlFor: 'query-p-show-vs-job', className: 'mr-3' }, 'Show VS Job Only:'),
            <div className="custom-control custom-checkbox">{<input type="checkbox" className="custom-control-input" id="query-p-show-vs-job" checked={filterOptions.showVsJobOnly || false} onChange={onChangeShowVsJobOnlyCheck} />,
              <label className="custom-control-label" htmlFor="query-p-show-vs-job" />}</div>
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
      return <div className="alert alert-warning">No rerun metrics data found for the selected criteria.</div>;
    }

    const rows = metricsData.map((metric, index) =>
      <tr key={index}>{<td>{metric.name || 'N/A'}</td>,
        <td>{metric.rerunCount || 0}</td>,
        <td>{metric.lastRerunTime || 'N/A'}</td>,
        <td>{metric.reason || 'N/A'}</td>}</tr>
    );

    return React.createElement('div', { className: 'table-responsive' },
      React.createElement('table', { className: 'table table-striped' },
        React.createElement('thead', null,
          React.createElement('tr', null,
            <th>Name</th>,
            <th>Rerun Count</th>,
            <th>Last Rerun Time</th>,
            <th>Reason</th>
          )
        ),
        <tbody>{...rows}</tbody>
      )
    );
  };

  const renderMetricNotes = (notesData) => {
    if (!notesData || notesData.length === 0) {
      return <div className="alert alert-info">No notes available for the selected period.</div>;
    }

    const noteItems = notesData.map((note, index) =>
      React.createElement('div', { key: index, className: 'card mb-2' },
        React.createElement('div', { className: 'card-body' },
          React.createElement('h6', { className: 'card-title' }, note.title || 'Note'),
          <p className="card-text">{note.content || 'No content'}</p>,
          <small className="text-muted">{note.timestamp || 'No timestamp'}</small>
        )
      )
    );

    return <div>{...noteItems}</div>;
  };

  const renderMetricJobList = (jobsData) => {
    if (!jobsData || jobsData.length === 0) {
      return <div className="alert alert-info">No relaunched jobs found for the selected period.</div>;
    }

    const jobRows = jobsData.map((job, index) =>
      <tr key={index}>{<td>{job.jobName || 'N/A'}</td>,
        <td>{job.relaunchTime || 'N/A'}</td>,
        <td>{job.status || 'N/A'}</td>,
        <td>{job.duration || 'N/A'}</td>}</tr>
    );

    return React.createElement('div', { className: 'table-responsive' },
      React.createElement('table', { className: 'table table-striped' },
        React.createElement('thead', null,
          React.createElement('tr', null,
            <th>Job Name</th>,
            <th>Relaunch Time</th>,
            <th>Status</th>,
            <th>Duration</th>
          )
        ),
        <tbody>{...jobRows}</tbody>
      )
    );
  };

  const generateChart = () => {
    if (!metricsDetail || metricsDetail.length === 0) {
      return <div>{<h3>No data available for rerun chart</h3>}</div>;
    }

    // Simplified chart - you would implement full chart logic here
    const option = {
      title: {
        text: 'Rerun Metrics Chart'
      },
      xAxis: {
        type: 'category',
        data: metricsDetail.map(item => item.name || 'Unknown').slice(0, 10)
      },
      yAxis: {
        type: 'value',
        name: 'Rerun Count'
      },
      series: [{
        data: metricsDetail.map(item => item.rerunCount || 0).slice(0, 10),
        type: 'bar',
        itemStyle: {
          color: '#ff6b6b'
        }
      }]
    };

    return React.createElement('div', null,
      <h3>Rerun Metrics Chart</h3>,
      React.createElement(ReactEcharts, { option: option, style: { height: '400px' } })
    );
  };

  if (loading === true) {
    return <LoadingIndicator />;
  }

  if (metricsDetail instanceof Error) {
    return <ErrorAlert error={metricsDetail} />;
  }

  if (notesDetail instanceof Error) {
    return <ErrorAlert error={notesDetail} />;
  }

  console.log('notesDetail', notesDetail);
  console.log('rerunJobList', rerunJobList);

  const filteringOptionsElement = renderFilteringOptions();
  const rowList = renderMetricLines(metricsDetail);
  const rowNotesList = renderMetricNotes(notesDetail);
  const rowJobsList = renderMetricJobList(rerunJobList);
  const charts = generateChart();
  const currentQuery = query();

  return React.createElement('div', null,
    filteringOptionsElement,
    React.createElement('div', { className: 'shadow p-3 mb-5 mt-3 bg-white rounded' },
      charts
    ),
    React.createElement('div', { className: 'shadow p-3 mb-5 bg-white rounded' },
      React.createElement('nav', null,
        React.createElement('ol', { className: 'breadcrumb' },
          React.createElement('li', { className: 'breadcrumb-item active' }, 'Reruns Metrics'),
          <li className="breadcrumb-item active">{currentQuery.name}</li>,
          <li className="breadcrumb-item active">{`Start Time: ${currentQuery.minCreateTime}, End Time: ${currentQuery.maxCreateTime}`}</li>
        )
      ),
      rowList
    ),
    React.createElement('div', { className: 'shadow p-3 mb-5 bg-white rounded' },
      React.createElement('nav', null,
        React.createElement('ol', { className: 'breadcrumb' },
          React.createElement('li', { className: 'breadcrumb-item active' }, 'Relaunched Jobs Details For The Same Period')
        )
      ),
      rowJobsList
    ),
    React.createElement('div', { className: 'shadow p-3 mb-5 bg-white rounded' },
      React.createElement('nav', null,
        React.createElement('ol', { className: 'breadcrumb' },
          React.createElement('li', { className: 'breadcrumb-item active' }, 'Pipeline Notes For The Same Period')
        )
      ),
      rowNotesList
    )
  );
};

export default MetricRerun;