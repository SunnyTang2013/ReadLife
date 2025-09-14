import React from 'react';
import { createRoot } from 'react-dom/client';
import { ToastContainer } from 'react-toastify';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import user from '../backend/user';
import Alert from '../components/Alert';
import Topbar from '../components/Topbar';
import Footer from '../components/Footer';
import RemoteObject from '../utils/RemoteObject';
import LoadingIndicator from '../components/LoadingIndicator';
import { CurrentUser, CurrentUserContext } from '../components/currentUser';
import Config from './Config';

import './style.css';

class Index extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentUser: RemoteObject.notLoaded(),
    };
  }

  componentDidMount() {
    document.title = 'On Demand Config';
    this._loadCurrentUser();
  }

  _loadCurrentUser() {
    console.log('Loading current user...');
    user.getCurrentUser()
      .then((data) => {
        this.setState({
          currentUser: RemoteObject.loaded(new CurrentUser(data)),
        });
      })
      .catch((error) => {
        console.log(`Fail to get current user (assume user is not authenticated): ${error}`);
        this.setState({
          currentUser: RemoteObject.loaded(new CurrentUser()),
        });
      });
  }

  render() {
    const currentUser = this.state.currentUser;

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
        <Topbar current="onDemandConfig" />
        <BrowserRouter basename={routerBasename}>
          <div className="container-fluid">
            <Routes>
              <Route path="/" element={<Config />} />
            </Routes>
          </div>
        </BrowserRouter>
        <Footer />
        <ToastContainer />
      </CurrentUserContext.Provider>
    );
  }
}

const mountNode = document.getElementById('app');

const root = createRoot(mountNode);
root.render(<Index />);
