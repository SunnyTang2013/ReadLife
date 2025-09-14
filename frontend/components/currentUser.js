import React, { useContext } from 'react';

const READ_ONLY = 'READ_ONLY';
const EXECUTE = 'EXECUTE';
const READ_WRITE = 'READ_WRITE';

/**
 * This class wraps a user JSON object and provides utility methods.
 */
export class CurrentUser {
  constructor(data) {
    this._data = data || null;
  }

  get username() {
    if (!this._data) {
      return null;
    }
    return this._data.username;
  }

  get permission() {
    if (!this._data) {
      return null;
    }
    return this._data.permission;
  }

  get authenticated() {
    return this._data && this._data.authenticated;
  }

  get canRead() {
    return this.permission === READ_ONLY
      || this.permission === EXECUTE
      || this.permission === READ_WRITE;
  }

  get canExecute() {
    return this.permission === READ_WRITE || this.permission === EXECUTE;
  }

  get canWrite() {
    return this.permission === READ_WRITE;
  }
}

// This context contains the current user. It lets us pass the value deep into the component tree.
export const CurrentUserContext = React.createContext(new CurrentUser());

// Modern hook for accessing current user
export function useCurrentUser() {
  return useContext(CurrentUserContext);
}

// Legacy HOC for backwards compatibility
export function withCurrentUser(Component) {
  return function ComponentWithCurrentUser(props) {
    return (
      <CurrentUserContext.Consumer>
        {currentUser => <Component {...props} currentUser={currentUser} />}
      </CurrentUserContext.Consumer>
    );
  };
}