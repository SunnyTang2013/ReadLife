import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { toast } from 'react-toastify';
import moment from 'moment-timezone';
import schedulingService from '../backend/schedulingService';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';
import './style.css';

const ScheduleHistory = () => {
  const [histories, setHistories] = useState(null);
  const [error, setError] = useState(null);
  const [date, setDate] = useState(null);
  const pagination = { size: 1000 };

  const fetchData = async (query = {}) => {
    try {
      const res = await schedulingService.getScheduleHistories({ ...query, ...pagination });
      setHistories(res);
    } catch (e) {
      setError(e);
      setHistories([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = () => {
    if (date === null) {
      return toast.warn('Please pick a date.');
    }
    const d = moment(date).startOf('day').tz('utc');
    return fetchData({ updatedAt: d.format('yyyy-MM-DDTHH:mm:ss') });
  };

  if (histories === null) {
    return <LoadingIndicator />;
  }
  if (error) {
    return <ErrorAlert error={error} />;
  }

  return React.createElement('div', null,
    React.createElement('nav', null,
      React.createElement('ol', { className: 'breadcrumb' },
        React.createElement('li', { className: 'breadcrumb-item active' }, 'Schedule History')
      )
    ),
    <h2 className="display-4">Schedule History</h2>,
    React.createElement('div', null,
      React.createElement('div', { className: 'row mb-2' },
        React.createElement('div', { className: 'col-lg-6' },
          React.createElement('form', { className: 'my-2' },
            React.createElement('div', { className: 'mb-2' },
              React.createElement('div', { className: 'input-group mb-3' },
                <DatePicker className="form-control input-group" selected={date} onChange={selected => setDate(selected)} dateFormat="yyyy-MM-dd" />,
                React.createElement('div', { className: 'input-group-append' },
                  React.createElement('button', {
                    className: 'btn btn-primary',
                    type: 'button',
                    onClick: handleSearch
                  }, 'Search')
                )
              )
            )
          )
        )
      ),
      React.createElement('table', { className: 'table solid-border-bottom' },
        React.createElement('thead', null,
          React.createElement('tr', null,
            <th>Job Name</th>,
            <th>Application</th>,
            <th>Cron Schedule</th>,
            <th>Updated By</th>,
            <th>Updated At</th>,
            <th>Action</th>
          )
        ),
        <tbody>{(histories.content || []}</tbody>.map((item) => 
            React.createElement('tr', { key: item.triggerId + item.updatedAt },
              <td>{item.jobName}</td>,
              <td>{item.application}</td>,
              React.createElement('td', null,
                React.createElement(Link, {
                  to: `/detail/${encodeURIComponent(item.jobName)}/${item.triggerId}`
                }, item.cron)
              ),
              <td>{item.updatedBy}</td>,
              <td>{item.updatedAt && moment.tz(item.updatedAt, 'UTC'}</td>.local().format('L HH:mm')
              ),
              React.createElement('td', { style: { textTransform: 'capitalize' } }, item.action)
            )
          )
        )
      )
    )
  );
};

export default ScheduleHistory;
