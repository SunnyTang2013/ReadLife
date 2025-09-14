import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import { isEqual } from 'lodash';
import queryString from 'query-string';

import releaseService from '../backend/releaseService';
import { formatTime } from '../utils/utilities';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicatorNew from '../components/LoadingIndicatorNew';
import Paginator from '../components/Paginator';

function getDefaultQuery() {
  return {
    page: 0,
    size: 25,
  };
}

const ReleaseList = () => {
  const [releasePage, setReleasePage] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const query = () => {
    const defaultQuery = getDefaultQuery();
    const searchQuery = queryString.parse(location.search);
    return Object.assign({}, defaultQuery, searchQuery);
  };

  const getQueryUrl = useCallback((overrides) => {
    const nextQuery = Object.assign({}, query(), overrides);
    return `${location.pathname}?${queryString.stringify(nextQuery)}`;
  }, [location.pathname, location.search]);

  const onClickPage = useCallback((page) => {
    const url = getQueryUrl({ page });
    navigate(url);
  }, [navigate, getQueryUrl]);

  const loadReleasePage = useCallback(() => {
    console.log('Loading release page...');
    releaseService.getReleaseList(query())
      .then(releasePage => setReleasePage(releasePage))
      .catch(error => setReleasePage(error));
  }, [location.search]);

  const clearAndLoadReleasePage = useCallback(() => {
    setReleasePage(null);
    loadReleasePage();
  }, [loadReleasePage]);

  useEffect(() => {
    loadReleasePage();
  }, [loadReleasePage]);

  useEffect(() => {
    clearAndLoadReleasePage();
  }, [location.search]);

  if (releasePage === null) {
    return <LoadingIndicatorNew />;
  }
  if (releasePage instanceof Error) {
    return <ErrorAlert error={releasePage} />;
  }

  const releaseList = releasePage.content;

  const $rows = (releaseList || []).map(release =>
    React.createElement('tr', { key: release.id },
      React.createElement('td', { className: 'text-nowrap' },
        React.createElement(Link, { to: `/detail/${release.id}` },
          <i className="fa fa-fw fa-cubes mr-1" />,
          <strong>{`#${release.id}:`}</strong>, 
          ` ${release.name}`
        )
      ),
      <td className="text-nowrap">{release.releaseVersion}</td>,
      <td className="text-nowrap">{release.changeRequest}</td>,
      <td className="text-nowrap">{release.username}</td>,
      <td className="text-nowrap">{formatTime(release.releaseTime}</td>)
    )
  );

  const currentUser = { username: 'admin', canWrite: true, canExecute: true };

  return React.createElement('div', null,
    React.createElement('nav', null,
      React.createElement('ol', { className: 'breadcrumb' },
        React.createElement('li', { className: 'breadcrumb-item active' }, 'Releases')
      )
    ),
    <h2 className="display-4">Releases</h2>,
    currentUser.canWrite && React.createElement('div', { className: 'my-2' },
      React.createElement(Link, { 
        to: '/create', 
        className: 'btn btn-primary btn-light-primary mr-2' 
      },
        <i className="fa fa-fw fa-upload" />,
        ' Release a new job group'
      ),
      <Link to="/create-package" className="btn btn-primary btn-light-primary mr-2">{<i className="fa fa-fw fa-folder" />,
        ' Create Package'}</Link>,
      <Link to="/list-package" className="btn btn-primary btn-light-primary mr-2">{<i className="fa fa-fw fa-list-alt" />,
        ' List Packages'}</Link>,
      <Link to="/release-package" className="btn btn-primary btn-light-primary mr-2">{<i className="fa fa-fw fa-upload" />,
        ' Release Package'}</Link>,
      <Link to="/rollback-package" className="btn btn-primary btn-light-primary">{<i className="fa fa-fw fa-upload" />,
        ' Rollback Package'}</Link>
    ),
    React.createElement('section', null,
      React.createElement('table', { className: 'table table-striped' },
        React.createElement('thead', null,
          React.createElement('tr', null,
            React.createElement('th', { className: 'text-nowrap' }, 'Release'),
            React.createElement('th', { 
              className: 'text-nowrap', 
              style: { width: '10%' } 
            }, 'Package Version'),
            React.createElement('th', { 
              className: 'text-nowrap', 
              style: { width: '10%' } 
            }, 'Change Request'),
            React.createElement('th', { 
              className: 'text-nowrap', 
              style: { width: '10%' } 
            }, 'User'),
            React.createElement('th', { 
              className: 'text-nowrap', 
              style: { width: '10%' } 
            }, 'Release Time')
          )
        ),
        <tbody>{...$rows}</tbody>
      ),
      <Paginator page={releasePage} onClickPage={onClickPage} />
    )
  );
};

export default ReleaseList;