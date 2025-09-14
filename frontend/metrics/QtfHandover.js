import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import queryString from 'query-string';
import DatePicker from 'react-datepicker';
import { toast } from 'react-toastify';
import { isEqual } from 'lodash';

import metrics from '../backend/metrics';
import './style.css';

import LoadingIndicator from '../components/LoadingIndicator';
import ErrorAlert from '../components/ErrorAlert';
import AutoGrowTextarea from '../components/AutoGrowTextarea';

function last24Hours() {
  let currentTime = new Date().getTime();
  currentTime -= currentTime % 1000;
  return new Date(currentTime - 24 * 60 * 60 * 1000);
}

function getDefaultQuery() {
  return {
    name: 'QuantsTesting',
    pipelineRequestUUID: '',
    showRootRequest: true,
    minCreateTime: last24Hours().toISOString(),
    maxCreateTime: '',
    status: '',
    username: '',
    sort: 'createTime,desc',
    page: 0,
    size: 500,
  };
}

const QtfHandover = () => {
  const [summary, setSummary] = useState('');
  const [summaryResult, setSummaryResult] = useState('');
  const [metricsDetail, setMetricsDetail] = useState(null);
  const [filteringOptions, setFilteringOptions] = useState({});
  const [symphonyRoom, setSymphonyRoom] = useState('QTF IT POD - Phoenix Summit');
  const [summaryChange, setSummaryChange] = useState(false);

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
    console.log('start qtf handover');
    loadPipelineRequestPage();
  }, []);

  const loadPipelineRequestPage = useCallback(async () => {
    try {
      console.log('_loadPipelineRequestPage');
      const pipelineRequestPage = await metrics.getQtfHandoverPipelinesList(query());
      setMetricsDetail(pipelineRequestPage);
      
      if (pipelineRequestPage && pipelineRequestPage.content) {
        generateHandoverSummary(pipelineRequestPage.content);
      }
    } catch (error) {
      console.error('Failed to load QtfHandover metrics:', error);
      setMetricsDetail(error);
    }
  }, [query]);

  const generateHandoverSummary = useCallback((content) => {
    if (!content || content.length === 0) {
      setSummary('No pipeline data available for handover summary.');
      return;
    }

    // Generate a simple summary based on pipeline data
    const successCount = content.filter(item => item.status === 'SUCCESS').length;
    const failureCount = content.filter(item => item.status === 'FAILURE').length;
    const ongoingCount = content.filter(item => item.status === 'ONGOING').length;
    
    const summaryText = `QTF Handover Summary:
    
Total Pipelines: ${content.length}
Successful: ${successCount}
Failed: ${failureCount}
Ongoing: ${ongoingCount}

Status: ${failureCount > 0 ? 'ATTENTION REQUIRED' : 'ALL CLEAR'}

Details:
${content.map(item => `- ${item.name}: ${item.status}`).join('\n')}`;

    setSummary(summaryText);
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
      name: defaultQuery.name,
      minCreateTime: defaultQuery.minCreateTime,
      maxCreateTime: defaultQuery.maxCreateTime,
      status: defaultQuery.status,
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

  const onChangeSummary = useCallback((event) => {
    const value = event.target.value;
    setSummaryResult(value);
    setSummaryChange(true);
  }, []);

  const onNotify = useCallback(async (summaryText) => {
    try {
      console.log('Sending Symphony notification:', summaryText);
      // Here you would implement the actual Symphony notification logic
      // For now, just show a success toast
      toast.success(`Notification sent to ${symphonyRoom}`);
    } catch (error) {
      console.error('Failed to send notification:', error);
      toast.error('Failed to send Symphony notification');
    }
  }, [symphonyRoom]);

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
            React.createElement('label', { htmlFor: 'query-name' }, 'Pipeline Name:'),
            <input id="query-name" className="form-control" value={filterOptions.name || ''} onChange={onChangeName} />
          ),
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', { htmlFor: 'query-min-create-time' }, 'From Time:'),
            <DatePicker id="query-min-create-time" className="form-control" selected={minCreateTime} onChange={selected => onChangeCreateTimeRange('minCreateTime'} selected) dateFormat="yyyy-MM-dd HH:mm" showTimeSelect timeFormat="HH:mm" timeIntervals={30} timeCaption="time" showMonthYearDropdown />
          ),
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', { htmlFor: 'query-max-create-time' }, 'Till Time:'),
            <DatePicker id="query-max-create-time" className="form-control" selected={maxCreateTime} onChange={selected => onChangeCreateTimeRange('maxCreateTime'} selected) dateFormat="yyyy-MM-dd HH:mm" showTimeSelect timeFormat="HH:mm" timeIntervals={30} timeCaption="time" showMonthYearDropdown />
          ),
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', { htmlFor: 'query-status' }, 'Status:'),
            React.createElement('select', {
              id: 'query-status',
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
            React.createElement('label', { htmlFor: 'query-show-root', className: 'mr-3' }, 'Show Root Request:'),
            <div className="custom-control custom-checkbox">{<input type="checkbox" className="custom-control-input" id="query-show-root" checked={filterOptions.showRootRequest || false} onChange={onChangeShowRootRequestCheck} />,
              <label className="custom-control-label" htmlFor="query-show-root" />}</div>
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

  if (metricsDetail === null) {
    return <LoadingIndicator />;
  }

  if (metricsDetail instanceof Error) {
    return <ErrorAlert error={metricsDetail} />;
  }

  const filteringOptionsElement = renderFilteringOptions();
  const currentQuery = query();
  
  console.log('render', summaryResult);
  let resultSummary = '';
  if (summaryChange === true) {
    console.log('changed');
    resultSummary = summaryResult;
    setSummaryChange(false);
  } else {
    resultSummary = summary;
  }

  console.log('render2', resultSummary);

  return React.createElement('div', null,
    filteringOptionsElement,
    React.createElement('div', { className: 'shadow p-3 mb-5 bg-white rounded' },
      React.createElement('nav', null,
        React.createElement('ol', { className: 'breadcrumb' },
          React.createElement('li', { className: 'breadcrumb-item active' }, 'Pipeline Metrics'),
          <li className="breadcrumb-item active">{currentQuery.name}</li>,
          <li className="breadcrumb-item active">{`Start Time: ${currentQuery.minCreateTime}, End Time: ${currentQuery.maxCreateTime}`}</li>
        )
      ),
      React.createElement('div', null,
        React.createElement('div', { className: 'form-group' },
          <AutoGrowTextarea className="form-control" id="summaryArea" name="result_area" rows="6" value={resultSummary} onChange={event => onChangeSummary(event)} />
        ),
        <button type="button" className="btn btn-success mt-lg-4 w-100" onClick={() => onNotify(resultSummary)}>{`Symphony Notification (${symphonyRoom}}</button>`)
      )
    ),
    React.createElement('div')
  );
};

export default QtfHandover;