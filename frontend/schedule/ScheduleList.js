import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import { cloneDeep, isEqual } from 'lodash';
import queryString from 'query-string';
import { toast } from 'react-toastify';

import schedulingService from '../backend/schedulingService';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';
import Paginator from '../components/Paginator';

import ScheduleListTable from './components/ScheduleListTable';
import Statics from './components/Statics';

const ScheduleList = () => {
  const [scheduleList, setScheduleList] = useState(null);
  const [search, setSearch] = useState({
    keywordValue: '',
    keywordField: 'jobName',
  });

  const navigate = useNavigate();
  const location = useLocation();

  const query = queryString.parse(location.search);

  const getQueryUrl = useCallback((overrides) => {
    const nextQuery = Object.assign({}, query, overrides);
    return `${location.pathname}?${queryString.stringify(nextQuery)}`;
  }, [location.pathname, query]);

  const onClickPage = useCallback((page) => {
    const url = getQueryUrl({ page });
    navigate(url);
  }, [navigate, getQueryUrl]);

  const onSchedule = useCallback((schedule, triggerDetail, action) => {
    if (action === Statics.PAUSED) {
      schedulingService.pauseJobTrigger(schedule.jobName, triggerDetail.triggerKeyName)
        .then(scheduleDetail => updateScheduleList(scheduleDetail))
        .catch(error => setScheduleList(error));
    } else {
      schedulingService.resumeJobTrigger(schedule.jobName, triggerDetail.triggerKeyName)
        .then(scheduleDetail => updateScheduleList(scheduleDetail))
        .catch(error => setScheduleList(error));
    }
  }, []);

  const onQuickRun = useCallback((jobName, triggerKeyName) => {
    schedulingService.submitJob(jobName, triggerKeyName)
      .then((scorchRequest) => {
        if (scorchRequest.status && scorchRequest.status === 'FAILED') {
          toast.error(`${scorchRequest.name} submit failed, status: ${scorchRequest.status}`);
        } else {
          toast.success(`${scorchRequest.name} submit successfully, status: ${scorchRequest.status}`);
        }
      })
      .catch((error) => {
        toast.error(`Failed to submit job: ${error}`);
      });
  }, []);

  const onKeyDown = useCallback((e) => {
    if (e.keyCode === 13 && e.target.id && e.target.id.indexOf('search-') !== -1) {
      onSearchSchedule();
    }
  }, []);

  const onChangeSearchProperty = useCallback((name, event) => {
    const value = event.target.value;
    setSearch((prevState) => {
      const newSearch = cloneDeep(prevState);
      newSearch[name] = value;
      return newSearch;
    });
  }, []);

  const onSearchSchedule = useCallback(() => {
    const queryOverrides = Object.assign({}, search);
    Object.keys(queryOverrides).forEach((key) => {
      queryOverrides[key] = (queryOverrides[key] || '').trim();
    });
    queryOverrides.page = 0;
    const url = getQueryUrl(queryOverrides);
    navigate(url);
  }, [search, navigate, getQueryUrl]);

  const loadScheduleList = useCallback(() => {
    console.log('Loading schedule list...');
    schedulingService.getScheduleList(query)
      .then(scheduleList => setScheduleList(scheduleList))
      .catch(error => setScheduleList(error));
  }, [query]);

  const updateScheduleList = useCallback((schedule) => {
    if (schedule) {
      setScheduleList((prevState) => {
        if (prevState) {
          const currentContent = prevState.content;
          prevState.content = currentContent.map(currentSchedule => {
            let scheduleDetail = currentSchedule;

            if (schedule.jobName === currentSchedule.jobName) {
              scheduleDetail = schedule;
            }
            return scheduleDetail;
          });
        }
        return prevState;
      });
    }
  }, []);

  const clearAndLoadScheduleList = useCallback(() => {
    setScheduleList(null);
    loadScheduleList();
  }, [loadScheduleList]);

  useEffect(() => {
    loadScheduleList();
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  useEffect(() => {
    console.log('Reloading data...');
    clearAndLoadScheduleList();
  }, [location.search]);

  if (scheduleList === null) {
    return <LoadingIndicator />;
  }
  if (scheduleList instanceof Error) {
    return <ErrorAlert error={scheduleList} />;
  }

  return React.createElement('div', null,
    React.createElement('nav', null,
      React.createElement('ol', { className: 'breadcrumb' },
        React.createElement('li', { className: 'breadcrumb-item active' }, 'Schedule List')
      )
    ),
    <h2 className="display-4">Schedule List</h2>,
    React.createElement('div', null,
      React.createElement('div', { className: 'row mb-2' },
        React.createElement('div', { className: 'col-lg-6' },
          React.createElement('form', { className: 'my-2' },
            React.createElement('div', { className: 'form-group mb-2' },
              React.createElement('div', { className: 'input-group mb-3' },
                <input type="search" className="form-control " id="search-schedule-input" placeholder="Search schedule..." value={search.keywordValue} onChange={event => onChangeSearchProperty('keywordValue'} event) />,
                React.createElement('div', { className: 'input-group-append' },
                  React.createElement('select', {
                    id: 'search-schedule-select',
                    className: 'btn btn-outline-primary',
                    style: { fontFamily: 'inherit' },
                    value: search.keywordField || 'SCORCH',
                    onChange: event => onChangeSearchProperty('keywordField', event)
                  },
                    <option value="jobName">Job Name</option>,
                    <option value="jobGroup">Application Name</option>
                  )
                )
              )
            )
          )
        ),
        React.createElement('div', { className: 'col-lg-2' },
          React.createElement('button', {
            className: 'btn btn-primary mt-2',
            type: 'button',
            onClick: onSearchSchedule
          }, 'Search'),
          <Link to="/history" className="btn btn-secondary mt-2 ml-2">History</Link>
        ),
        React.createElement('div', { className: 'col-lg-4' },
          React.createElement('div', { className: 'text-right my-2 mb-2' },
            React.createElement(Link, {
              to: '/create',
              className: 'btn btn-primary btn-light-primary'
            },
              <i className="fa fa-fw fa-plus" />,
              ' Create a schedule'
            ),
            <Link to="/release" className="btn btn-primary btn-light-primary ml-2">{<i className="fa fa-fw fa-cube" />,
              ' Release'}</Link>
          )
        )
      ),
      <ScheduleListTable scheduleList={scheduleList.content} onSchedule={onSchedule} onQuickRun={onQuickRun} />,
      <Paginator page={scheduleList} onClickPage={onClickPage} />
    )
  );
};

export default ScheduleList;
