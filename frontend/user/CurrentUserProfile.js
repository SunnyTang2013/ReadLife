import React, { useEffect, useState } from 'react';

import userService from '../backend/user';
import LoadingIndicator from '../components/LoadingIndicator';
import ErrorAlert from '../components/ErrorAlert';

function generateSampleRpcPayload(credential) {
  const payload = {
    jsonrpc: '2.0',
    id: 12345,
    credential: credential,
    method: 'submitJob',
    params: {
      name: 'Job_Name',
    },
  };
  const payloadJson = JSON.stringify(payload, null, 2);
  return <pre>{payloadJson}</pre>;
}

const CurrentUserProfile = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    document.title = 'User Profile';
    loadCurrentUser();
  }, []);

  const loadCurrentUser = () => {
    console.log('Loading currently authenticated user...');
    userService.getCurrentUser()
      .then(user => setUser(user))
      .catch(error => setUser(error));
  };

  const onGenerateRpcToken = () => {
    if (user === null || user instanceof Error) {
      console.log('User is not loaded.');
      return;
    }
    userService.regenerateRpcToken()
      .then((profile) => {
        const updatedUser = Object.assign({}, user, { profile });
        setUser(updatedUser);
      })
      .catch(error => setUser(error));
  };

  if (user === null) {
    return <LoadingIndicator />;
  }
  if (user instanceof Error) {
    return <ErrorAlert error={user} />;
  }

  let $rpcCredential = null;
  if (!user.profile.rpcToken) {
    $rpcCredential = (
      <div>
        <div className="alert alert-warning">
          <i className="fa fa-fw fa-exclamation-triangle mr-1" />
          You do not have a secret token for making JSON-RPC calls.
        </div>
        <div>
          <button
            className="btn btn-primary"
            type="button"
            onClick={onGenerateRpcToken}
          >
            Generate a secret token for JSON-RPC
          </button>
        </div>
      </div>
    );
  } else {
    const rpcCredential = `${user.profile.username}:${user.profile.rpcToken}`;
    const $sampleRpcPayload = generateSampleRpcPayload(rpcCredential);
    $rpcCredential = (
      <div>
        <div className="alert alert-primary text-center">
          <h4 className="lighter">Your RPC credential is</h4>
          <div style={{ fontSize: '1.1rem' }}>
            <code>{rpcCredential}</code>
          </div>
          <div className="text-muted my-2">
            <i className="fa fa-fw fa-info-circle mr-1" />
            RPC credential is used by Scorch to authenticate your JSON-RPC requests.
          </div>
        </div>
        <div className="my-2">
          <h4 className="lighter">Sample JSON-RPC request payload:</h4>
          <div className="alert alert-secondary">
            {$sampleRpcPayload}
          </div>
        </div>
        <div className="my-2">
          <h4 className="lighter">If you are using Scorch JSON-RPC client:</h4>
          <div className="alert alert-secondary text-code">
            scorch-rpcclient SubmitAndQuery&nbsp;
            --server=https://host:port&nbsp;
            --credential=<strong>{rpcCredential}</strong>&nbsp;
            --method=submitJob --name=Job_Name&nbsp;
            [-Dkey=value ...]
          </div>
          <div className="alert alert-secondary text-code">
            scorch-rpcclient SubmitAndQuery&nbsp;
            --server=https://host:port&nbsp;
            --credential=<strong>{rpcCredential}</strong>&nbsp;
            --method=submitBatch --name=Job_Group_Name&nbsp;
            [-Dkey=value ...]
          </div>
          <div className="alert alert-secondary text-code">
            scorch-rpcclient SubmitAndQuery&nbsp;
            --server=https://host:port&nbsp;
            --credential=<strong>{rpcCredential}</strong>&nbsp;
            --method=submitBatchWithBatchName&nbsp;
            --name=Batch_Name&nbsp;
            [-Dkey=value ...]
          </div>
          <div className="alert alert-secondary text-code">
            scorch-rpcclient SubmitAndQuery&nbsp;
            --server=https://host:port&nbsp;
            --credential=<strong>{rpcCredential}</strong>&nbsp;
            --method=submitPipeline&nbsp;
            --name=Pipeline_Name&nbsp;
            [-Dkey=value ...]
          </div>
          <div className="alert alert-secondary text-code">
            scorch-rpcclient SubmitAndQuery&nbsp;
            --server=https://host:port&nbsp;
            --credential=<strong>{rpcCredential}</strong>&nbsp;
            --method=submitBatchWithCriteria&nbsp;
            --criteria="keyword1 && keyword2 ..."&nbsp;
            [-Dkey=value ...]
          </div>
          <div className="alert alert-secondary text-code">
            scorch-rpcclient SubmitAndQuery&nbsp;
            --server=https://host:port&nbsp;
            --credential=<strong>{rpcCredential}</strong>&nbsp;
            --method=submitBatchWithLabel&nbsp;
            --name=Label_Name&nbsp;
            [-Dkey=value ...]
          </div>
        </div>
        <div className="my-2">
          <button
            className="btn btn-danger mr-2"
            type="button"
            onClick={onGenerateRpcToken}
          >
            Re-generate the RPC token
          </button>
          <span className="text-muted">
            <span className="fa fa-fw fa-exclamation-triangle mr-1" />
            By regenerating the RPC token, your current one will be invalidated.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="row">
      <div className="col-3">
        <aside>
          <div className="list-group">
            <a href="#basic-info" className="list-group-item list-group-item-action">
              <i className="fa fa-fw fa-id-card-o mr-1" />
              Basic Info
            </a>
            <a href="#rpc-credential" className="list-group-item list-group-item-action">
              <i className="fa fa-fw fa-key mr-1" />
              RPC Credential
            </a>
          </div>
        </aside>
      </div>

      <div className="col-9">
        <h1 className="display-4">{user.username}</h1>
        <section id="basic-info">
          <h3 className="display-6">
            <i className="fa fa-fw fa-id-card-o mr-2" />
            Basic Information
          </h3>
          <table className="table table-hover">
            <tbody>
              <tr>
                <th className="text-nowrap" style={{ width: '20%' }}>Username</th>
                <td className="text-code">{user.username}</td>
              </tr>
              <tr>
                <th className="text-nowrap" style={{ width: '20%' }}>Permission</th>
                <td className="text-code">{user.permission}</td>
              </tr>
              <tr>
                <th className="text-nowrap" style={{ width: '20%' }}>Role</th>
                <td className="text-code">{user.profile.role}</td>
              </tr>
              <tr>
                <th className="text-nowrap" style={{ width: '20%' }}>Registered</th>
                <td className="text-code">{user.profile.createTime}</td>
              </tr>
            </tbody>
          </table>
        </section>
        <section id="rpc-credential">
          <h3 className="display-6">
            <i className="fa fa-fw fa-key mr-2" />
            RPC Credential
          </h3>
          {$rpcCredential}
        </section>
      </div>
    </div>
  );
};

export default CurrentUserProfile;