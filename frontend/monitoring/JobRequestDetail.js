import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

import { toast } from 'react-toastify';
import monitoring from '../backend/monitoring';
import globalConfig from '../backend/globalConfig';
import logging from '../backend/logging';
import appInfoService from '../backend/appInfoService';

import { slugify, formatTime, formatDuration } from '../utils/utilities';
import Alert from '../components/Alert';
import LoadingIndicator from '../components/LoadingIndicator';
import ParametersTable from '../components/ParametersTable';
import RequestStatusBadge from '../components/RequestStatusBadge';
import jobExecution from '../backend/jobExecution';
import AlertCountBadge from '../components/AlertCountBadge';

import { isJobRequestDone } from './components/JobRequestPage';

function prettifySizeInBytes(totalBytes) {
  if (totalBytes === null || totalBytes < 0) {
    return 'NA';
  }
  const kilo = 1024;
  const mega = 1024 * kilo;
  const giga = 1024 * mega;
  if (totalBytes < kilo) {
    return `${totalBytes} B`;
  }
  if (totalBytes < mega) {
    return `${(totalBytes / kilo).toFixed(2)} K`;
  }
  if (totalBytes < giga) {
    return `${(totalBytes / mega).toFixed(2)} M`;
  }
  return `${(totalBytes / giga).toFixed(2)} G`;
}

function getJobRequestUri(jobRequest, serviceStatusIcon) {
  let jobUri = jobRequest.jobUri;
  const executionSystem = jobRequest.executionSystem;
  if (!jobRequest.jobUri) {
    if (executionSystem.id) {
      jobUri = (
        <td className="text-code">
          <a 
            className="mr-1" 
            href={`/frontend/globalConfig/execution-system/detail/${executionSystem.id}`}
          >
            {executionSystem.name}
          </a>
        </td>
      );
    }
    return jobUri;
  }

  switch (executionSystem.type) {
    case 'VS':
    case 'GFX':
      return (
        <td className="text-code">
          <a
            href={`${executionSystem.baseUrl}/console/app/job?jobId=${jobRequest.jobUri.substring(3)}`}
            target="_blank"
            rel="noreferrer noopener"
          >
            {jobRequest.jobUri}
          </a>
          <span className="font-weight-bold"> / </span>
          <a 
            className="mr-1" 
            href={`/frontend/globalConfig/execution-system/detail/${executionSystem.id}`}
          >
            {executionSystem.name}
          </a>
          {serviceStatusIcon}
        </td>
      );
    case 'RUNDECK':
      return (
        <td className="text-code">
          <a
            href={jobRequest.jobUri}
            target="_blank"
            rel="noreferrer noopener"
          >
            {jobRequest.jobUri}
          </a>
          <span className="font-weight-bold"> / </span>
          <a 
            className="mr-1" 
            href={`/frontend/globalConfig/execution-system/detail/${executionSystem.id}`}
          >
            {executionSystem.name}
          </a>
          {serviceStatusIcon}
        </td>
      );
    case 'SCOMPARE': {
      if (jobRequest.jobUri.includes('queue')) {
        return (
          <td className="text-code">
            <span className="font-weight-bold">{`${jobRequest.jobUri} / `}</span>
            <a 
              className="mr-1" 
              href={`/frontend/globalConfig/execution-system/detail/${executionSystem.id}`}
            >
              {executionSystem.name}
            </a>
          </td>
        );
      }
      const entries = jobRequest.resolvedParameters.entries;
      let apiPath;
      if (entries) {
        apiPath = entries['jenkins.job.path'];
      }
      if (apiPath) {
        return (
          <td className="text-code">
            <a
              href={`${executionSystem.baseUrl}/${apiPath}/${jobRequest.jobUri.substring(12)}`}
              target="_blank"
              rel="noreferrer noopener"
            >
              {jobRequest.jobUri}
            </a>
            <span className="font-weight-bold"> / </span>
            <a 
              className="mr-1" 
              href={`/frontend/globalConfig/execution-system/detail/${executionSystem.id}`}
            >
              {executionSystem.name}
            </a>
          </td>
        );
      }
      return (
        <td className="text-code">
          <span className="font-weight-bold">{`${jobRequest.jobUri} / `}</span>
          <a 
            className="mr-1" 
            href={`/frontend/globalConfig/execution-system/detail/${executionSystem.id}`}
          >
            {executionSystem.name}
          </a>
        </td>
      );
    }
    case 'TOULON': {
      const entries = jobRequest.resolvedParameters.entries;
      let apiPath;
      if (entries) {
        apiPath = entries['toulon.result.summary.path'];
      }
      if (apiPath) {
        return (
          <td className="text-code">
            <a
              href={apiPath}
              target="_blank"
              rel="noreferrer noopener"
            >
              {jobRequest.jobUri}
            </a>
            <span className="font-weight-bold"> / </span>
            <a 
              className="mr-1" 
              href={`/frontend/globalConfig/execution-system/detail/${executionSystem.id}`}
            >
              {executionSystem.name}
            </a>
          </td>
        );
      }
      return jobUri;
    }
    default:
      return jobUri;
  }
}

function renderGroupedParameters(groupedParameters) {
  const groupKeys = Object.keys(groupedParameters.groups);
  if (groupKeys.length === 0) {
    return <div className="alert alert-warning">
      <i className="fa fa-fw fa-exclamation-triangle mr-1" />'Parameters are not available.'}</div>;
  }

  const $groups = groupKeys.map((groupName) => {
    const groupNameSlug = slugify(groupName);
    const parameters = groupedParameters.groups[groupName];
    return (
      <div key={`group-${groupName}`} className="card my-2">
        <div className="card-header">
          <h6 className="mb-0">
            <a 
              data-toggle="collapse" 
              href={`#config-group-${groupNameSlug}`}
            >
              {groupName}
            </a>
          </h6>
        </div>
        <div 
          id={`config-group-${groupNameSlug}`} 
          className="collapse show"
        >
          <ParametersTable parameters={parameters} />
        </div>
      </div>
    );
  });
  return <div>{$groups}</div>;
}

const JobRequestDetail = ({ currentUser = { canExecute: false } }) => {
  const { jobRequestId } = useParams();
  const navigate = useNavigate();
  const [jobRequest, setJobRequest] = useState(null);
  const [jobRequestLogs, setJobRequestLogs] = useState(null);
  const [commandLine, setCommandLine] = useState(null);
  const [rerunLoaderPiece, setRerunLoaderPiece] = useState(null);
  const [serviceStatus, setServiceStatus] = useState('UNKNOWN');
  const [appInfo, setAppInfo] = useState({});

  const loadJobRequest = useCallback(() => {
    console.log(`Loading job request #${jobRequestId}...`);
    monitoring.getJobRequest(jobRequestId)
      .then(data => setJobRequest(data))
      .catch(error => setJobRequest(error));
  }, [jobRequestId]);

  const loadJobRequestLogs = useCallback(() => {
    console.log(`Loading logs for job request #${jobRequestId}...`);
    logging.getLogs('JobRequest', jobRequestId)
      .then((data) => {
        setJobRequestLogs(data);
      });
  }, [jobRequestId]);

  const loadExecutionSystemStatus = useCallback(() => {
    console.log(`Loading execution system status by request #${jobRequestId}...`);
    globalConfig.getExecutionSystemStatusByRequestId(jobRequestId)
      .then(data => setServiceStatus(data))
      .catch(error => setServiceStatus(error));
  }, [jobRequestId]);

  const loadAppInfo = useCallback(() => {
    appInfoService.getAppInfo()
      .then(appInfo => setAppInfo(appInfo))
      .catch((error) => {
        console.log(`Fail to load app info: ${error}`);
      });
  }, []);

  useEffect(() => {
    document.title = 'Job Request';
    loadJobRequest();
    loadJobRequestLogs();
    loadExecutionSystemStatus();
    loadAppInfo();
  }, [loadJobRequest, loadJobRequestLogs, loadExecutionSystemStatus, loadAppInfo]);

  const onLoadCommandLine = useCallback(() => {
    console.log(`Loading command line for job request #${jobRequestId}...`);
    monitoring.getCommandLine(jobRequestId)
      .then(commandLine => setCommandLine(commandLine))
      .catch(error => setCommandLine(error));
  }, [jobRequestId]);

  const onRerunJobRequest = useCallback((event) => {
    console.log(`Rerun job request #${jobRequestId}...`);
    event.preventDefault();
    if (!isJobRequestDone(jobRequest)) {
      return;
    }
    jobExecution.resubmitJobRequest(jobRequest.id)
      .then((resubmittedJobRequest) => {
        if (resubmittedJobRequest.id.toString() === jobRequestId) {
          setCommandLine(null);
          setRerunLoaderPiece(null);
          loadJobRequest();
          loadJobRequestLogs();
          loadExecutionSystemStatus();
        } else {
          navigate(`/job-request/detail/${resubmittedJobRequest.id}`);
        }
      })
      .catch((error) => {
        toast.error(`Failed to submit job: ${error}`);
      });
  }, [jobRequestId, jobRequest, navigate, loadJobRequest, loadJobRequestLogs, loadExecutionSystemStatus]);

  const onCancelJobRequest = useCallback((event) => {
    console.log(`Cancel job request #${jobRequestId}...`);
    event.preventDefault();
    if (isJobRequestDone(jobRequest)) {
      return;
    }
    jobExecution.cancelJobRequest(jobRequest.id)
      .then((cancelledJobRequest) => {
        if (jobRequest.id.toString() === jobRequestId) {
          setJobRequest(cancelledJobRequest);
          loadJobRequestLogs();
        } else {
          navigate(`/job-request/detail/${jobRequest.id}`);
        }
      })
      .catch((error) => {
        toast.error(`Failed to submit job: ${error}`);
      });
  }, [jobRequestId, jobRequest, navigate, loadJobRequestLogs]);

  const onForceOKJobRequest = useCallback((event) => {
    console.log(`Force OK job request #${jobRequestId}...`);
    event.preventDefault();
    if (isJobRequestDone(jobRequest)) {
      return;
    }
    jobExecution.forceSuccessJobRequest(jobRequest.id)
      .then((forcedJobRequest) => {
        if (jobRequest.id.toString() === jobRequestId) {
          setJobRequest(forcedJobRequest);
          loadJobRequestLogs();
        } else {
          navigate(`/job-request/detail/${jobRequest.id}`);
        }
      })
      .catch((error) => {
        toast.error(`Failed to submit job: ${error}`);
      });
  }, [jobRequestId, jobRequest, navigate, loadJobRequestLogs]);

  const onLoadRerunLoaderPiece = useCallback((event) => {
    console.log(`Rerun loader piece for job request #${jobRequestId}...`);
    event.preventDefault();
    jobExecution.rerunConsumerPiece(jobRequestId)
      .then(() => {
        setCommandLine(null);
        setRerunLoaderPiece(null);
        setJobRequest(null);
        setJobRequestLogs(null);
        loadJobRequest();
        loadJobRequestLogs();
      })
      .catch((error) => {
        toast.error(`Failed to submit job: ${error}`);
      });
  }, [jobRequestId, loadJobRequest, loadJobRequestLogs]);

  const canExecute = currentUser.canExecute;
  if (jobRequest === null) {
    return <LoadingIndicator />;
  }
  if (jobRequest instanceof Error) {
    return <Alert type="danger" text={String(jobRequest)} />;
  }

  const executionSystem = jobRequest.executionSystem;
  const serviceStatusTypes = {
    OKAY: 'success',
    SUBSYSTEM_FAILURE: 'danger',
    UNAVAILABLE: 'danger',
    UNKNOWN: 'warning',
  };

  const serviceStatusType = serviceStatusTypes[serviceStatus.toLocaleUpperCase()] || 'warning';
  const $serviceStatusIcon = (
    <span className={`badge badge-${serviceStatusType} badge-outline`}>
      <i className="fa fa-fw fa-circle" />
      {serviceStatus}
    </span>
  );
  const jobUri = getJobRequestUri(jobRequest, $serviceStatusIcon);

  let $stageTransition = null;
  if (jobRequest.stageTransition && jobRequest.stageTransition.length > 0) {
    const $stageTransitionItems = jobRequest.stageTransition.map((stage, index) => {
      const key = `${index}-${stage}`;
      return (
        <li key={key} className="list-inline-item">
          <span className="badge badge-secondary badge-outline">{stage}</span>
        </li>
      );
    });
    $stageTransition = <ul className="list-inline">{$stageTransitionItems}</ul>;
  }

  let $fetchingOutputsDoneExists = null;
  if (jobRequest.stageTransition && jobRequest.stageTransition.length > 0) {
    jobRequest.stageTransition.map((stage) => {
      if (stage === 'FETCHING_OUTPUTS_DONE') {
        $fetchingOutputsDoneExists = true;
      }
      return null;
    });
  }

  let $statusInfo = null;
  const alertCount = jobRequest.alertCount;
  if (alertCount > 0 && executionSystem.type === 'RUNDECK') {
    $statusInfo = (
      <span className="text-muted ml-2">
        <span className="badge badge-warning ml-2">{`Deal Filter Fail ${alertCount}`}</span>
      </span>
    );
  }
  if (alertCount > 0 && executionSystem.type !== 'RUNDECK') {
    $statusInfo = (
      <span className="text-muted ml-2">
        <span className="badge badge-warning ml-2">{`VS FAIL ${alertCount}`}</span>
      </span>
    );
  }
  let $tradeErrors = null;
  if (jobRequest.tradeErrorCount > 0) {
    $tradeErrors = <AlertCountBadge text={`TradeErrors ${jobRequest.tradeErrorCount}`} />;
  }
  const $outputRows = (jobRequest.outputs || []).map((output) => {
    const singleSinkFileUrl = `/api/v2/job-requests/downloadSinkFile/${jobRequest.id}/${output.name}`;
    return (
      <tr key={`output-${output.name}`}>
        <td className="text-nowrap">
          <i className="fa fa-fw fa-file-o" />
          {' '}
          {output.name}
        </td>
        <td className="text-code">
          <a 
            href={singleSinkFileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            {output.filename}
          </a>
        </td>
        <td className="text-nowrap">{output.quantity || 'NA'}</td>
        <td className="text-nowrap">{prettifySizeInBytes(output.totalBytes)}</td>
      </tr>
    );
  });
  let $outputs = null;
  if ($outputRows.length > 0) {
    $outputs = (
      <table className="table table-striped">
        <thead>
          <tr>
            <th className="text-nowrap" style={{ width: '5%' }}>Output Name</th>
            <th>Output File</th>
            <th className="text-nowrap" style={{ width: '5%' }}>Quantity</th>
            <th className="text-nowrap" style={{ width: '5%' }}>Size</th>
          </tr>
        </thead>
        <tbody>{$outputRows}</tbody>
      </table>
    );
  } else {
    $outputs = <div className="alert alert-warning" role="alert">Job outputs are not available.</div>;
  }
  const qiaUrl = `/api/v2/job-requests/downloadQIA/${jobRequest.id}`;
  const $downloadQIA = (
    <div>
      <a href={qiaUrl}>Download QI Analytics</a>
    </div>
  );

  const kibannaLogPath = jobRequest.extraInfo.entries['kibanna.log.path'];
  const $kibannaLogUrl = (
    <div>
      <a href={kibannaLogPath}>View Kibanna Logs</a>
    </div>
  );

  const $jobRequestLogs = (jobRequestLogs || []).map((logEntry) => {
    let severityClass = '';
    let messageClass = '';
    switch (logEntry.severity) {
      case 'INFO':
        severityClass = 'badge badge-blue';
        break;
      case 'WARNING':
        severityClass = 'badge badge-warning';
        messageClass = 'text-warning';
        break;
      case 'ERROR':
        severityClass = 'badge badge-danger';
        messageClass = 'text-danger';
        break;
      case 'RISK':
        severityClass = 'badge badge-info';
        break;
      default:
        severityClass = 'badge badge-secondary';
        break;
    }
    return (
      <li key={logEntry.id}>
        <span 
          className={`${severityClass} mr-2`}
          style={{ width: '5rem' }}
        >
          {logEntry.severity}
        </span>
        <span className="text-muted text-code mr-2">
          {formatTime(logEntry.time, 'YYYY-MM-DD HH:mm:ss.SSS') || 'N/A'}
        </span>
        <span className={`${messageClass} text-code`}>{logEntry.message}</span>
      </li>
    );
  });

  const $functionalParameters = renderGroupedParameters(jobRequest.functionalParameters);
  const $technicalParameters = renderGroupedParameters(jobRequest.technicalParameters);

  let $commandLine = null;
  if (commandLine === null) {
    $commandLine = <button className="btn btn-secondary" type="button" onClick={onLoadCommandLine}>
      <i className="fa fa-fw fa-code" />,
      ' Show Command Line'</button>;
  } else if (commandLine instanceof Error) {
    $commandLine = <Alert type="danger" text={String(commandLine)} />;
  } else {
    $commandLine = <div className="alert alert-secondary text-code">{commandLine.message}</div>;
  }

  let $rerunOrCancelJob = <button className="btn btn-primary" type="button" onClick={onRerunJobRequest}>{<i className="fa fa-fw fa-play" />,
    ' Rerun Job'}</button>;

  let $forceOKJob = null;
  if (jobRequest.stage && !isJobRequestDone(jobRequest)) {
    $rerunOrCancelJob = <button className="btn btn-danger mr-1" type="button" onClick={onCancelJobRequest}>{<i className="fa fa-fw fa-stop" />,
      ' Cancel Job'}</button>;
    if (appInfo.envName !== 'PDN-CLUSTER') {
      $forceOKJob = <button className="btn btn-warning" type="button" onClick={onForceOKJobRequest}>{<i className="fa fa-fw fa-stop" />,
        ' Mark As Success'}</button>;
    }
  }

  let $rerunLoaderPiece = null;
  if (rerunLoaderPiece === null) {
    $rerunLoaderPiece = <button className="btn btn-primary" type="button" onClick={onLoadRerunLoaderPiece}>{<i className="fa fa-fw fa-play" />,
      ' Rerun Consumer Piece'}</button>;
  }

  const metaFileUrl = monitoring.metaDataUrlForJobRequest(jobRequest.id);
  const generateQIA = jobRequest.resolvedParameters.entries['scorch.generateQIA'];

  return (
    <div>
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/">Monitoring</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/job-request/list">Job Requests</Link>
          </li>
          <li className="breadcrumb-item active">{`Job Request #${jobRequest.id}`}</li>
        </ol>
      </nav>

      <h2 className="display-4">{jobRequest.name}</h2>

      <section>
        <table className="table table-striped table-fixed">
          <tbody>
            <tr>
              <th style={{ width: '20%' }}>Job</th>
              <td>
                <a
                  className="mr-1"
                  href={`/frontend/jobs/job/detail/${jobRequest.jobId}`}
                >
                  {`#${jobRequest.jobId}`}
                </a>
                <span className="badge badge-secondary ml-1">{jobRequest.executionType}</span>
                {jobRequest.extraInfo
                  && jobRequest.extraInfo.entries['entity.name']
                  && <span className="badge badge-secondary ml-1">{jobRequest.extraInfo.entries['entity.name']}</span>
                }
                <span className="mx-2 text-muted">-</span>
                <Link to={`/job-request/by-job/${jobRequest.jobId}`}>
                  View historical job requests
                </Link>
              </td>
            </tr>
            <tr>
              <th style={{ width: '20%' }}>User</th>
              <td>{jobRequest.username}</td>
            </tr>
            <tr>
              <th style={{ width: '20%' }}>Location</th>
              <td>{jobRequest.location}</td>
            </tr>
            <tr>
              <th style={{ width: '20%' }}>Status</th>
              <td>
                <RequestStatusBadge status={jobRequest.status} />
                <span className="text-muted ml-2">{`Stage: ${jobRequest.stage}`}</span>
                {$statusInfo}
                {$tradeErrors}
              </td>
            </tr>
            <tr>
              <th style={{ width: '20%' }}>Create Time</th>
              <td>{formatTime(jobRequest.createTime)}</td>
            </tr>
            <tr>
              <th style={{ width: '20%' }}>Start / End Time</th>
              <td>
                <span>
                  {`${formatTime(jobRequest.startTime) || 'N/A'} - ${formatTime(jobRequest.endTime) || 'N/A'}`}
                </span>
                <span className="text-muted ml-2">
                  {`(${formatDuration(jobRequest.startTime, jobRequest.endTime) || 'N/A'})`}
                </span>
              </td>
            </tr>
            <tr>
              {jobRequest.jobUri 
                ? <th style={{ width: '20%' }}>Job URI / Execution System</th>
                : <th style={{ width: '20%' }}>Execution System</th>
              }
              {jobUri}
            </tr>
            {jobRequest.extraInfo.entries.vsLibrary && (
              <tr>
                <th style={{ width: '20%' }}>Workflow Library</th>
                <td>{jobRequest.extraInfo.entries.vsLibrary}</td>
              </tr>
            )}
            {(jobRequest.batchUuid !== '00000000-0000-0000-0000-000000000000') && (
              <tr>
                <th style={{ width: '20%' }}>Batch Request</th>
                <td className="text-code">
                  <Link to={`/batch-request/uuid/${jobRequest.batchUuid}`}>
                    <span className="text-code">{jobRequest.batchUuid}</span>
                  </Link>
                </td>
              </tr>
            )}
            {executionSystem.type === 'RUNDECK' && (
              <tr>
                <th style={{ width: '20%' }}>Kibanna Logs</th>
                <td className="text-code">{$kibannaLogUrl}</td>
              </tr>
            )}
            {jobRequest.stage === 'SUCCEEDED' && generateQIA && (
              <tr>
                <th style={{ width: '20%' }}>QI Analytics</th>
                <td className="text-code">{$downloadQIA}</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section>
        {$rerunOrCancelJob}
        {$forceOKJob}
        {$fetchingOutputsDoneExists && jobRequest.stage && 
          (jobRequest.stage === 'FAILED' || jobRequest.stage === 'SUCCEEDED' || jobRequest.stage === 'CANCELLED') &&
          canExecute && (
            <span className="text-muted ml-2">{$rerunLoaderPiece}</span>
          )
        }
      </section>

      {$stageTransition && (
        <section>
          <h3 className="display-6">Stage Transition</h3>
          {$stageTransition}
        </section>
      )}

      <section>
        <h3 className="display-6">Outputs</h3>
        {$outputs}
      </section>

      <section>
        <h3 className="display-6">Command Line</h3>
        {$commandLine}
      </section>

      {$jobRequestLogs.length > 0 && (
        <section>
          <h3 className="display-6">Logs</h3>
          <ul className="list-unstyled">{$jobRequestLogs}</ul>
        </section>
      )}

      <section>
        <h3 className="display-6">Parameters</h3>
        <div className="my-2">
          <a href={metaFileUrl}>
            <i className="fa fa-fw fa-download mr-1" />
            Download meta data
          </a>
        </div>
        <ul className="nav nav-tabs" role="tablist">
          <li className="nav-item">
            <a
              className="nav-link active"
              data-toggle="tab"
              href="#functional-parameters"
              role="tab"
            >
              Functional Parameters
            </a>
          </li>
          <li className="nav-item">
            <a
              className="nav-link"
              data-toggle="tab"
              href="#technical-parameters"
              role="tab"
            >
              Technical Parameters
            </a>
          </li>
          <li className="nav-item">
            <a
              className="nav-link"
              data-toggle="tab"
              href="#overridden-parameters"
              role="tab"
            >
              Overridden Parameters
            </a>
          </li>
          <li className="nav-item">
            <a
              className="nav-link"
              data-toggle="tab"
              href="#resolved-parameters"
              role="tab"
            >
              Resolved Parameters
            </a>
          </li>
        </ul>
        <div className="tab-content">
          <div
            id="functional-parameters"
            className="tab-pane fade show active py-2"
            role="tabpanel"
          >
            {$functionalParameters}
          </div>
          <div id="technical-parameters" className="tab-pane fade py-2" role="tabpanel">
            {$technicalParameters}
          </div>
          <div id="overridden-parameters" className="tab-pane fade py-2" role="tabpanel">
            <ParametersTable parameters={jobRequest.overriddenParameters} />
          </div>
          <div id="resolved-parameters" className="tab-pane fade py-2" role="tabpanel">
            <ParametersTable parameters={jobRequest.resolvedParameters} />
          </div>
        </div>
      </section>
    </div>
  );
};

export default JobRequestDetail;