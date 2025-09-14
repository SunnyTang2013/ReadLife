import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

import configurations from '../backend/configurations';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';
import ParametersDiffTable from '../components/ParametersDiffTable';

function getFullVersionName(versionInfo) {
  return `Version ${versionInfo.version}`;
}

const ConfigGroupVersionCompare = () => {
  const [data, setData] = useState(null);
  
  const params = useParams();
  const versionAId = params.versionAId;
  const versionBId = params.versionBId;

  useEffect(() => {
    loadData();
  }, [versionAId, versionBId]);

  function loadData() {
    console.log(`Loading config group versions #${versionAId} and #${versionBId}...`);
    const versionAPromise = configurations.getConfigGroupVersion(versionAId);
    const versionBPromise = configurations.getConfigGroupVersion(versionBId);
    Promise.all([versionAPromise, versionBPromise])
      .then(([versionA, versionB]) => {
        const data = { versionA, versionB };
        setData(data);
      })
      .catch((error) => {
        setData(error);
      });
  }

  if (data === null) {
    return <LoadingIndicator />;
  }
  if (data instanceof Error) {
    return <ErrorAlert error={data} />;
  }

  const { versionA, versionB } = data;
  const leftLabel = getFullVersionName(versionA.versionInfo);
  const rightLabel = getFullVersionName(versionB.versionInfo);
  const left = {
    label: leftLabel,
    parameters: versionA.parameters,
  };
  const right = {
    label: rightLabel,
    parameters: versionB.parameters,
  };

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
          <li className="breadcrumb-item active">Compare Versions</li>
        </ol>
      </nav>
      <h2 className="display-4">Compare Versions</h2>
      <section>
        <table className="table table-striped table-fixed">
          <tbody>
            <tr>
              <th style={{ width: '20%' }}>Config Group</th>
              <td>
                {versionA.name}
                <span className="badge badge-secondary ml-2">{versionA.category}</span>
              </td>
            </tr>
            <tr>
              <th style={{ width: '20%' }}>Left Side</th>
              <td>
                <strong className="mr-2">{leftLabel}</strong>
                <span className="text-muted">
                  (By {versionA.versionInfo.author}, {versionA.versionInfo.updateTime})
                </span>
              </td>
            </tr>
            <tr>
              <th style={{ width: '20%' }}>Right Side</th>
              <td>
                <strong className="mr-2">{rightLabel}</strong>
                <span className="text-muted">
                  (By {versionB.versionInfo.author}, {versionB.versionInfo.updateTime})
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
      <section>
        <h3 className="display-6">Differences</h3>
        <ParametersDiffTable left={left} right={right} />
      </section>
      <section>
        <Link 
          className="btn btn-secondary" 
          to={`/job-config-group/detail/${versionA.id}`}
        >
          <i className="fa fa-fw fa-arrow-left mr-1" />
          Return to config group {versionA.name}
        </Link>
      </section>
    </div>
  );
};

export default ConfigGroupVersionCompare;