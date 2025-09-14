import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import user from '../backend/user';
import RemoteObject from '../utils/RemoteObject';
import './style.css';
import Topbar from '../components/Topbar';
import Footer from '../components/Footer';
import Alert from '../components/Alert';
import LoadingIndicator from '../components/LoadingIndicator';
import { CurrentUser, CurrentUserContext } from '../components/currentUser';
import ProfileCreate from './ProfileCreate';
import Profile from './Profile';
import ProfileDetailUpdate from './ProfileDetailUpdate';
import ProfileList from './ProfileList';

const Index = () => {
  const [currentUser, setCurrentUser] = useState(() => RemoteObject.notLoaded());

  useEffect(() => {
    document.title = 'Profile';
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
    <Topbar current="profiles" />,
    React.createElement(BrowserRouter, { basename: routerBasename },
      React.createElement('div', { className: 'container-fluid' },
        React.createElement(Routes, null,
          <Route path="/list" element={<ProfileList />} />,
          <Route path="/detail/:profileId" element={<Profile />} />,
          <Route path="/profilecreate" element={<ProfileCreate />} />,
          <Route path="/update/:profileId" element={<ProfileDetailUpdate />} />,
          <Route path="/clone/:fromProfileId" element={<ProfileCreate />} />
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