import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import userService from '../backend/user';

import Topbar from '../components/Topbar';
import Footer from '../components/Footer';

import LoadingIndicatorNew from '../components/LoadingIndicatorNew';
import ErrorAlert from '../components/ErrorAlert';
import { CurrentUser, CurrentUserContext } from '../components/currentUser';

import CreatePackage from '../releaseManager/CreatePackage';
import ReleasePackage from '../releaseManager/ReleasePackage';
import AnalyzePackage from '../releaseManager/AnalyzePackage';
import AddBackupPackages from '../releaseManager/AddBackupPackages';
import ComparePackage from '../releaseManager/ComparePackage';
import ListPackage from '../releaseManager/ListPackage';
import RollbackPackage from '../releaseManager/RollbackPackage';
import ReleaseCreate from './ReleaseCreate';
import ReleaseList from './ReleaseList';
import ReleaseDetail from './ReleaseDetail';

import './style.css';

const Index = () => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    document.title = 'Releases';
    loadCurrentUser();
  }, []);

  const loadCurrentUser = () => {
    console.log('Loading current user...');
    userService.getCurrentUser()
      .then((data) => {
        setCurrentUser(new CurrentUser(data));
      })
      .catch((error) => {
        console.log(`Fail to get current user (assume user is not authenticated): ${error}`);
        setCurrentUser(error);
      });
  };

  if (currentUser === null) {
    return <div className="container-fluid">{<LoadingIndicatorNew />}</div>;
  }
  if (currentUser instanceof Error) {
    return <div className="container-fluid">{<ErrorAlert error={currentUser} />}</div>;
  }

  const routerBasename = window.routerBasename;
  
  return React.createElement(CurrentUserContext.Provider, { value: currentUser },
    <Topbar current="jobs" />,
    React.createElement(BrowserRouter, { basename: routerBasename },
      React.createElement('div', { className: 'container-fluid' },
        React.createElement(Routes, null,
          <Route path="/create-package" element={<CreatePackage />} />,
          <Route path="/package-detail/:packageName" element={<CreatePackage />} />,
          <Route path="/release-package" element={<ReleasePackage />} />,
          <Route path="/list-package" element={<ListPackage />} />,
          <Route path="/analysis-package" element={<AnalyzePackage />} />,
          <Route path="/compare-items" element={<ComparePackage />} />,
          <Route path="/rollback-package" element={<RollbackPackage />} />,
          <Route path="/create" element={<ReleaseCreate />} />,
          <Route path="/list" element={<ReleaseList />} />,
          <Route path="/detail/:releaseId" element={<ReleaseDetail />} />,
          <Route path="/add-backups" element={<AddBackupPackages />} />
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