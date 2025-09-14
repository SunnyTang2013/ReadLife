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

import Pipeline from './Pipeline';
import PipelineList from './PipelineList';
import PipelineCreate from './PipelineCreate';
import PipelineDetailUpdate from './PipelineDetailUpdate';
import PipelineSubmitted from './PipelineSubmitted';

import './style.css';
import PipelineCustomizedRun from './PipelineCustomizedRun';
import PipelineNotice from './PipelineNotice';
import PipelineNoticeEdit from './PipelineNoticeEdit';

const Index = () => {
  const [currentUser, setCurrentUser] = useState(RemoteObject.notLoaded());

  useEffect(() => {
    document.title = 'Pipelines';
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
    return (
      <div className="container-fluid">
        <Alert type="danger" text={`You (${currentUser.data.username}) do not have access to this page.`} />
      </div>
    );
  }

  const routerBasename = window.routerBasename;
  return (
    <CurrentUserContext.Provider value={currentUser.data}>
      <Topbar current="pipelines" />
      <BrowserRouter basename={routerBasename}>
        <div className="container-fluid">
          <Routes>
            <Route exact path="/list" element={<PipelineList />} />
            <Route path="/create" element={<PipelineCreate />} />
            <Route path="/detail/:pipelineId" element={<Pipeline />} />
            <Route path="/update/:pipelineId" element={<PipelineDetailUpdate />} />
            <Route path="/clone/:fromPipelineId" element={<PipelineCreate />} />
            <Route path="/pipeline-request-submitted/:pipelineRequestId" element={<PipelineSubmitted />} />
            <Route path="/pipeline/customized-run/:pipelineId" element={<PipelineCustomizedRun />} />
            <Route path="/notice/:pipelineName/:pipelineId" element={<PipelineNotice />} />
            <Route path="/updateNotice/:pipelineName/:pipelineId" element={<PipelineNoticeEdit />} />
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