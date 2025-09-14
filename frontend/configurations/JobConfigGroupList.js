import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import { isEqual } from 'lodash';
import queryString from 'query-string';

import configurations from '../backend/configurations';
import RouterPropTypes from '../proptypes/router';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';
import Paginator from '../components/Paginator';
import { withCurrentUser } from '../components/currentUser';

import JobConfigGroupListTable from './components/JobConfigGroupListTable';
import ScorchPropTypes from '../proptypes/scorch';
import { getJobConfigCategoriesByType } from '../utils/constants';
import { sortCaseInsensitive } from '../utils/utilities';

function getDefaultQuery() {
  return {
    nameKeyword: '',
    category: '',
    sort: 'name,asc',
    page: 0,
    size: 50,
  };
}

const JobConfigGroupList = () => {
  const [configGroupList, setConfigGroupList] = useState(null);
  const [filteringOptions, setFilteringOptions] = useState({});

  const navigate = useNavigate();
  const location = useLocation();
  
  const currentUser = {canWrite: true};

  useEffect(() => {
    loadConfigGroupList();
  }, []);

  useEffect(() => {
    if (location.search !== location.search) {
      console.log('Reloading data...');
      clearAndLoadConfigGroupList();
    }
  }, [location.search]);

  function query() {
    const defaultQuery = getDefaultQuery();
    const searchQuery = queryString.parse(location.search);
    return Object.assign({}, defaultQuery, searchQuery);
  }

  function getQueryUrl(overrides) {
    const nextQuery = Object.assign({}, query(), overrides);
    return `${location.pathname}?${queryString.stringify(nextQuery)}`;
  }

  function onClickPage(page) {
    const url = getQueryUrl({ page });
    navigate(url);
  }

  function onChangeJobGroupNameKeyword(event) {
    const nameKeyword = event.target.value;
    setFilteringOptions(prevState => {
      const newFilteringOptions = Object.assign({}, prevState, { nameKeyword });
      return newFilteringOptions;
    });
  }

  function onSelectConfigGroupCategory(event) {
    const category = event.target.value;
    setFilteringOptions(prevState => {
      const newFilteringOptions = Object.assign({}, prevState, { category });
      return newFilteringOptions;
    });
  }

  function onApplyFilteringOptions(event) {
    event.preventDefault();
    const queryOverrides = Object.assign({}, filteringOptions);
    Object.keys(queryOverrides).forEach((key) => {
      queryOverrides[key] = (queryOverrides[key] || '').trim();
    });
    queryOverrides.page = 0;
    onUpdateQuery(queryOverrides);
  }

  function onUpdateQuery(queryOverrides) {
    const url = `${location.pathname}?${queryString.stringify(queryOverrides)}`;
    navigate(url);
  }

  function loadConfigGroupList() {
    console.log('Loading job config group list...');
    configurations.getJobConfigGroupList(query())
      .then(configGroupList => setConfigGroupList(configGroupList))
      .catch(error => setConfigGroupList(error));
  }

  function clearAndLoadConfigGroupList() {
    setConfigGroupList(null);
    loadConfigGroupList();
  }

  const filteringOptionsWithQuery = Object.assign({}, query(), filteringOptions);

  if (configGroupList === null) {
    return <LoadingIndicator />;
  }
  if (configGroupList instanceof Error) {
    return <ErrorAlert error={configGroupList} />;
  }
  
  const categoriesByType = getJobConfigCategoriesByType();
  const categories = [...categoriesByType.functional, ...categoriesByType.technical,
    ...categoriesByType.legacy];
  const $categoryOptions = sortCaseInsensitive(categories).map(category =>
    <option key={category} value={category}>{category}</option>
  );
  $categoryOptions.unshift(
    <option key="" value="">----</option>
  );

  return (
    <div>
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/">Configurations</Link>
          </li>
          <li className="breadcrumb-item active">Job Config Groups</li>
        </ol>
      </nav>
      <h2 className="display-4">Job Config Groups</h2>
      <div className="row">
        <div className="col-9">
          {currentUser.canWrite && (
            <div className="text-right my-2">
              <Link 
                to="/job-config-group/create" 
                className="btn btn-primary btn-light-primary"
              >
                <i className="fa fa-fw fa-plus" />
                {' '}Create a new job config group
              </Link>
            </div>
          )}
          <JobConfigGroupListTable jobConfigGroupList={configGroupList.content} />
          <Paginator page={configGroupList} onClickPage={onClickPage} />
        </div>
        <div className="col-3">
          <aside>
            <h2 className="lighter">Filtering Options</h2>
            <div className="card">
              <div className="card-body">
                <div className="form-group">
                  <label htmlFor="query-name-keyword">Name Contains:</label>
                  <input 
                    id="query-name-keyword" 
                    className="form-control" 
                    placeholder="search by Job Config Group name" 
                    value={filteringOptionsWithQuery.nameKeyword} 
                    onChange={onChangeJobGroupNameKeyword} 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="query-category">Category :</label>
                  <select 
                    id="query-category" 
                    className="form-control" 
                    value={filteringOptionsWithQuery.category} 
                    onChange={onSelectConfigGroupCategory}
                  >
                    {$categoryOptions}
                  </select>
                </div>
                <div className="form-group">
                  <button
                    type="button"
                    className="btn btn-primary mr-2"
                    onClick={onApplyFilteringOptions}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default JobConfigGroupList;
