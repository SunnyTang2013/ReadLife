import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { cloneDeep } from 'lodash';

import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';
import ParametersTable from '../components/ParametersTable';
import { withCurrentUser } from '../components/currentUser';
import { addCobDateParam } from '../backend/jobExecution';
import batchService from '../backend/batchService';
import { checkWithinFiveCalendarDays, formatTime, sortCaseInsensitive } from '../utils/utilities';
import DeleteModal from '../components/DeleteModal';
import RunModal from '../components/RunModal';
import ScheduleCreateFromJobs from '../schedule/ScheduleCreateFromModal';
import ValuesTable from '../components/ValuesTable';


const BatchDetail = ({ currentUser }) => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  
  const [batchDetail, setBatchDetail] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openRunModal, setOpenRunModal] = useState(false);

  const loadData = useCallback(() => {
    if (!batchId) return;
    
    batchService.getBatchDetail(parseInt(batchId))
      .then((data) => {
        setBatchDetail(data);
      })
      .catch((error) => {
        setBatchDetail(error);
      });
  }, [batchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onDelete = useCallback(() => {
    if (!batchId) return;
    
    batchService.deleteBatchDetail(parseInt(batchId))
      .then(() => {
        setOpenModal(false);
        onCompleteDeletion();
      })
      .catch((error) => {
        setOpenModal(false);
        setBatchDetail(error);
      });
  }, [batchId]);

  const onSynchronizeCounters = useCallback(() => {
    if (!batchId) return;
    
    batchService.synchronizeBatchCounters(parseInt(batchId))
      .then((batchSummary) => {
        toast.success(`Batch #${batchId} is synchronized successfully.`);
        setBatchDetail((prevState) => {
          if (prevState && !(prevState instanceof Error)) {
            const updated = cloneDeep(prevState);
            updated.usedCount = batchSummary.usedCount;
            return updated;
          }
          return prevState;
        });
      })
      .catch((error) => {
        toast.error(`Fail to synchronize counts for this batch: ${error}`);
      });
  }, [batchId]);

  const onCompleteDeletion = useCallback(() => {
    setOpenModal(false);
    toast.success(`Batch #${batchId} is deleted successfully.`);
    navigate('/list');
  }, [batchId, navigate]);

  const onCancel = useCallback(() => {
    setOpenModal(false);
    setOpenRunModal(false);
  }, []);

  const onOpenDeleteModal = useCallback(() => {
    setOpenModal(true);
  }, []);

  const onQuickRun = useCallback(() => {
    if (!batchId) return;
    
    batchService.submitBatch(parseInt(batchId))
      .then((batchRequest) => {
        navigate(`/batch-request-submitted/${batchRequest.id}`);
      })
      .catch((error) => {
        toast.error(`Failed to submit batch: ${error}`);
      });
  }, [batchId, navigate]);

  const onRunModal = useCallback(() => {
    if (!batchDetail || batchDetail instanceof Error) return;
    
    const cobParameters = addCobDateParam();
    const asofdate = cobParameters.entries['ASOFDATE'];
    const marketdate = cobParameters.entries['MARKETDATE'];
    const tradeasofdate = cobParameters.entries['trade_as_of_date'];
    const cobdate = cobParameters.entries['scorch.ui.cobdate'];

    // params from Advanced tag
    const manifestFilter = cobParameters.entries['goldeneye.manifestFilter'];
    const vaultSnapid = cobParameters.entries['vault.snapID'];
    const goldeneyeOptions = cobParameters.entries['goldeneye.options'];

    // params from overridden parameters
    const filter = batchDetail.overriddenParameters?.entries?.['goldeneye.manifestFilter'];
    const snapid = batchDetail.overriddenParameters?.entries?.['vault.snapID'];
    const options = batchDetail.overriddenParameters?.entries?.['goldeneye.options'];
    const isChanged = checkWithinFiveCalendarDays(asofdate, marketdate, tradeasofdate, cobdate);

    if (isChanged
      && ((manifestFilter || vaultSnapid || goldeneyeOptions) || (filter || snapid || options))) {
      setOpenRunModal(true);
    } else {
      onQuickRun();
    }
  }, [batchDetail, onQuickRun]);

  const renderDeleteModal = useCallback(() => {
    if (openModal && batchDetail && !(batchDetail instanceof Error)) {
      return (
        <DeleteModal
          name={batchDetail.name}
          title="Batch"
          openModal={openModal}
          onDelete={onDelete}
          onClose={onCancel}
        />
      );
    }
    return null;
  }, [openModal, batchDetail, onDelete, onCancel]);

  const renderRunModal = useCallback(() => {
    if (openRunModal && batchDetail && !(batchDetail instanceof Error)) {
      return (
        <RunModal
          name={batchDetail.name}
          title="Batch"
          openModal={openRunModal}
          onQuickRun={onQuickRun}
          onClose={onCancel}
        />
      );
    }
    return null;
  }, [openRunModal, batchDetail, onQuickRun, onCancel]);

  const renderJobRows = useCallback(() => {
    if (!batchDetail || batchDetail instanceof Error || !batchDetail.jobPlainInfos) {
      return null;
    }
    
    return sortCaseInsensitive(batchDetail.jobPlainInfos, item => item.name).map((job, i) => (
      <tr key={job.id}>
        <td>{i + 1}</td>
        <td>
          <h5 className="font-15 mb-1 font-weight-normal">
            <a
              href={`/frontend/jobs/job/detail/${job.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {job.name}
            </a>
          </h5>
          <span className="text-muted font-13">{job.location}</span>
        </td>
        <td>{job.owner}</td>
      </tr>
    ));
  }, [batchDetail]);

  if (batchDetail === null) {
    return <LoadingIndicator />;
  }

  if (batchDetail instanceof Error) {
    return <ErrorAlert error={batchDetail} />;
  }

  const deleteModal = renderDeleteModal();
  const runModal = renderRunModal();
  const jobRows = renderJobRows();

  let listJobWayIcon;
  switch (batchDetail.batchType) {
    case 'HIERARCHY':
      listJobWayIcon = 'fa-sitemap';
      break;
    case 'LABEL':
      listJobWayIcon = 'fa-tag';
      break;
    case 'CONTEXT':
      listJobWayIcon = 'fa-microchip';
      break;
    case 'CRITERIA':
      listJobWayIcon = 'fa-search';
      break;
    default:
      listJobWayIcon = 'fa-list-ul';
      break;
  }

  return (
    <div style={{ maxWidth: '85%' }} className="container-fluid">
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/list">Batch List</Link>
          </li>
          <li className="breadcrumb-item active">{batchDetail.name}</li>
        </ol>
      </nav>

      <h2 className="display-4">{batchDetail.name}</h2>

      <div className="btn-toolbar mb-2" role="toolbar">
        {currentUser.canWrite && (
          <div>
            <Link
              to={`/update/${batchDetail.id}`}
              className="btn btn-sm btn-primary btn-light-primary mr-2"
            >
              <i className="fa fa-fw fa-pencil" /> Edit
            </Link>
            <Link
              to={`/copy/${batchDetail.id}`}
              className="btn btn-sm btn-primary btn-light-primary mr-2"
            >
              <i className="fa fa-fw fa-copy" /> Clone
            </Link>
            <button
              className="btn btn-sm btn-primary btn-light-primary mr-2"
              type="button"
              onClick={onSynchronizeCounters}
            >
              <i className="fa fa-fw fa-refresh" /> Synchronize Counters
            </button>
            <button
              className="btn btn-sm btn-danger mr-2"
              type="button"
              onClick={onOpenDeleteModal}
            >
              <i className="fa fa-fw fa-trash" /> Delete
            </button>
          </div>
        )}
        {currentUser.canExecute && (
          <div>
            <div className="btn-group btn-group-sm mr-2" role="group">
              <Link
                to={`/customized-run/${batchDetail.id}`}
                className="btn btn-primary btn-light-primary"
                title="Customized Run"
              >
                <i className="fa fa-fw fa-play" /> Customized Run
              </Link>
              <button
                className="btn btn-primary btn-light-primary"
                type="button"
                onClick={onRunModal}
              >
                <i className="fa fa-fw fa-forward" /> Quick Run
              </button>
            </div>
          </div>
        )}
        {currentUser.canWrite && (
          <div>
            <a
              href="#myModal"
              className="btn btn-sm btn-primary btn-light-primary"
              data-toggle="modal"
              data-target="#myModal"
            >
              <i className="fa fa-fw fa-clock-o" />Schedule
            </a>
            <div
              className="modal right fade"
              id="myModal"
              tabIndex={-1}
              role="dialog"
              aria-labelledby="myModalLabel"
              aria-hidden="true"
            >
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h4 className="modal-title" id="myModalLabel">Set Up Schedule</h4>
                    <button
                      type="button"
                      className="close"
                      data-dismiss="modal"
                      aria-label="Close"
                    >
                      <span aria-hidden="true">&times;</span>
                    </button>
                  </div>
                  <div className="modal-body">
                    <ScheduleCreateFromJobs
                      jobName={batchDetail.name}
                      submitType="submitBatchWithBatchName"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <section>
        <div className="row mb-3">
          <div className="col-lg-6 col-xl-4 d-flex">
            <div className="card flex-fill">
              <div className="card-body shadow p-3 bg-white rounded">
                <div className="float-right">
                  <i className={`fa fa-2x ${listJobWayIcon}`} />
                </div>
                <h5 className="card-subtitle mb-2 text-muted">Original Name</h5>
                <h3>{batchDetail.batchTypeName}</h3>
                <span className="text-muted">
                  {batchDetail.batchType || 'Static Job List'}
                </span>
              </div>
            </div>
          </div>

          <div className="col-lg-6 col-xl-4 d-flex">
            <div className="card flex-fill">
              <div className="card-body shadow p-3 bg-white rounded">
                <div className="float-right">
                  <i className="fa fa-2x fa-user" />
                </div>
                <h5 className="card-subtitle mb-2 text-muted">Last Updated</h5>
                <h3>{batchDetail.lastUpdatedBy}</h3>
                <span className="text-muted">
                  {formatTime(batchDetail.updateTime) || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="col-lg-6 col-xl-4 d-flex">
            <div className="card flex-fill">
              <div className="card-body shadow p-3 bg-white rounded">
                <div className="float-right">
                  <i className="fa fa-2x fa-plug" />
                </div>
                <h5 className="card-subtitle mb-2 text-muted">Used In Pipeline</h5>
                <h3>
                  <a
                    href={`/frontend/pipelines/list?containBatch=${batchDetail.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {batchDetail.pipelineCount}
                  </a>
                </h3>
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-2">
          <div className="col-lg-8 mb-3 d-flex">
            <div className="card flex-fill">
              <div className="card-body shadow p-3 bg-white rounded">
                <h4 className="header-title mb-3 text-muted">Info</h4>
                <div>
                  <table className="table table-striped table-sm table-nowrap table-centered mb-0 table-fixed">
                    <tbody>
                      <tr key="batch-entity">
                        <th className="nowrap">Entity</th>
                        <th className="nowrap">Contain In Job Name</th>
                        <th className="nowrap">Not Contain In Job Name</th>
                      </tr>
                      <tr key="batch-description">
                        <td>{batchDetail.entity || 'N/A'}</td>
                        <td>{batchDetail.containInJobName || 'N/A'}</td>
                        <td>{batchDetail.notContainInJobName || 'N/A'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-4 mb-3 d-flex">
            <div className="card flex-fill">
              <div className="card-body shadow p-3 bg-white rounded">
                <h4 className="header-title mb-3 text-muted">Description</h4>
                <p className="card-text">{batchDetail.description || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="row mb-2">
          <div className="col-lg-8 mb-3">
            <div className="card">
              <div className="card-body shadow p-3 bg-white rounded">
                <h4 className="header-title mb-3">Job List</h4>
                <span className="text-muted">
                  Total {batchDetail.jobPlainInfos?.length || 0} Job(s)
                </span>
                <div>
                  <table className="table table-striped table-sm table-nowrap table-centered mb-0 table-fixed">
                    <thead>
                      <tr>
                        <th style={{ width: '25px' }}></th>
                        <th style={{ width: '65%' }}>Name/Location</th>
                        <th style={{ width: '80px' }}>Owner</th>
                      </tr>
                    </thead>
                    <tbody>{jobRows}</tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-4 mb-3">
            <div className="card">
              <div className="card-body shadow p-3 bg-white rounded">
                <h4 className="header-title mb-3">Active Directory Groups</h4>
                <ValuesTable values={batchDetail.adGroups || []} />
              </div>
            </div>
            <div className="card mt-3">
              <div className="card-body shadow p-3 bg-white rounded">
                <h4 className="header-title mb-3">Config Group Variables</h4>
                <ParametersTable parameters={batchDetail.configGroupVariables || { entries: {} }} />
              </div>
            </div>
            <div className="card mt-3">
              <div className="card-body shadow p-3 bg-white rounded">
                <h4 className="header-title mb-3">Override Parameters</h4>
                <ParametersTable parameters={batchDetail.overriddenParameters || { entries: {} }} />
              </div>
            </div>
            <div className="card mt-3">
              <div className="card-body shadow p-3 bg-white rounded">
                <h4 className="header-title mb-3">Falcon parameters</h4>
                <ParametersTable 
                  parameters={batchDetail.rodParameters || { entries: {} }} 
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section>{runModal}</section>
      {deleteModal}
    </div>
  );
};

export default withCurrentUser(BatchDetail);