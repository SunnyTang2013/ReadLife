import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { isEqual } from 'lodash';
import queryString from 'query-string';

import configurations from '../backend/configurations';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';
import Paginator from '../components/Paginator';

import JobConfigCategoriesAside from './components/JobConfigCategoriesAside';
import JobConfigGroupListTable from './components/JobConfigGroupListTable';

const JobConfigGroupListByCategory = () => {
  const [configGroupList, setConfigGroupList] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const category = params.category;

  const query = queryString.parse(location.search);

  useEffect(() => {
    loadConfigGroupList();
  }, [category, location.search]);

  function onClickPage(page) {
    const url = getQueryUrl({ page });
    navigate(url);
  }

  function getQueryUrl(overrides) {
    const nextQuery = Object.assign({}, query, overrides);
    return `${location.pathname}?${queryString.stringify(nextQuery)}`;
  }

  function loadConfigGroupList() {
    const queryWithCategory = Object.assign({}, query, { category: category });
    configurations.getJobConfigGroupList(queryWithCategory)
      .then(configGroupList => setConfigGroupList(configGroupList))
      .catch(error => setConfigGroupList(error));
  }

  if (configGroupList === null) {
    return <LoadingIndicator />;
  }
  if (configGroupList instanceof Error) {
    return <ErrorAlert error={configGroupList} />;
  }

  return (
    <div>
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/">Configurations</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/job-config-group/list">Job Config Groups</Link>
          </li>
          <li className="breadcrumb-item active">{category}</li>
        </ol>
      </nav>
      <h2 className="display-4">Job Config Groups / {category}</h2>
      <div className="row">
        <div className="col-9">
          <JobConfigGroupListTable jobConfigGroupList={configGroupList.content} />
          <Paginator page={configGroupList} onClickPage={onClickPage} />
        </div>
        <div className="col-3">
          <JobConfigCategoriesAside currentCategory={category} />
        </div>
      </div>
    </div>
  );
};

export default JobConfigGroupListByCategory;