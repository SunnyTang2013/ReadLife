import React, { useEffect, useState } from 'react';
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

import JobGroupConfigList from './JobConfigGroupList';
import JobConfigGroupListByCategory from './JobConfigGroupListByCategory';
import JobConfigGroupCreate from './JobConfigGroupCreate';
import JobConfigGroupDetail from './JobConfigGroupDetail';
import JobConfigGroupUpdate from './JobConfigGroupUpdate';
import ConfigGroupVersionCompare from './ConfigGroupVersionCompare';

import './style.css';

const Index = () => {
  const [currentUser, setCurrentUser] = useState(RemoteObject.notLoaded());

  useEffect(() => {
    document.title = 'Configurations';
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
      <Topbar current="configurations" />
      <BrowserRouter basename={routerBasename}>
        <div className="container-fluid">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/job-config-group/list" element={<JobGroupConfigList />} />
            <Route path="/job-config-group/list-by-category/:category" element={<JobConfigGroupListByCategory />} />
            <Route path="/job-config-group/copy/:fromConfigGroupId" element={<JobConfigGroupCreate />} />
            <Route path="/job-config-group/create" element={<JobConfigGroupCreate />} />
            <Route path="/job-config-group/detail/:jobConfigGroupId" element={<JobConfigGroupDetail />} />
            <Route path="/job-config-group/update/:jobConfigGroupId" element={<JobConfigGroupUpdate />} />
            <Route path="/job-config-group/compare-versions/:versionAId/:versionBId" element={<ConfigGroupVersionCompare />} />
          </Routes>
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
