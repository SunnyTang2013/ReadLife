import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import resubmissionSettingsService from '../backend/resubmissionSettingsService';

import { formatTime } from '../utils/utilities';
import ErrorAlert from '../components/ErrorAlert';
import { withCurrentUser } from '../components/currentUser';


const ResubmissionSettingsDetail = () => {
  const [data, setData] = useState({});

  const loadData = () => {
    console.log('Loading resubmission settings ...');
    resubmissionSettingsService.getSettingsDetail().then((resubmissionSetting) => {
      if (resubmissionSetting.data && resubmissionSetting.data.entityResult) {
        setData(resubmissionSetting.data.entityResult);
      }
    })
      .catch((error) => {
        setData(error);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  if (data instanceof Error) {
    return (
      <ErrorAlert error={data} />
    );
  }

  if (!data) {
    setData({});
  }

  let errorCase = (
    <li key="none" className="list-group-item d-flex justify-content-between align-items-center">
      No any rules.
    </li>
  );
  if (data.rules) {
    errorCase = data.rules.map((rerunRule) => (
      <li key={rerunRule.seq} className="list-group-item d-flex justify-content-between align-items-center">
        {rerunRule.rule}
        <span className="badge badge-primary badge-pill">{rerunRule.enable}</span>
      </li>
    ));
  }

  return (
    <div>
      <h2 className="display-4">Job Request Resubmission Settings</h2>
      <div className="mb-2">
        <Link
          to="/resubmission-settings/update"
          className="btn btn-sm btn-primary btn-light-primary mr-2"
        >
          <i className="fa fa-fw fa-pencil" /> Update
        </Link>
      </div>
      <section>
        <table className="table table-striped table-fixed mb-0">
          <tbody>
            <tr>
              <th style={{ width: '30%' }}>Max Retry Times</th>
              <td>{data.maxRetry}</td>
            </tr>
            <tr>
              <th style={{ width: '30%' }}>Run Delay Minutes</th>
              <td>{data.retryDelayMin}</td>
            </tr>
            <tr>
              <th style={{ width: '30%' }}>Enable</th>
              <td>{data.enable}</td>
            </tr>
            <tr>
              <th style={{ width: '30%' }}>Last Update User</th>
              <td>{data.updateBy}</td>
            </tr>
            <tr>
              <th style={{ width: '30%' }}>Update Time</th>
              <td>{formatTime(data.updateTime) || 'N/A'}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h3 className="display-6">Retry Case</h3>
        <div className="row">
          <div className="col-8">
            <ul className="list-group">
              {errorCase}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default withCurrentUser(ResubmissionSettingsDetail);
