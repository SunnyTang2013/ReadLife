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

import Home from './Home';

import BatchRequestList from './BatchRequestList';
import BatchRequestDetail from './BatchRequestDetail';
import BatchRequestByUuid from './BatchRequestByUuid';

import JobRequestList from './JobRequestList';
import JobRequestListByJob from './JobRequestListByJob';
import JobRequestDetail from './JobRequestDetail';

import PipelineRequestList from './PipelineRequestList';
import PipelineRequestDetail from './PipelineRequestDetail';
import PipelineRequestByUuid from './PipelineRequestByUuid';
import ExecutionSystemView from './ExecutionSystemView';

import './style.css';

function Index() {
  const [currentUser, setCurrentUser] = useState(RemoteObject.notLoaded());

  useEffect(() => {
    document.title = 'Job Requests';
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    console.log('Loading current user...');
    try {
      const data = await user.getCurrentUser();
      setCurrentUser(RemoteObject.loaded(new CurrentUser(data)));
    } catch (error) {
      console.log(`Fail to get current user (assume user is not authenticated): ${error}`);
      setCurrentUser(RemoteObject.loaded(new CurrentUser()));
    }
  };

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
        <Alert 
          type="danger" 
          text={`You (${currentUser.data.username}) do not have access to this page.`} 
        />
      </div>
    );
  }
  
  const routerBasename = window.routerBasename;
  
  return (
    <CurrentUserContext.Provider value={currentUser.data}>
      <Topbar current="monitoring" />
      <BrowserRouter basename={routerBasename}>
        <div className="container-fluid">
          <Routes>
            <Route exact path="/" element={<Home />} />
            <Route exact path="/batch-request/list" element={<BatchRequestList />} />
            <Route path="/batch-request/detail/:batchRequestId" element={<BatchRequestDetail />} />
            <Route path="/batch-request/uuid/:batchUuid" element={<BatchRequestByUuid />} />
            <Route exact path="/job-request/list" element={<JobRequestList />} />
            <Route path="/job-request/detail/:jobRequestId" element={<JobRequestDetail />} />
            <Route path="/job-request/by-job/:jobId" element={<JobRequestListByJob />} />
            <Route path="/pipeline-request/list" element={<PipelineRequestList />} />
            <Route path="/pipeline-request/detail/:pipelineRequestId" element={<PipelineRequestDetail />} />
            <Route path="/pipeline-request/uuid/:pipelineRequestUUID" element={<PipelineRequestByUuid />} />
            <Route path="/execution-system-view" element={<ExecutionSystemView />} />
          </Routes>
        </div>
      </BrowserRouter>
      <Footer />
      <ToastContainer />
    </CurrentUserContext.Provider>
  );
}


const mountNode = document.getElementById('app');

const root = createRoot(mountNode);
root.render(<Index />);
