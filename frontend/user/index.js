import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import userService from '../backend/user';

import Topbar from '../components/Topbar';
import Footer from '../components/Footer';

import LoadingIndicator from '../components/LoadingIndicator';
import ErrorAlert from '../components/ErrorAlert';
import { CurrentUser, CurrentUserContext } from '../components/currentUser';

import CurrentUserProfile from './CurrentUserProfile';

import './style.css';


class Index extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentUser: null,
    };
  }

  componentDidMount() {
    document.title = 'User';
    this._loadCurrentUser();
  }

  _loadCurrentUser() {
    console.log('Loading current user...');
    userService.getCurrentUser()
      .then((data) => {
        this.setState({
          currentUser: new CurrentUser(data),
        });
      })
      .catch((error) => {
        console.log(`Fail to get current user (assume user is not authenticated): ${error}`);
        this.setState({
          currentUser: error,
        });
      });
  }

  render() {
    const { currentUser } = this.state;

    if (currentUser === null) {
      return (
        <div className="container-fluid">
          <LoadingIndicator />
        </div>
      );
    }
    if (currentUser instanceof Error) {
      return (
        <div className="container-fluid">
          <ErrorAlert error={currentUser} />
        </div>
      );
    }

    const routerBasename = window.routerBasename;
    return (
      <CurrentUserContext.Provider value={currentUser}>
        <Topbar current="user" />
        <BrowserRouter basename={routerBasename}>
          <div className="container-fluid">
            <Routes>
              <Route exact path="/" element={<CurrentUserProfile/>} />
            </Routes>
          </div>
        </BrowserRouter>
        <Footer />
      </CurrentUserContext.Provider>
    );
  }
}


const mountNode = document.getElementById('app');

const root = createRoot(mountNode);
root.render(<Index />);
