import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import userService from '../backend/user';

import Topbar from '../components/Topbar';
import Footer from '../components/Footer';

import LoadingIndicator from '../components/LoadingIndicator';
import ErrorAlert from '../components/ErrorAlert';
import { CurrentUser, CurrentUserContext } from '../components/currentUser';

import CreatePackage from './CreatePackage';
import ReleasePackage from './ReleasePackage';

const Index = () => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    document.title = 'ReleasesManager';
    loadCurrentUser();
  }, []);

  function loadCurrentUser() {
    console.log('Loading current user...');
    userService.getCurrentUser()
      .then((data) => {
        setCurrentUser(new CurrentUser(data));
      })
      .catch((error) => {
        console.log(`Fail to get current user (assume user is not authenticated): ${error}`);
        setCurrentUser(error);
      });
  }

  if (currentUser === null) {
    return <div className="container-fluid">{<LoadingIndicator />}</div>;
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
          <Route path="/createPackage" element={<CreatePackage />} />,
          <Route path="/ReleasePackage" element={<ReleasePackage />} />
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