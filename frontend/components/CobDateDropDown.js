import React, { useState, useEffect, useCallback } from 'react';

import PropTypes from 'prop-types';
import 'react-datepicker/dist/react-datepicker.css';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import { withCurrentUser } from './currentUser';
import userService from '../backend/user';
import ScorchPropTypes from '../proptypes/scorch';

function isValidData(data) {
  return data !== null && !(data instanceof Error);
}

function checkCobDate(cobDate) {
  const y = parseInt(cobDate.substr(0, 4), 10);
  const m = parseInt(cobDate.substr(4, 2), 10) - 1;
  const d = parseInt(cobDate.substr(6, 2), 10);
  const D = new Date(y, m, d);
  return (D.getFullYear() === y && D.getMonth() === m && D.getDate() === d) ? D : undefined;
}

/**
 * This component renders a dropdown of as-of dates
 */
function CobDateDropDown({ currentUser, onDateSelect }) {
  const [datePanel, setDatePanel] = useState(false);
  const [data, setData] = useState(null);

  const getCobDate = useCallback(() => {
    if (data && data.userPreferences && data.userPreferences.cobDate) {
      return data.userPreferences.cobDate;
    }
    return 'JobContext';
  }, [data]);

  const updateUserPreferences = useCallback(() => {
    if (!isValidData(data)) {
      return;
    }
    userService.updateUserPreferences(currentUser, data.userPreferences);
  }, [currentUser, data]);

  const loadUserPrefs = useCallback(() => {
    console.log('Loading user preferences...');
    const userPreferencesPromise = userService.getUserPreferences(currentUser);
    Promise.all([userPreferencesPromise])
      .then(([userPreferences]) => {
        const userData = { userPreferences };
        setData(userData);
      })
      .catch((error) => {
        setData(error);
      });
  }, [currentUser]);

  const onFocus = useCallback(() => {
    loadUserPrefs();
  }, [loadUserPrefs]);

  const handleDateSelect = useCallback((cobDate) => {
    setDatePanel(false);
    if (cobDate !== getCobDate()) {
      setData((prevData) => {
        if (!isValidData(prevData)) {
          return prevData;
        }

        const newData = Object.assign({}, prevData);
        newData.userPreferences.cobDate = cobDate;
        return newData;
      });

      // Call updateUserPreferences after state update
      setTimeout(() => {
        updateUserPreferences();
      }, 0);

      if (onDateSelect) {
        onDateSelect(cobDate);
      }
    }
  }, [getCobDate, onDateSelect, updateUserPreferences]);

  const getButton = useCallback((caption, id, styles, cobDate, tz) => {
    return (
      <button
        type="button"
        className={`btn btn-sm btn-outline-primary ${styles}${cobDate === id ? ' active' : ''}`}
        onClick={() => handleDateSelect(id + tz)}
        id={id}
        key={id}
      >{caption}
      </button>
    );
  }, [handleDateSelect]);

  const toggleDatePanel = useCallback(() => {
    setDatePanel((prevState) => !prevState);
  }, []);

  useEffect(() => {
    console.log('Loading CobDate dropdown...');
    loadUserPrefs();
    window.addEventListener('focus', onFocus);

    return () => {
      window.removeEventListener('focus', onFocus);
    };
  }, [loadUserPrefs, onFocus]);

  // Update user preferences when data changes
  useEffect(() => {
    if (data && isValidData(data)) {
      updateUserPreferences();
    }
  }, [data, updateUserPreferences]);

  const tz = ` ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
  const active = datePanel ? 'active' : 'inactive';
  let cobDate = getCobDate();
  sessionStorage.setItem('scorch.ui.cobdate', cobDate); // Use session storage for now
  if (cobDate.indexOf(' ') !== -1) {
    cobDate = cobDate.split(' ')[0];
  }

  const btnFontClass = cobDate === 'JobContext' ? '' : 'blinking';

  return (
    <div className="nav-item dropdown">
      <button
        type="button"
        className="nav-link dropdown-toggle btn btn-outline-primary"
        data-toggle="collapse"
        data-target="#DatePanel"
      >
        <span className={btnFontClass}><i className="fa fa-fw fa-calendar" /> {cobDate}</span>
      </button>
      <div className={`dropdown-menu dropdown-menu-right ${active}`} key="DatePanel" id="DatePanel">
        <div className="h7 text-center mb-2">Select CoB Date</div>
        <div className="d-flex text-nowrap ml-2 mr-2 mb-1">
          {getButton('Job Context', 'JobContext', 'flex-fill', cobDate, '')}
          {getButton('Today', 'Today', 'flex-fill', cobDate, tz)}
          {getButton('Yesterday', 'Yesterday', 'flex-fill', cobDate, tz)}
        </div>
        <div className="ml-2 mr-2">
          <div className="d-flex justify-content-center">
            <DatePicker
              id="date-picker"
              inline
              selected={checkCobDate(cobDate)}
              onChange={v => handleDateSelect(moment(v).format(moment.HTML5_FMT.DATE).slice(0, 10).replace(/-/g, ''))}
              className="form-control"
              dateFormat="yyyyMMdd"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

CobDateDropDown.propTypes = {
  currentUser: ScorchPropTypes.currentUser().isRequired,
  onDateSelect: PropTypes.func,
};

CobDateDropDown.defaultProps = {
  onDateSelect: null,
};

export default withCurrentUser(CobDateDropDown);