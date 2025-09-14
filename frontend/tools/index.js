import React from 'react';
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
import Diff from './diff/Diff';
import ResubmissionSettingsDetail from './ResubmissionSettingsDetail';
import ResubmissionSettingsEdit from './ResubmissionSettingsEdit';

import './diff/style.css';
import GenerateMaskJson from './GenerateMaskJson';


class Index extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentUser: RemoteObject.notLoaded(),
    };
  }

  componentDidMount() {
    document.title = 'Tools';
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
        <Topbar current="tools" />
        <BrowserRouter basename={routerBasename}>
          <div className="container-fluid">
            <Routes>
              <Route exact path="/" element={<Home />} />
              <Route exact path="/diff" element={<Diff />} />
              <Route exact path="/resubmission-settings" element={<ResubmissionSettingsDetail />} />
              <Route exact path="/resubmission-settings/update" element={<ResubmissionSettingsEdit />} />
              <Route exact path="/generate-mask-json" element={<GenerateMaskJson />} />
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
