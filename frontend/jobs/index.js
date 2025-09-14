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

import JobGroupExplorer from './JobGroupExplorer';
import JobGroupSettings from './JobGroupSettings';
import JobGroupRun from './JobGroupRun';
import JobGroupRelease from './JobGroupRelease';

import JobListByJobGroupRedirect from './JobListByJobGroupRedirect';
import JobListByJobGroup from './JobListByJobGroup';
import JobListByConfigGroup from './JobListByConfigGroup';
import JobListByContextGroup from './JobListByContextGroup';
import JobDetail from './JobDetail';
import JobEdit from './JobEdit';
import JobDelete from './JobDelete';
import JobCreate from './JobCreate';

import JobCustomizedRun from './JobCustomizedRun';
import JobRequestSubmitted from './JobRequestSubmitted';
import JobListRun from './JobListRun';

import JobHistoryList from './JobHistoryList';
import JobHistoryDetail from './JobHistoryDetail';

import Welcome from './Welcome';

import './style.css';

const Index = () => {
  const [currentUser, setCurrentUser] = useState(RemoteObject.notLoaded());

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

  useEffect(() => {
    document.title = 'Jobs';
    loadCurrentUser();
  }, []);

  if (currentUser.isNotLoaded()) {
    return (
      <div className="container-fluid">
        <LoadingIndicator />
      </div>
    );
  }
  if (currentUser.isFailed()) {
    return (
      <div className="container-fluid">
        <Alert type="danger" text={currentUser.error} />
      </div>
    );
  }
  if (!currentUser.data.canRead) {
    return (
      <div className="container-fluid">
        <Alert type="danger" text={`You (${currentUser.data.username}) do not have access to this page.`} />
      </div>
    );
  }

  const routerBasename = window.routerBasename;
  
  return (
    <CurrentUserContext.Provider value={currentUser.data}>
      <Topbar current="jobs" />
      <BrowserRouter basename={routerBasename}>
        <div id="duo-layout">
          <div id="duo-lhs-fixed-pane">
            <Routes>
              <Route path="/job-group/settings/:jobGroupId" element={<JobGroupExplorer />} />
              <Route path="/job-group/job-list/:jobGroupId" element={<JobGroupExplorer />} />
              <Route path="/job-group/run/:jobGroupId" element={<JobGroupExplorer />} />
              <Route path="/job-group/release/:jobGroupId" element={<JobGroupExplorer />} />
              <Route path="/job/list/:jobGroupId" element={<JobGroupExplorer />} />
              <Route path="/job/list-by-group-name/:jobGroupName" element={<JobGroupExplorer />} />
              <Route path="/" element={<JobGroupExplorer />} />
            </Routes>
          </div>
          <div id="duo-rhs-content-pane" className="duo-rhs-content-pane">
            <Routes>
              <Route path="/job-group/settings/:jobGroupId" element={<JobGroupSettings />} />
              <Route path="/job-group/job-list/:jobGroupId" element={<JobListByJobGroupRedirect />} />
              <Route path="/job-group/run/:jobGroupId" element={<JobGroupRun />} />
              <Route path="/job-group/release/:jobGroupId" element={<JobGroupRelease />} />
              <Route path="/job/list-run" element={<JobListRun />} />
              <Route path="/job/list/:jobGroupId" element={<JobListByJobGroup />} />
              <Route path="/job/list-by-group-name/:jobGroupName" element={<JobListByJobGroup />} />
              <Route path="/job/list-by-config-group/:configGroupId" element={<JobListByConfigGroup />} />
              <Route path="/job/list-by-context-group/:jobContextId" element={<JobListByContextGroup />} />
              <Route path="/job/detail/:jobId" element={<JobDetail />} />
              <Route path="/job/edit/:jobId" element={<JobEdit />} />
              <Route path="/job/delete/:jobId" element={<JobDelete />} />
              <Route path="/job/copy/:fromJobId" element={<JobCreate />} />
              <Route path="/job/create/:jobGroupId" element={<JobCreate />} />
              <Route path="/job/customized-run/:jobId" element={<JobCustomizedRun />} />
              <Route path="/job-request-submitted/:jobRequestId" element={<JobRequestSubmitted />} />
              <Route path="/jobHistory/list/:jobId/:jobName" element={<JobHistoryList />} />
              <Route path="/jobHistory/detail/:jobHistoryId" element={<JobHistoryDetail />} />
              <Route path="/" element={<Welcome />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
      <Footer />
      <ToastContainer />
    </CurrentUserContext.Provider>
  );
};

const mountNode = document.getElementById('app');
const root = createRoot(mountNode);
root.render(<Index />);