import React, { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import DatePicker from 'react-datepicker';
import releaseService from '../backend/releaseService';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';
import { formatTimeByFormatStr } from '../utils/utilities';

const ListPackage = () => {
  const navigate = useNavigate();
  
  const [createDate, setCreateDate] = useState(new Date());
  const [packageList, setPackageList] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [version, setVersion] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    sessionStorage.setItem('refresh', 'true');
    loadData();
  }, []);

  const loadData = useCallback(() => {
    if (!createDate) {
      return;
    }
    setIsLoading(true);
    setError(null);
    
    const createDateStr = formatTimeByFormatStr(createDate.toISOString(), 'YYYYMMDD');
    releaseService.listPackage(createDateStr).then((result) => {
      if (result.status === 'SUCCESS') {
        setPackageList(result.data.packageList);
        setIsLoading(false);
      } else {
        setIsLoading(false);
        setError('Fail to get package list !');
      }
    }).catch((error) => {
      setIsLoading(false);
      setError(error);
    });
  }, [createDate]);

  const onChangeDate = useCallback((date) => {
    setCreateDate(date);
  }, []);

  const onChangeInputVersion = useCallback((event) => {
    setVersion(event.target.value);
  }, []);

  const onLinkDetail = useCallback((event) => {
    event.preventDefault();
    navigate(`/package-detail/${version}`);
  }, [navigate, version]);

  const loadReleasePackages = useCallback((event) => {
    event.preventDefault();
    loadData();
  }, [loadData]);

  let $rows = null;
  if (isLoading) {
    $rows = (
      <tr>
        <td className="text-nowrap">
          <LoadingIndicator />
        </td>
      </tr>
    );
  } else if (error) {
    $rows = (
      <tr>
        <td className="text-nowrap">
          <ErrorAlert error={error} />
        </td>
      </tr>
    );
  } else if (!packageList || packageList.length === 0) {
    $rows = (
      <tr>
        <td className="text-nowrap">No packages found for the selected date.</td>
      </tr>
    );
  } else {
    $rows = (packageList || []).map(pkg => (
      <tr key={pkg.name || pkg}>
        <td className="text-nowrap">
          <Link to={`/package-detail/${pkg.name || pkg}`}>
            <i className="pointer fa fa-fw fa-th text-muted mr-1" />
            {pkg.name || pkg}
          </Link>
        </td>
        <td className="text-nowrap">{pkg.version || 'N/A'}</td>
        <td className="text-nowrap">{pkg.createTime ? formatTimeByFormatStr(pkg.createTime, 'YYYY-MM-DD HH:mm:ss') : 'N/A'}</td>
        <td className="text-nowrap">
          <Link 
            className="btn btn-sm btn-outline-primary mr-1"
            to={`/package-detail/${pkg.name || pkg}`}
          >
            View Details
          </Link>
          <Link 
            className="btn btn-sm btn-outline-info"
            to={`/analysis-package`}
            state={{ packageName: pkg.name || pkg }}
          >
            Analysis
          </Link>
        </td>
      </tr>
    ));
  }

  return (
    <div>
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/list">Release Manager</Link>
          </li>
          <li className="breadcrumb-item active">Package List</li>
        </ol>
      </nav>
      <h2 className="display-4">Package List</h2>
      <div className="row mb-2">
        <div className="col-3">
          <form onSubmit={loadReleasePackages}>
            <div className="input-group">
              <DatePicker 
                selected={createDate} 
                onChange={onChangeDate} 
                className="form-control" 
                dateFormat="yyyyMMdd" 
                peekNextMonth 
                showMonthDropdown 
                showYearDropdown 
                placeholderText="Select create date ..." 
              />
              <div className="input-group-append">
                <button className="btn btn-primary" type="submit">Refresh</button>
              </div>
            </div>
          </form>
        </div>
        <div className="col-2">
          <div className="form-group">
            <div className="input-group mb-3">
              <input 
                className="form-control" 
                type="text" 
                placeholder="Version" 
                value={version} 
                onChange={onChangeInputVersion} 
              />
              <button
                className="btn btn-primary"
                type="button"
                onClick={onLinkDetail}
              >
                Go To Detail
              </button>
            </div>
          </div>
        </div>
      </div>
      <section>
        <table className="table table-striped">
          <thead>
            <tr>
              <th className="text-nowrap">Package Name</th>
              <th className="text-nowrap">Version</th>
              <th className="text-nowrap">Create Time</th>
              <th className="text-nowrap">Action</th>
            </tr>
          </thead>
          <tbody>{$rows}</tbody>
        </table>
      </section>
    </div>
  );
};

export default ListPackage;