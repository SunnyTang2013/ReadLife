import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import user from '../backend/user';
import RemoteObject from '../utils/RemoteObject';

import Topbar from '../components/Topbar';
import Footer from '../components/Footer';

import Alert from '../components/Alert';
import LoadingIndicator from '../components/LoadingIndicator';
import { CurrentUser, CurrentUserContext } from '../components/currentUser';

import './style.css';
import ScheduleList from './ScheduleList';
import ScheduleHistory from './ScheduleHistory';
import ScheduleUpdate from './ScheduleUpdate';
import ScheduleCreate from './ScheduleCreate';
import ScheduleDetail from './ScheduleDetail';
import ScheduleRelease from './ScheduleRelease';

const Index = () => {
  const [currentUser, setCurrentUser] = useState(RemoteObject.notLoaded());

  useEffect(() => {
    document.title = 'Schedules';
    loadCurrentUser();
  }, []);

  const loadCurrentUser = () => {
    console.log('Loading current user...');
    user.getCurrentUser()
      .then((data) => {
        setCurrentUser(RemoteObject.loaded(new CurrentUser(data)));
      })
      .catch((error) => {
        console.log(`Fail to get current user (assume user is not authenticated): ${error}`);
        setCurrentUser(RemoteObject.loaded(new CurrentUser()));
      });
  };

  if (currentUser.isNotLoaded()) {
    return <div className="container-fluid">{<LoadingIndicator />}</div>;
  }
  if (currentUser.isFailed()) {
    return <div className="container-fluid">{<Alert type="danger" text={currentUser.error} />}</div>;
  }
  if (!currentUser.data.canRead) {
    return <div className="container-fluid">{<Alert type="danger" text={`You (${currentUser.data.username} /> do not have access to this page.` 
      }}</div>
    );
  }

  const routerBasename = window.routerBasename;
  return React.createElement(CurrentUserContext.Provider, { value: currentUser.data },
    <Topbar current="schedule" />,
    React.createElement(BrowserRouter, { basename: routerBasename },
      React.createElement('div', { className: 'container-fluid' },
        React.createElement(Routes, null,
          <Route path="/list" element={<ScheduleList />} />,
          <Route exact path="/history" element={<ScheduleHistory />} />,
          <Route path="/detail/:jobName/:triggerKeyName" element={<ScheduleDetail />} />,
          <Route path="/create" element={<ScheduleCreate />} />,
          <Route path="/copy/:jobName/:triggerKeyName" element={<ScheduleCreate />} />,
          <Route path="/update/:jobName/:triggerKeyName" element={<ScheduleUpdate />} />,
          <Route path="/release" element={<ScheduleRelease />} />,
          <Route path="/release-detail/:packageVersion" element={<ScheduleRelease />} />
        )
      )
    ),
    <Footer />,
    <ToastContainer />
  );
};

const mountNode = document.getElementById('app');

const root = createRoot(mountNode);
root.render(<Index />);
