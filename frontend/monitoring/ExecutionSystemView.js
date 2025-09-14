import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { isEqual } from 'lodash';
import moment from 'moment';
import DatePicker from 'react-datepicker';

import monitoring from '../backend/monitoring';
import globalConfig from '../backend/globalConfig';
import dashboard from '../backend/dashboard';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';
import { withCurrentUser } from '../components/currentUser';
import 'react-datepicker/dist/react-datepicker.css';
import ChartAreaWithTimeAxis from '../components/ChartAreaWithTimeAxis';
import { formatTime, truncateChars } from '../utils/utilities';
import RequestStatusBadge from '../components/RequestStatusBadge';
import Paginator from '../components/Paginator';
import Alert from '../components/Alert';
import appInfoService from '../backend/appInfoService';
import ChartRequestGanttWithTimeAxis from '../components/ChartRequestGanttWithTimeAxis';


const ExecutionSystemView = ({ currentUser }) => {
  const location = useLocation();

  // Utility functions
  const lastHours = useCallback((hour) => {
    let currentTime = new Date().getTime();
    currentTime -= currentTime % 1000;
    return new Date(currentTime - hour * 60 * 60 * 1000);
  }, []);

  const getDefaultRequestGantt = useCallback(() => {
    return {
      requestNames: {
        dimensions: ['Name', 'Type', 'Near Bridge'],
        data: [],
      },
      requestList: {
        dimensions: ['index', 'Start Time', 'End Time', 'name', 'status'],
        data: [],
      },
    };
  }, []);

  // State management
  const [filteringOptions, setFilteringOptions] = useState({});
  const [batchRequestPage, setBatchRequestPage] = useState(null);
  const [jobRequestPage, setJobRequestPage] = useState(null);
  const [batchRequest, setBatchRequest] = useState(null);
  const [executionSystemList, setExecutionSystemList] = useState(null);
  const [selectedExecutionSystem, setSelectedExecutionSystem] = useState(null);
  const [batchRequestGantt, setBatchRequestGantt] = useState(getDefaultRequestGantt());
  const [jobRequestGantt, setJobRequestGantt] = useState(getDefaultRequestGantt());
  const [minCreateTime, setMinCreateTime] = useState(lastHours(24).toISOString());
  const [maxCreateTime, setMaxCreateTime] = useState(null);
  const [batchRequestCountCurve, setBatchRequestCountCurve] = useState([]);
  const [jobRequestCountCurve, setJobRequestCountCurve] = useState([]);
  const [selectedBatchRequests, setSelectedBatchRequests] = useState([]);
  const [selectedJobRequests, setSelectedJobRequests] = useState([]);
  const [appInfo, setAppInfo] = useState({});
  const [checkedAllBatch, setCheckedAllBatch] = useState(false);
  const [checkedAllJob, setCheckedAllJob] = useState(false);

  // Refs for event listeners
  const onKeyDownRef = useRef();

  // Event handlers
  const onChangeCountStartTimeRange = useCallback((dateTime) => {
    setMinCreateTime(dateTime.toISOString());
  }, []);

  const onChangeCountEndTimeRange = useCallback((dateTime) => {
    setMaxCreateTime(dateTime.toISOString());
  }, []);

  const onSelectExecutionSystem = useCallback((event) => {
    const executionSystemId = event.target.value;
    setFilteringOptions(prevState => ({
      ...prevState,
      executionSystemId
    }));
  }, []);

  const onRunQuery = useCallback(() => {
    setBatchRequestPage(null);
    setBatchRequestCountCurve([]);
    setJobRequestCountCurve([]);
    loadExecutionSystemView();
  }, []);

  const onChangeView = useCallback((selectedExecutionSystem) => {
    setBatchRequestPage(null);
    setSelectedExecutionSystem(selectedExecutionSystem);
    setBatchRequestCountCurve([]);
    setJobRequestCountCurve([]);
    loadExecutionSystemView();
  }, []);

  const onListJobRequest = useCallback((batchRequest) => {
    if (!selectedExecutionSystem) return;

    const query = {
      batchUuid: batchRequest.uuid,
      executionSystemId: selectedExecutionSystem.id,
      sort: 'startTime,desc',
      page: 0,
      size: 10,
    };
    setBatchRequest(batchRequest);
    setJobRequestPage(null);
    
    monitoring.getJobRequestList(query)
      .then((jobRequestPage) => {
        setJobRequestPage(jobRequestPage);
        renderJobRequestGantt(jobRequestPage);
      })
      .catch((error) => {
        setJobRequestPage(error);
      });
  }, [selectedExecutionSystem]);

  const onClickBatchPage = useCallback((page) => {
    if (!selectedExecutionSystem) return;

    const query = {
      minStartTime: minCreateTime,
      maxStartTime: maxCreateTime,
      executionSystemId: selectedExecutionSystem.id,
      sort: 'startTime,desc',
      page: page,
      size: 10,
    };

    setBatchRequestPage(null);
    dashboard.getBatchRequestPage(query)
      .then((batchRequestPage) => {
        setBatchRequestPage(batchRequestPage);
        renderBatchRequestGantt(batchRequestPage);
      })
      .catch((error) => {
        setBatchRequestPage(error);
      });
  }, [selectedExecutionSystem, minCreateTime, maxCreateTime]);

  const onClickJobPage = useCallback((page) => {
    if (!batchRequest) return;

    const query = {
      batchUuid: batchRequest.uuid,
      sort: 'startTime,desc',
      page: page,
      size: 10,
    };

    setJobRequestPage(null);
    monitoring.getJobRequestList(query)
      .then((jobRequestPage) => {
        setJobRequestPage(jobRequestPage);
        renderJobRequestGantt(jobRequestPage);
      })
      .catch((error) => {
        setJobRequestPage(error);
      });
  }, [batchRequest]);

  const onCheckedBatch = useCallback((batchRequest) => {
    return selectedBatchRequests.some(selectedBatchRequest => 
      selectedBatchRequest.id === batchRequest.id
    );
  }, [selectedBatchRequests]);

  const onSelectBatchRequest = useCallback((batchRequest, event) => {
    const newSelectedBatches = [...selectedBatchRequests];
    if (event.target.checked) {
      newSelectedBatches.push(batchRequest);
    } else {
      const index = newSelectedBatches.findIndex(batch => batch.id === batchRequest.id);
      if (index > -1) {
        newSelectedBatches.splice(index, 1);
      }
    }
    setSelectedBatchRequests(newSelectedBatches);
    setCheckedAllBatch(false);
  }, [selectedBatchRequests]);

  const onCheckedJob = useCallback((jobRequest) => {
    return selectedJobRequests.some(selectedRequest => 
      selectedRequest.id === jobRequest.id
    );
  }, [selectedJobRequests]);

  const onSelectJobRequest = useCallback((jobRequest, event) => {
    const newSelectedJobs = [...selectedJobRequests];
    if (event.target.checked) {
      newSelectedJobs.push(jobRequest);
    } else {
      const index = newSelectedJobs.findIndex(job => job.id === jobRequest.id);
      if (index > -1) {
        newSelectedJobs.splice(index, 1);
      }
    }
    setSelectedJobRequests(newSelectedJobs);
    setCheckedAllJob(false);
  }, [selectedJobRequests]);

  const onSelectBatchRequestAll = useCallback(() => {
    if (!batchRequestPage || batchRequestPage instanceof Error) return;

    if (!checkedAllBatch) {
      setSelectedBatchRequests([...batchRequestPage.content]);
      setCheckedAllBatch(true);
    } else {
      setSelectedBatchRequests([]);
      setCheckedAllBatch(false);
    }
  }, [batchRequestPage, checkedAllBatch]);

  const onSelectJobRequestAll = useCallback(() => {
    if (!jobRequestPage || jobRequestPage instanceof Error) return;

    if (!checkedAllJob) {
      setSelectedJobRequests([...jobRequestPage.content]);
      setCheckedAllJob(true);
    } else {
      setSelectedJobRequests([]);
      setCheckedAllJob(false);
    }
  }, [jobRequestPage, checkedAllJob]);

  const onViewRequestGantt = useCallback((type, days) => {
    let selectedRequestNames;
    
    if (type === 'BATCH') {
      if (selectedBatchRequests.length === 0) {
        return;
      }
      selectedRequestNames = selectedBatchRequests.map(request => request.name);
    } else {
      if (selectedJobRequests.length === 0) {
        return;
      }
      selectedRequestNames = selectedJobRequests.map(request => request.name);
    }
    
    dashboard.getGanttData(type, lastHours(days * 24).getTime(), selectedRequestNames)
      .then((requestGantt) => {
        const ganttData = getDefaultRequestGantt();
        ganttData.requestNames.data = requestGantt.requestNameData;
        ganttData.requestList.data = requestGantt.requestListData;

        if (type === 'BATCH') {
          setBatchRequestGantt(ganttData);
        } else {
          setJobRequestGantt(ganttData);
        }
      })
      .catch((error) => {
        console.log('Failed to load gantt data:');
        console.log(error);
      });
  }, [selectedBatchRequests, selectedJobRequests, lastHours, getDefaultRequestGantt]);

  // Load functions
  const loadData = useCallback(() => {
    console.log('Loading execution systems and data list...');

    globalConfig.getExecutionSystemListByType('VS', 'Phoenix')
      .then((executionSystemList) => {
        setExecutionSystemList(executionSystemList);
        onLoadOneExecutionSystem(executionSystemList);
      })
      .catch((error) => {
        setExecutionSystemList(error);
      });
  }, []);

  const onLoadOneExecutionSystem = useCallback((executionSystemList) => {
    const selectedExecutionSystem = executionSystemList
      .find(item => item.name.indexOf('Phoenix-gcp') !== -1);
    if (selectedExecutionSystem) {
      setSelectedExecutionSystem(selectedExecutionSystem);
    }
  }, []);

  const loadExecutionSystemView = useCallback(() => {
    if (!selectedExecutionSystem) {
      return;
    }

    const countQuery = {
      minCreateTime: minCreateTime,
      maxCreateTime: maxCreateTime,
    };

    const batchRequestCurvePromise = dashboard.getOneExecutionSystemCurve(
      selectedExecutionSystem.id, 'Batch', countQuery,
    );

    const jobRequestCurvePromise = dashboard.getOneExecutionSystemCurve(
      selectedExecutionSystem.id, 'Job', countQuery,
    );

    const query = {
      minStartTime: minCreateTime,
      maxStartTime: maxCreateTime,
      executionSystemId: selectedExecutionSystem.id,
      sort: 'startTime,desc',
      page: 0,
      size: 10,
    };

    const batchRequestPagePromise = dashboard.getBatchRequestPage(query);

    Promise.all([batchRequestCurvePromise, jobRequestCurvePromise, batchRequestPagePromise])
      .then(([batchRequestCountCurve, jobRequestCountCurve, batchRequestPage]) => {
        setBatchRequestCountCurve(batchRequestCountCurve);
        setJobRequestCountCurve(jobRequestCountCurve);
        setBatchRequestPage(batchRequestPage);
        renderBatchRequestGantt(batchRequestPage);
      })
      .catch((error) => {
        setBatchRequestCountCurve(error);
        setJobRequestCountCurve(error);
        setBatchRequestPage(error);
      });
  }, [selectedExecutionSystem, minCreateTime, maxCreateTime]);

  const renderBatchRequestGantt = useCallback((batchRequestPage) => {
    const batchRequestGantt = getDefaultRequestGantt();
    if (!batchRequestPage || batchRequestPage instanceof Error) {
      return;
    }
    
    const batchRequestList = batchRequestPage.content;
    const requestNames = [];
    const requestList = [];
    
    batchRequestList.slice().reverse().forEach((item, index) => {
      const startTime = moment.utc(item.startTime).local();
      let endTime = moment();
      if (item.endTime) {
        endTime = moment.utc(item.endTime).local();
      }
      requestNames.push([item.name]);
      requestList.push([index, +startTime, +endTime, item.name, item.status]);
    });
    
    batchRequestGantt.requestNames.data = requestNames;
    batchRequestGantt.requestList.data = requestList;
    setBatchRequestGantt(batchRequestGantt);
  }, [getDefaultRequestGantt]);

  const renderJobRequestGantt = useCallback((jobRequestPage) => {
    const jobRequestGantt = getDefaultRequestGantt();
    if (!jobRequestPage || jobRequestPage instanceof Error) {
      return;
    }
    
    const jobRequestList = [...jobRequestPage.content].reverse();
    
    jobRequestList.forEach((item, index) => {
      const startTime = moment.utc(item.startTime).local();
      let endTime = moment();
      if (item.endTime) {
        endTime = moment.utc(item.endTime).local();
      }
      jobRequestGantt.requestNames.data.push([item.name]);
      jobRequestGantt.requestList.data.push([index, +startTime, +endTime, item.name, item.status]);
    });

    setJobRequestGantt(jobRequestGantt);
  }, [getDefaultRequestGantt]);

  const clearAndLoadData = useCallback(() => {
    setFilteringOptions({});
    setBatchRequestCountCurve(null);
    loadData();
  }, [loadData]);

  const loadAppInfo = useCallback(() => {
    appInfoService.getAppInfo()
      .then((appInfo) => setAppInfo(appInfo))
      .catch((error) => {
        console.log(`Fail to load app info: ${error}`);
      });
  }, []);

  // Keyboard event handler
  const onKeyDown = useCallback((e) => {
    if (e.keyCode === 13 && e.target && (e.target).id && 
        (e.target).id.indexOf('query-') !== -1) {
      // Handle apply filtering options if needed
    }
  }, []);

  // Effects
  useEffect(() => {
    loadData();
    loadAppInfo();
    document.title = 'View In Execution System';

    onKeyDownRef.current = onKeyDown;
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [loadData, loadAppInfo, onKeyDown]);

  useEffect(() => {
    if (selectedExecutionSystem) {
      loadExecutionSystemView();
    }
  }, [selectedExecutionSystem, loadExecutionSystemView]);

  useEffect(() => {
    console.log('Reloading data...');
    clearAndLoadData();
  }, [location.search, clearAndLoadData]);

  // Render functions
  const renderExecutionSystemList = () => {
    if (executionSystemList === null) {
      return <LoadingIndicator />;
    }
    if (executionSystemList instanceof Error) {
      return <ErrorAlert error={executionSystemList} />;
    }

    const envName = appInfo.envName;
    let switchmanEnv = 'dev';
    if (envName === 'QTF-PPE') {
      switchmanEnv = 'uat';
    } else if (envName === 'PDN-CLUSTER') {
      switchmanEnv = 'prod';
    }
    
    return executionSystemList.map(executionSystem => (
      <li key={executionSystem.id} className="list-group-item d-flex justify-content-between align-items-center">
        <div>
          <div className="fw-bold">{executionSystem.name}</div>
          <small className="form-text text-primary">
            <a href={`https://insight.hsbc-1203042-fival1-dev.dev.gcp.cloud.uk.hsbc/frontend/legend/${switchmanEnv}`}>
              Inside/SwitchMan to check grid engine
            </a>
          </small>
        </div>
        <button 
          type="button" 
          className="badge badge-info btn btn-info" 
          onClick={() => onChangeView(executionSystem)}
        >
          View
        </button>
      </li>
    ));
  };

  const renderBatchRequestPage = () => {
    if (batchRequestPage === null) {
      return <LoadingIndicator />;
    }
    if (batchRequestPage instanceof Error) {
      return <ErrorAlert error={batchRequestPage} />;
    }

    const batchRequestList = batchRequestPage.content;
    const rows = (batchRequestList || []).map(batchRequest => (
      <tr key={batchRequest.id}>
        <td>
          <input
            type="checkbox"
            checked={onCheckedBatch(batchRequest)}
            onChange={event => onSelectBatchRequest(batchRequest, event)}
          />
        </td>
        <td>
          <a 
            href={`/frontend/monitoring/batch-request/list?assignmentGroup=GDM&minCreateTime=${minCreateTime}&nameKeyword=${batchRequest.name}&maxCreateTime=${maxCreateTime || ''}&overrun=false&page=0&size=50&sort=startTime%2Cdesc`}
            target="_blank" 
            rel="noopener noreferrer"
          >
            {truncateChars(batchRequest.name, 80)}
          </a>
        </td>
        <td>
          <div>
            <RequestStatusBadge status={batchRequest.status} />
          </div>
          <div className="text-muted">
            {formatTime(batchRequest.startTime) || 'N/A'} ~ {formatTime(batchRequest.endTime) || 'N/A'}
          </div>
        </td>
        <td>
          <button
            className="btn btn-outline-primary btn-sm"
            type="button"
            title="List Job Request"
            onClick={() => onListJobRequest(batchRequest)}
          >
            <i className="fa fa-fw fa-circle-o-notch" />
          </button>
        </td>
      </tr>
    ));

    return (
      <div>
        <table className="table table-striped table-fixed">
          <thead>
            <tr>
              <th scope="col" className="col-1">
                <input
                  type="checkbox"
                  checked={checkedAllBatch}
                  onChange={onSelectBatchRequestAll}
                />
              </th>
              <th scope="col" className="col-5">Name</th>
              <th scope="col" className="col-4">Status/Timeline</th>
              <th scope="col" className="col-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>
        <Paginator page={batchRequestPage} onClickPage={onClickBatchPage} />
      </div>
    );
  };

  const renderJobRequestPage = () => {
    if (batchRequest == null) {
      return <Alert type="primary" text="You need to choose a batch request first." />;
    }

    if (jobRequestPage === null) {
      return <LoadingIndicator />;
    }
    if (jobRequestPage instanceof Error) {
      return <ErrorAlert error={jobRequestPage} />;
    }

    const jobRequestList = jobRequestPage.content;
    const rows = (jobRequestList || []).map(jobRequest => (
      <tr key={jobRequest.id}>
        <td>
          <input
            type="checkbox"
            checked={onCheckedJob(jobRequest)}
            onChange={event => onSelectJobRequest(jobRequest, event)}
          />
        </td>
        <td>
          <a 
            href={`/frontend/monitoring/job-request/list?assignmentGroup=GDM&enableFilterByParameters=false&minCreateTime=${minCreateTime}&maxCreateTime=${maxCreateTime || ''}&nameKeyword=${jobRequest.name}&&overrun=false&page=0&size=50&sort=createTime%2Cdesc`}
            target="_blank" 
            rel="noopener noreferrer"
          >
            {truncateChars(jobRequest.name, 80)}
          </a>
        </td>
        <td>
          <div>
            <RequestStatusBadge status={jobRequest.status} />
          </div>
          <div className="text-muted">
            {formatTime(jobRequest.startTime) || 'N/A'} ~ {formatTime(jobRequest.endTime) || 'N/A'}
          </div>
        </td>
      </tr>
    ));

    return (
      <div>
        <table className="table table-striped table-fixed">
          <thead>
            <tr>
              <th scope="col" className="col-2">
                <input
                  type="checkbox"
                  checked={checkedAllJob}
                  onChange={onSelectJobRequestAll}
                />
              </th>
              <th scope="col" className="col-5">Job Name</th>
              <th scope="col" className="col-5">Status/Timeline</th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>
        <Paginator page={jobRequestPage} onClickPage={onClickJobPage} />
      </div>
    );
  };

  // Main render
  if (batchRequestCountCurve === null) {
    return <LoadingIndicator />;
  }
  if (batchRequestCountCurve instanceof Error) {
    return <ErrorAlert error={batchRequestCountCurve} />;
  }

  let startTime = null;
  if (minCreateTime) {
    startTime = new Date(minCreateTime);
  }
  let endTime = null;
  if (maxCreateTime) {
    endTime = new Date(maxCreateTime);
  }

  const executionSystems = renderExecutionSystemList();
  const batchRequestPageComponent = renderBatchRequestPage();
  const jobRequestPageComponent = renderJobRequestPage();

  const batchRequestCountChartData = [];
  for (let i = 0; i < batchRequestCountCurve.length; i++) {
    const batchRequestCount = batchRequestCountCurve[i];
    const time = moment.utc(batchRequestCount.createTime).local();
    batchRequestCountChartData.push([+time, batchRequestCount.ongoingCount]);
  }

  const jobRequestCountChartData = [];
  if (jobRequestCountCurve && !(jobRequestCountCurve instanceof Error)) {
    for (let i = 0; i < jobRequestCountCurve.length; i++) {
      const jobRequestCount = jobRequestCountCurve[i];
      const time = moment.utc(jobRequestCount.createTime).local();
      jobRequestCountChartData.push([+time, jobRequestCount.ongoingCount]);
    }
  }

  return (
    <div>
      <div className="row">
        <div className="col-xl-2">
          <div className="card shadow mb-4">
            <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
              <h6 className="m-0 font-weight-bold text-primary">Execution System List</h6>
            </div>
            <ul className="list-group list-group-flush" style={{ overflowY: 'scroll', height: '400px' }}>
              {executionSystems}
            </ul>
          </div>
        </div>

        <div className="col-xl-10">
          <div className="form-group row">
            <label htmlFor="batch-count-start-time" className="col-form-label col-form-label-sm mr-2">
              start time:
            </label>
            <div>
              <DatePicker
                id="batch-count-start-time"
                selected={startTime}
                onChange={onChangeCountStartTimeRange}
                className="form-control form-control-sm"
                dateFormat="yyyy-MM-dd HH:mm"
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={30}
                timeCaption="time"
                peekNextMonth
                showMonthDropdown
                showYearDropdown
              />
            </div>
            <label htmlFor="batch-count-End-time" className="col-form-label col-form-label-sm ml-2 mr-2">
              end time:
            </label>
            <div>
              <DatePicker
                id="batch-count-End-time"
                selected={endTime}
                onChange={onChangeCountEndTimeRange}
                className="form-control form-control-sm"
                dateFormat="yyyy-MM-dd HH:mm"
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={30}
                timeCaption="time"
                peekNextMonth
                showMonthDropdown
                showYearDropdown
              />
            </div>
            <button type="button" className="btn btn-primary btn-sm ml-2" onClick={onRunQuery}>
              Run Query
            </button>
          </div>
          <div className="row">
            <div className="col-xl-6">
              <div className="card shadow mb-4">
                <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                  <h6 className="m-0 font-weight-bold text-primary">
                    {selectedExecutionSystem && selectedExecutionSystem.name} & Batch
                  </h6>
                  <div className="dropdown no-arrow">
                    <a
                      className="dropdown-toggle"
                      href="#x"
                      role="button"
                      id="dropdownMenuLink2"
                      data-toggle="dropdown"
                      aria-haspopup="true"
                      aria-expanded="false"
                    >
                      <i className="fa fa-ellipsis-v fa-sm fa-fw text-gray-400" />
                    </a>
                    <div
                      className="dropdown-menu dropdown-menu-right shadow animated--fade-in"
                      aria-labelledby="dropdownMenuLink"
                    >
                      <div className="dropdown-header">No action can use yet:</div>
                      <a className="dropdown-item" href="#1">No implement 1</a>
                      <a className="dropdown-item" href="#2">No implement 1</a>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <div>
                    <ChartAreaWithTimeAxis 
                      data={batchRequestCountChartData} 
                      title="Batch Request Ongoing Count" 
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-6">
              <div className="card shadow mb-4">
                <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                  <h6 className="m-0 font-weight-bold text-primary">
                    {selectedExecutionSystem && selectedExecutionSystem.name} & Job
                  </h6>
                  <div className="dropdown no-arrow">
                    <a
                      className="dropdown-toggle"
                      href="#x"
                      role="button"
                      id="dropdownMenuLink2"
                      data-toggle="dropdown"
                      aria-haspopup="true"
                      aria-expanded="false"
                    >
                      <i className="fa fa-ellipsis-v fa-sm fa-fw text-gray-400" />
                    </a>
                    <div
                      className="dropdown-menu dropdown-menu-right shadow animated--fade-in"
                      aria-labelledby="dropdownMenuLink"
                    >
                      <div className="dropdown-header">View</div>
                      <button
                        className="dropdown-item"
                        type="button"
                        onClick={() => onViewRequestGantt('BATCH', 3)}
                      >
                        Last 3 days
                      </button>
                      <a className="dropdown-item" href="#2">No implement 2</a>
                      <div className="dropdown-divider" />
                      <a className="dropdown-item" href="#x">No implement 3</a>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <div>
                    <ChartAreaWithTimeAxis 
                      data={jobRequestCountChartData} 
                      title="Job Request Ongoing Count" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-xl-4">
          <div className="card shadow mb-4">
            <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
              <h6 className="m-0 font-weight-bold text-primary">
                {selectedExecutionSystem && selectedExecutionSystem.name}
              </h6>
              <div className="dropdown no-arrow">
                <a
                  className="dropdown-toggle"
                  href="#x"
                  role="button"
                  id="dropdownMenuLink2"
                  data-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  <i className="fa fa-ellipsis-v fa-sm fa-fw text-gray-400" />
                </a>
                <div
                  className="dropdown-menu dropdown-menu-right shadow animated--fade-in"
                  aria-labelledby="dropdownMenuLink"
                >
                  <div className="dropdown-header">View Select Request Chart</div>
                  <button
                    className="dropdown-item"
                    type="button"
                    onClick={() => onViewRequestGantt('BATCH', 3)}
                  >
                    Last 3 days
                  </button>
                  <button
                    className="dropdown-item"
                    type="button"
                    onClick={() => onViewRequestGantt('BATCH', 5)}
                  >
                    Last 5 days
                  </button>
                  <div className="dropdown-divider" />
                  <a className="dropdown-item" href="#x">No implement 3</a>
                </div>
              </div>
            </div>
            <div className="card-body" style={{ overflowY: 'scroll', height: '420px' }}>
              <div>
                <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                  Batch Request List
                </div>
                {batchRequestPageComponent}
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-8">
          <div className="card shadow mb-4">
            <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
              <h6 className="m-0 font-weight-bold text-primary">Batch Request Gantt</h6>
              <div className="dropdown no-arrow">
                <a
                  className="dropdown-toggle"
                  href="#x"
                  role="button"
                  id="dropdownMenuLink2"
                  data-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  <i className="fa fa-ellipsis-v fa-sm fa-fw text-gray-400" />
                </a>
                <div
                  className="dropdown-menu dropdown-menu-right shadow animated--fade-in"
                  aria-labelledby="dropdownMenuLink"
                >
                  <div className="dropdown-header">No action can use yet:</div>
                  <a className="dropdown-item" href="#1">No implement 1</a>
                  <a className="dropdown-item" href="#2">No implement 1</a>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div>
                <ChartRequestGanttWithTimeAxis 
                  data={batchRequestGantt} 
                  title="Batch Request Gantt" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-xl-4">
          <div className="card shadow mb-4">
            <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
              <h6 className="m-0 font-weight-bold text-primary">Job Requests on Batch </h6>
              <div className="dropdown no-arrow">
                <a
                  className="dropdown-toggle"
                  href="#x"
                  role="button"
                  id="dropdownMenuLink2"
                  data-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  <i className="fa fa-ellipsis-v fa-sm fa-fw text-gray-400" />
                </a>
                <div
                  className="dropdown-menu dropdown-menu-right shadow animated--fade-in"
                  aria-labelledby="dropdownMenuLink"
                >
                  <div className="dropdown-header">View Select Request Chart</div>
                  <button
                    className="dropdown-item"
                    type="button"
                    onClick={() => onViewRequestGantt('JOB', 3)}
                  >
                    Last 3 days
                  </button>
                  <button
                    className="dropdown-item"
                    type="button"
                    onClick={() => onViewRequestGantt('JOB', 5)}
                  >
                    Last 5 days
                  </button>
                  <div className="dropdown-divider" />
                  <a className="dropdown-item" href="#x">No implement 3</a>
                </div>
              </div>
            </div>

            <div className="card-body">
              <div>
                <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                  {batchRequest && batchRequest.name}
                </div>
                {jobRequestPageComponent}
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-8">
          <div className="card shadow mb-4">
            <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
              <h6 className="m-0 font-weight-bold text-primary">Job Request Gantt</h6>
              <div className="dropdown no-arrow">
                <a
                  className="dropdown-toggle"
                  href="#x"
                  role="button"
                  id="dropdownMenuLink2"
                  data-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  <i className="fa fa-ellipsis-v fa-sm fa-fw text-gray-400" />
                </a>
                <div
                  className="dropdown-menu dropdown-menu-right shadow animated--fade-in"
                  aria-labelledby="dropdownMenuLink"
                >
                  <div className="dropdown-header">No action can use yet:</div>
                  <a className="dropdown-item" href="#1">No implement 1</a>
                  <a className="dropdown-item" href="#2">No implement 1</a>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div>
                <ChartRequestGanttWithTimeAxis 
                  data={jobRequestGantt} 
                  title="Job Request Gantt" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withCurrentUser(ExecutionSystemView);