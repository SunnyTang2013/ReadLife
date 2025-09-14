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

import ExecutionSystemList from './ExecutionSystemList';
import ExecutionSystemCreate from './ExecutionSystemCreate';
import ExecutionSystemDetail from './ExecutionSystemDetail';
import ExecutionSystemUpdate from './ExecutionSystemUpdate';

import JobContextList from './JobContextList';
import JobContextCreate from './JobContextCreate';
import JobContextDelete from './JobContextDelete';
import JobContextDetail from './JobContextDetail';
import JobContextUpdate from './JobContextUpdate';
import JobContextListByConfigGroup from './JobContextListByConfigGroup';

import './style.css';
import ContextHistoryDetail from './ContextHistoryDetail';
import ContextHistoryList from './ContextHistoryList';
import ExecutionSystemHistoryDetail from './ExecutionSystemHistoryDetail';
import ExecutionSystemHistoryList from './ExecutionSystemHistoryList';

import BankHoliday from './BankHoliday';

const Index = () => {
  const [currentUser, setCurrentUser] = useState(RemoteObject.notLoaded());

  useEffect(() => {
    document.title = 'Job Execution';
    loadCurrentUser();
  }, []);

  function loadCurrentUser() {
    console.log('Loading current user...');
    user.getCurrentUser()
      .then((data) => {
        setCurrentUser(RemoteObject.loaded(new CurrentUser(data)));
      })
      .catch((error) => {
        console.log(`Fail to get current user (assume user is not authenticated): ${error}`);
        setCurrentUser(RemoteObject.loaded(new CurrentUser()));
      });
  }

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
    <Topbar current="globalConfig" />,
    React.createElement(BrowserRouter, { basename: routerBasename },
      React.createElement('div', { className: 'container-fluid' },
        React.createElement(Routes, null,
          <Route path="/" element={<Home />} />,
          <Route path="/job-context/list" element={<JobContextList />} />,
          <Route path="/job-context/create" element={<JobContextCreate />} />,
          <Route path="/job-context/detail/:jobContextId" element={<JobContextDetail />} />,
          <Route path="/job-context/delete/:jobContextId" element={<JobContextDelete />} />,
          <Route path="/job-context/update/:jobContextId" element={<JobContextUpdate />} />,
          <Route path="/job-context/copy/:fromJobContextId" element={<JobContextCreate />} />,
          <Route path="/job-context/list-by-config-group/:configGroupId" element={<JobContextListByConfigGroup />} />,
          <Route path="/contextHistory/list/:contextId/:contextName" element={<ContextHistoryList />} />,
          <Route path="/contextHistory/detail/:contextHistoryId" element={<ContextHistoryDetail />} />,
          <Route path="/execution-system/list" element={<ExecutionSystemList />} />,
          <Route path="/execution-system/create" element={<ExecutionSystemCreate />} />,
          <Route path="/execution-system/detail/:executionSystemId" element={<ExecutionSystemDetail />} />,
          <Route path="/execution-system/update/:executionSystemId" element={<ExecutionSystemUpdate />} />,
          <Route path="/execution-system-history/list/:executionSystemId/:executionSystemName" element={<ExecutionSystemHistoryList />} />,
          <Route path="/execution-system-history/detail/:historyId" element={<ExecutionSystemHistoryDetail />} />,
          <Route path="/bank-holiday/list" element={<BankHoliday />} />
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