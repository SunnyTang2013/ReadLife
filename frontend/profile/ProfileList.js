import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { isEqual } from 'lodash';
import queryString from 'query-string';
import DatePicker from 'react-datepicker';
import profileService from '../backend/profileService';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';
import Paginator from '../components/Paginator';
import Alert from '../components/Alert';
import { formatTime } from '../utils/utilities';

function getDefaultQuery() {
  return {
    name: '',
    containBatch: '',
    lastUpdatedBy: '',
    minUpdateTime: '',
    maxUpdateTime: '',
    sort: 'name,asc',
    page: 0,
    size: 50,
  };
}

const ProfileList = () => {
  const [profilePage, setProfilePage] = useState(null);
  const [filteringOptions, setFilteringOptions] = useState({});
  
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = { username: 'admin', canWrite: true, canExecute: true };

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
    loadData();
  }, []);

  useEffect(() => {
    clearAndLoadProfileList();
  }, [location.search]);

  const loadData = useCallback(async () => {
    try {
      const profilePage = await profileService.getProfileList(query());
      setProfilePage(profilePage);
    } catch (error) {
      setProfilePage(error);
    }
  }, [query]);

  const clearAndLoadProfileList = useCallback(() => {
    setProfilePage(null);
    loadData();
  }, [loadData]);

  const onClickPage = useCallback((page) => {
    const url = getQueryUrl({ page });
    navigate(url);
  }, [getQueryUrl, navigate]);

  const onChangeNameKeyword = useCallback((event) => {
    const name = event.target.value;
    setFilteringOptions(prevState => 
      Object.assign({}, prevState, { name })
    );
  }, []);

  const onChangeUpdateTimeRange = useCallback((name, dateTime) => {
    setFilteringOptions(prevState => {
      const newFilteringOptions = Object.assign({}, prevState);
      if (!dateTime) {
        newFilteringOptions[name] = null;
      } else {
        newFilteringOptions[name] = dateTime.toISOString();
      }
      return newFilteringOptions;
    });
  }, []);

  const onChangeUsername = useCallback((event) => {
    const lastUpdatedBy = event.target.value;
    setFilteringOptions(prevState => 
      Object.assign({}, prevState, { lastUpdatedBy })
    );
  }, []);

  const onClickUpdatedByMe = useCallback(() => {
    if (currentUser && currentUser.username) {
      setFilteringOptions(prevState => {
        const lastUpdatedBy = currentUser.username;
        return Object.assign({}, prevState, { lastUpdatedBy });
      });
    }
  }, [currentUser]);

  const onApplyFilteringOptions = useCallback(() => {
    const queryOverrides = Object.assign({}, filteringOptions);
    Object.keys(queryOverrides).forEach((key) => {
      if (key !== 'containBatch') {
        queryOverrides[key] = (queryOverrides[key] || '').trim();
      }
    });
    queryOverrides.page = 0;
    const url = getQueryUrl(queryOverrides);
    navigate(url);
  }, [filteringOptions, getQueryUrl, navigate]);

  const onResetFilteringOptions = useCallback(() => {
    const defaultQuery = getDefaultQuery();
    const queryOverrides = {
      name: defaultQuery.name,
      lastUpdatedBy: defaultQuery.lastUpdatedBy,
      containBatch: defaultQuery.containBatch,
      minUpdateTime: defaultQuery.minUpdateTime,
      maxUpdateTime: defaultQuery.maxUpdateTime,
      page: 0,
    };
    setFilteringOptions({});
    const url = getQueryUrl(queryOverrides);
    navigate(url);
  }, [getQueryUrl, navigate]);

  const renderFilteringOptions = useCallback(() => {
    const mergedFilteringOptions = Object.assign({}, query(), filteringOptions);
    let minUpdateTime = null;
    if (mergedFilteringOptions.minUpdateTime) {
      minUpdateTime = new Date(mergedFilteringOptions.minUpdateTime);
    }
    let maxUpdateTime = null;
    if (mergedFilteringOptions.maxUpdateTime) {
      maxUpdateTime = new Date(mergedFilteringOptions.maxUpdateTime);
    }

    return React.createElement('aside', null,
      React.createElement('h2', { className: 'display-6' }, 'Filtering Options'),
      React.createElement('div', { className: 'card' },
        React.createElement('div', { className: 'card-body' },
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', { htmlFor: 'query-name-keyword' }, 'Name Contains:'),
            <input id="query-name-keyword" className="form-control" value={mergedFilteringOptions.name} onChange={onChangeNameKeyword} />
          ),
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', { htmlFor: 'query-min-create-time' }, 'From Time:'),
            <DatePicker id="query-min-create-time" className="form-control" selected={minUpdateTime} onChange={selected => onChangeUpdateTimeRange('minUpdateTime'} selected) dateFormat="yyyy-MM-dd HH:mm" showTimeSelect timeFormat="HH:mm" timeIntervals={30} timeCaption="time" />
          ),
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', { htmlFor: 'query-max-create-time' }, 'Till Time:'),
            <DatePicker id="query-max-create-time" className="form-control" selected={maxUpdateTime} onChange={selected => onChangeUpdateTimeRange('maxUpdateTime'} selected) dateFormat="yyyy-MM-dd HH:mm" showTimeSelect timeFormat="HH:mm" timeIntervals={30} timeCaption="time" />
          ),
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', { htmlFor: 'query-update-username' }, 'Last Updated By:'),
            <input id="query-update-username" className="form-control" value={mergedFilteringOptions.lastUpdatedBy} onChange={onChangeUsername} />,
            currentUser.username && <button className="anchor" type="button" onClick={onClickUpdatedByMe}>Updated by me</button>
          ),
          React.createElement('div', { className: 'form-group' },
            React.createElement('button', {
              type: 'button',
              className: 'btn btn-primary mr-2',
              onClick: onApplyFilteringOptions
            }, 'Search'),
            <button type="button" className="btn btn-light" onClick={onResetFilteringOptions}>Reset</button>
          )
        )
      )
    );
  }, [query, filteringOptions, onChangeNameKeyword, onChangeUpdateTimeRange, onChangeUsername, currentUser, onClickUpdatedByMe, onApplyFilteringOptions, onResetFilteringOptions]);

  const renderProfileTableRows = useCallback(({ data, canWrite, canExecute }) => {
    if (!data || !data.length) {
      return null;
    }

    return data.map((profile) => 
      React.createElement('tr', { key: `batch-row-${profile.id}` },
        React.createElement('td', null,
          React.createElement(Link, { to: `/detail/${profile.id}` }, profile.name)
        ),
        <td className="text-nowrap">{profile.lastUpdatedBy}</td>,
        <td className="text-nowrap">{formatTime(profile.updateTime}</td> || 'N/A'),
        React.createElement('td', { className: 'text-nowrap' },
          React.createElement('div', { className: 'btn-group btn-group-xs', role: 'group' },
            canWrite && React.createElement(Link, {
              to: `/update/${profile.id}`,
              className: 'btn btn-outline-primary',
              title: 'Configure'
            },
              <i className="fa fa-fw fa-pencil" />
            )
          ),
          (!canWrite && !canExecute) && <span className="text-muted">--</span>
        )
      )
    );
  }, []);

  const renderProfileTable = useCallback(({ children, sortIcon }) => {
    return React.createElement('table', { className: 'table table-striped mb-2' },
      React.createElement('thead', null,
        React.createElement('tr', null,
          React.createElement('th', null,
            React.createElement('button', { className: 'anchor', type: 'button' },
              'Name ', sortIcon
            )
          ),
          React.createElement('th', { className: 'text-nowrap', style: { width: '10%' } }, 'Last Updated By'),
          React.createElement('th', { className: 'text-nowrap', style: { width: '10%' } }, 'Update Time'),
          React.createElement('th', { className: 'text-nowrap', style: { width: '10%' } }, 'Actions')
        )
      ),
      <tbody>{...children}</tbody>
    );
  }, []);

  if (profilePage === null) {
    return <LoadingIndicator />;
  }
  if (profilePage instanceof Error) {
    return <ErrorAlert error={profilePage} />;
  }

  const { sort } = query();
  const ordering = sort.split(',')[1];
  const canWrite = currentUser.canWrite;
  const canExecute = currentUser.canExecute;

  const filteringOptionsElement = renderFilteringOptions();

  let sortIcon = null;
  if (ordering === 'asc') {
    sortIcon = <i className="fa fa-fw fa-sort-alpha-asc ml-1" />;
  } else if (ordering === 'desc') {
    sortIcon = <i className="fa fa-fw fa-sort-alpha-desc ml-1" />;
  }

  const profileRows = renderProfileTableRows({
    data: profilePage.content,
    canWrite: canWrite,
    canExecute: canExecute,
  });

  const profileListTable = profileRows
    ? renderProfileTable({
        children: profileRows,
        canExecute: canExecute,
        sortIcon: sortIcon
      })
    : <Alert type="warning" text="No profiles found." />;

  return React.createElement('div', null,
    React.createElement('h2', { className: 'display-4' }, 'Profiles'),
    React.createElement('div', { className: 'row' },
      React.createElement('div', { className: 'col-9  no-gutters' },
        React.createElement('div', { className: 'col-12 mt-5' },
          React.createElement('h2', { className: 'display-6' }, 'All profiles'),
          canWrite && React.createElement('div', { className: 'text-right my-4' },
            React.createElement(Link, {
              to: '/profilecreate',
              className: 'btn btn-primary btn-light-primary'
            },
              <i className="fa fa-fw fa-plus" />,
              ' Add a new profile'
            )
          ),
          profileListTable,
          <Paginator page={profilePage} onClickPage={onClickPage} />
        )
      ),
      <div className="col-3">{filteringOptionsElement}</div>
    )
  );
};

export default ProfileList;