import React, { useEffect, useState, useCallback } from 'react';
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

import BatchList from './BatchList';
import BatchCreate from './BatchCreate';
import BatchDetail from './BatchDetail';
import BatchDetailUpdate from './BatchDetailUpdate';
import BatchSubmitted from './BatchSubmitted';
import BatchCustomizedRun from './BatchCustomizedRun';

import './style.css';

function Index() {
  const [currentUser, setCurrentUser] = useState(
    RemoteObject.notLoaded()
  );

  const loadCurrentUser = useCallback(() => {
    console.log('Loading current user...');
    user.getCurrentUser()
      .then((data) => {
        setCurrentUser(RemoteObject.loaded(new CurrentUser(data)));
      })
      .catch((error) => {
        console.log(`Fail to get current user (assume user is not authenticated): ${error}`);
        setCurrentUser(RemoteObject.loaded(new CurrentUser()));
      });
  }, []);

  useEffect(() => {
    document.title = 'Batches';
    loadCurrentUser();
  }, [loadCurrentUser]);

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
      <Topbar current="batches" />
      <BrowserRouter basename={routerBasename}>
        <div className="container-fluid">
          <Routes>
            <Route path="/list" element={<BatchList />} />
            <Route path="/create" element={<BatchCreate />} />
            <Route path="/detail/:batchId" element={<BatchDetail />} />
            <Route path="/update/:batchId" element={<BatchDetailUpdate />} />
            <Route path="/copy/:fromBatchId" element={<BatchCreate />} />
            <Route path="/customized-run/:batchId" element={<BatchCustomizedRun />} />
            <Route path="/batch-request-submitted/:batRequestId" element={<BatchSubmitted />} />
          </Routes>
        </div>
      </BrowserRouter>
      <Footer />
      <ToastContainer />
    </CurrentUserContext.Provider>
  );
};

const mountNode = document.getElementById('app');
if (mountNode) {
  const root = createRoot(mountNode);
  root.render(<Index />);
}