import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import userService from '../backend/user';
import CobDateDropDown from './CobDateDropDown';
import appInfoService from '../backend/appInfoService';
import Advanced from './Advanced';
import Notification from './Notification';

function Topbar({ current }) {
  const [data, setData] = useState(null);
  const [appInfo, setAppInfo] = useState({});

  useEffect(() => {
    loadData();
    loadAppInfo();
  }, []);

  const loadData = async () => {
    try {
      const user = await userService.getCurrentUser();
      const userData = { user };
      setData(userData);
    } catch (error) {
      console.log(`Fail to load current user: ${error}`);
      setData(null);
    }
  };

  const loadAppInfo = async () => {
    try {
      const appInfoData = await appInfoService.getAppInfo();
      setAppInfo(appInfoData);
    } catch (error) {
      console.log(`Fail to load app info: ${error}`);
    }
  };

  let username = '???';
  if (data) {
    const { user } = data;
    username = user.username;
  }

  // The current app name.
  let selectedDropdownOption = {
    icon: 'fa-rocket',
    optionName: 'Jobs',
    active: false,
  };

  if (current === 'search-criteria') {
    selectedDropdownOption = {
      icon: 'fa-search',
      optionName: 'Criteria',
      active: true,
    };
  } else if (current === 'batches') {
    selectedDropdownOption = {
      icon: 'fa-tasks',
      optionName: 'Batches',
      active: true,
    };
  } else if (current === 'pipelines') {
    selectedDropdownOption = {
      icon: 'fa-plug',
      optionName: 'Pipelines',
      active: true,
    };
  } else if (current === 'profiles') {
    selectedDropdownOption = {
      icon: 'fa-plug',
      optionName: 'Profiles',
      active: true,
    };
  } else if (current === 'onDemandConfig') {
    selectedDropdownOption = {
      icon: 'fa-cog',
      optionName: 'Config',
      active: true,
    };
  }

  return (
    <nav id="topbar" className="navbar navbar-expand-lg navbar-dark bg-primary d-none d-sm-block fixed-top">
      <div className="container-fluid">
        <a className="navbar-brand" href="/" title={appInfo.refreshPolicy}>
          <img
            className="navbar-brand-logo"
            style={{ height: '32px' }}
            src="/img/scorch-logo-white.png"
            alt="Scorch Logo"
          />
          <span className="navbar-brand-text">Scorch - {appInfo.envName || ''}</span>
        </a>
        <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#topbar-supported-content">
          <span className="navbar-toggler-icon" />
        </button>
        <div id="topbar-supported-content" className="collapse navbar-collapse">
          <ul className="navbar-nav mr-auto">
            <li className={`nav-item dropdown ${current === 'jobs' || selectedDropdownOption.active ? 'active' : ''}`}>
              <a
                className="nav-link dropdown-toggle"
                data-toggle="dropdown"
                href="#drop-down-jobs"
                role="button"
                aria-haspopup="true"
                aria-expanded="true"
              >
                <i className={`fa fa-fw ${selectedDropdownOption.icon}`} /> {selectedDropdownOption.optionName}
              </a>
              <div className="dropdown-menu" id="#drop-down-jobs">
                <a className="dropdown-item" href="/frontend/jobs">
                  <i className="fa fa-fw fa-rocket" /> Jobs
                </a>
                <a className="dropdown-item" href="/frontend/batches/list">
                  <i className="fa fa-fw fa-tasks" /> Batches
                </a>
                <a className="dropdown-item" href="/frontend/pipelines/list">
                  <i className="fa fa-fw fa-plug" /> Pipelines
                </a>
                <a className="dropdown-item" href="/frontend/profile/list">
                  <i className="fa fa-fw fa-filter" /> Profiles
                </a>
                <a className="dropdown-item" href="/frontend/quantAqsCoverage/list">
                  <i className="fa fa-fw fa-navicon" /> AQS Coverage
                </a>
                <div className="dropdown-divider" />
                <a className="dropdown-item" href="/frontend/searchCriteria/list">
                  <i className="fa fa-fw fa-search" /> Criteria
                </a>
                <a className="dropdown-item" href="/frontend/onDemandConfig">
                  <i className="fa fa-fw fa-cogs" /> On Demand Config
                </a>
                <a className="dropdown-item" href="/frontend/releases/create-package">
                  <i className="fa fa-fw fa-cube" /> Release
                </a>
              </div>
            </li>
            <li className={`nav-item ${current === 'configGroups' ? 'active' : ''}`}>
              <a className="nav-link" href="/frontend/configurations/job-config-group/list">
                <i className="fa fa-fw fa-cogs" /> Config Groups
              </a>
            </li>
            <li className={`nav-item ${current === 'jobContexts' ? 'active' : ''}`}>
              <a className="nav-link" href="/frontend/globalConfig/job-context/list">
                <i className="fa fa-fw fa-microchip" /> Job Contexts
              </a>
            </li>
            <li className={`nav-item ${current === 'monitoring' ? 'active' : ''}`}>
              <a className="nav-link" href="/frontend/monitoring">
                <i className="fa fa-tachometer" /> Monitoring
              </a>
            </li>
            <li className={`nav-item ${current === 'schedule' ? 'active' : ''}`}>
              <a className="nav-link" href="/frontend/schedule/list">
                <i className="fa fa-clock-o" /> Schedule
              </a>
            </li>
            <li className={`nav-item ${current === 'tools' ? 'active' : ''}`}>
              <a className="nav-link" href="/frontend/tools">
                <i className="fa fa-wrench" /> Tools
              </a>
            </li>
            <li className={`nav-item ${current === 'metrics' ? 'active' : ''}`}>
              <a className="nav-link" href="/frontend/metrics">
                <i className="fa fa-bar-chart" /> Metrics
              </a>
            </li>
            <li className="nav-item">
              <a
                className="nav-link"
                target="_blank"
                rel="noopener noreferrer"
                href="https://confluence.hk.hsbc/display/FIITQ/Scorch+User+Guide"
              >
                <i className="fa fa-fw fa-book" /> Docs
              </a>
            </li>
            <li className="nav-item">
              <a
                className="nav-link"
                target="_blank"
                rel="noopener noreferrer"
                href="https://confluence.hk.hsbc/pages/viewpage.action?pageId=295987881"
              >
                <i className="fa fa-fw fa-comments" /> Suggestions
              </a>
            </li>
          </ul>
          <ul className="navbar-nav">
            <Advanced />
            <CobDateDropDown />
            {data && <Notification envName={appInfo.envName || ''} currentUser={data} />}
            <li className={`nav-item ${current === 'user' ? 'active' : ''}`}>
              <a className="nav-link" href="/frontend/user">
                <i className="fa fa-fw fa-user" /> {username}
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/logout">
                <i className="fa fa-fw fa-sign-out" /> Logout
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

Topbar.propTypes = {
  current: PropTypes.string.isRequired,
};

export default Topbar;