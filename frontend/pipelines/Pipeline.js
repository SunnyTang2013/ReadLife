import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { cloneDeep } from 'lodash';

import pipelineService from '../backend/pipelineService';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';

import NodeWithBatchDetail from './components/NodeWithBatchDetail';
import DeleteModal from '../components/DeleteModal';
import pipelineRequestService from '../backend/pipelineRequestService';
import { checkWithinFiveCalendarDays, formatTime, sortBySequencyAndName } from '../utils/utilities';
import ScheduleCreateFromJobs from '../schedule/ScheduleCreateFromModal';
import NodeWithPipelineDetail from './components/NodeWithPipelineDetail';
import ParametersTable from '../components/ParametersTable';
import { addCobDateParam } from '../backend/jobExecution';
import RunModal from '../components/RunModal';

const Pipeline = () => {
  const [pipeline, setPipeline] = useState(null);
  const [pipelineNodeSummary, setPipelineNodeSummary] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openRunModal, setOpenRunModal] = useState(false);

  const navigate = useNavigate();
  const { pipelineId } = useParams();

  useEffect(() => {
    _loadPipelineDetail();
  }, [pipelineId]);

  function onRunModal() {
    const cobParameters = addCobDateParam();
    /* eslint-disable dot-notation */
    const asofdate = cobParameters.entries['ASOFDATE'];
    const marketdate = cobParameters.entries['MARKETDATE'];
    const tradeasofdate = cobParameters.entries['trade_as_of_date'];
    const cobdate = cobParameters.entries['scorch.ui.cobdate'];

    const manifestFilter = cobParameters.entries['goldeneye.manifestFilter'];
    const vaultSnapid = cobParameters.entries['vault.snapID'];
    const goldeneyeOptions = cobParameters.entries['goldeneye.options'];

    const isChanged = checkWithinFiveCalendarDays(asofdate, marketdate, tradeasofdate, cobdate);
    if (isChanged && (manifestFilter || vaultSnapid || goldeneyeOptions)) {
      setOpenRunModal(true);
    } else {
      onQuickRun();
    }
  }

  function onSelectNode(pipelineNode) {
    setPipelineNodeSummary(pipelineNode);
  }

  function onOpenDeleteModal() {
    setOpenModal(true);
  }

  function onDelete() {
    pipelineService.deletePipeline(pipelineId)
      .then(() => {
        setOpenModal(false);
        onCompleteDeletion();
      })
      .catch((error) => {
        setOpenModal(false);
        setPipeline(error);
      });
  }

  function onCompleteDeletion() {
    setOpenModal(false);
    toast.success(`Pipeline #${pipelineId} is deleted successfully.`);
    navigate('/list');
  }

  function onCancel() {
    setOpenModal(false);
    setOpenRunModal(false);
  }

  function onQuickRun() {
    pipelineRequestService.submitPipeline(pipelineId)
      .then((pipelineRequest) => {
        navigate(`/pipeline-request-submitted/${pipelineRequest.id}`);
      })
      .catch((error) => {
        toast.error(`Failed to submit pipeline: ${error}`);
      });
  }

  function onRefreshNodeSummary(nodeSummary) {
    setPipeline(prevPipeline => {
      const pipelineClone = cloneDeep(prevPipeline);
      const pipelineNodeList = pipelineClone.pipelineNodeSummaries.map(node => {
        if (node.nodeType === nodeSummary.nodeType && node.sequence === nodeSummary.sequence) {
          if ((node.nodeType === 'BATCH' && node.batchSummary.name === nodeSummary.batchSummary.name)
            || (node.nodeType === 'PIPELINE' && node.pipeline.name === nodeSummary.pipeline.name)) {
            return nodeSummary;
          }
        }
        return node;
      });
      pipelineClone.pipelineNodeSummaries = pipelineNodeList;
      return pipelineClone;
    });
  }

  function _runModal() {
    if (openRunModal) {
      return <RunModal name={pipeline.name} title="Pipeline" openModal={openRunModal} onQuickRun={onQuickRun} onClose={onCancel} />;
    }

    return null;
  }

  function _loadPipelineDetail() {
    pipelineService.getPipelineDetail(pipelineId)
      .then((pipeline) => {
        setPipeline(pipeline);
      })
      .catch(error => setPipeline(error));
  }

  function _renderPipelineNodes(pipeline) {
    const pipelineNodeList = pipeline.pipelineNodeSummaries;
    const pipelineNodes = pipeline.pipelineNodeSummaries.length;
    Object.keys(pipelineNodeList).forEach((key) => {
      if (pipelineNodeList[key].nodeType === 'BATCH') {
        pipelineNodeList[key].name = (pipelineNodeList[key].batchSummary.name).trim();
      } else if (pipelineNodeList[key].nodeType === 'PIPELINE') {
        pipelineNodeList[key].name = (pipelineNodeList[key].pipeline.name).trim();
      }
    });
    const pNLLengthFilterByBatch = pipelineNodeList.filter(p => p.nodeType === 'BATCH').length;
    const pNLLengthFilterByPipeline = pipelineNodeList.filter(p => p.nodeType === 'PIPELINE').length;
    const $rows = (pipelineNodeList || []).sort(sortBySequencyAndName)
      .map(pipelineNode => {
        let name = null;
        if (pipelineNode.nodeType === 'BATCH') {
          name = pipelineNode.batchSummary.name;
        } else if (pipelineNode.nodeType === 'PIPELINE') {
          name = pipelineNode.pipeline.name;
        }

        let disabled = '';
        if (pipelineNode.status === 'IGNORE') {
          disabled = 'table-warning';
        }

        let nodeStatus;
        switch (pipelineNode.status) {
          case 'ACTIVE':
            nodeStatus = 'Stop pipeline';
            break;
          case 'IGNORE':
            nodeStatus = 'Trigger next sequence';
            break;
          case 'Disable':
            nodeStatus = 'Batch Disabled';
            break;
          case 'L1_LIGHT':
            nodeStatus = 'L1 Light';
            break;
          default:
            nodeStatus = 'Stop pipeline';
            break;
        }

        return React.createElement('tr', { key: pipelineNode.id, className: disabled },
          React.createElement('td', null,
            React.createElement('div', null,
              <strong>{pipelineNode.sequence}</strong>
            )
          ),
          <td>{<div>{nodeStatus}</div>}</td>,
          <td>{<div>{pipelineNode.nodeType}</div>}</td>,
          React.createElement('td', null,
            React.createElement('div', null,
              React.createElement('button', {
                type: 'button',
                className: 'btn btn-link',
                onClick: () => onSelectNode(pipelineNode)
              }, name)
            )
          ),
          <td>{<div>{pipelineNode.testScope.entries.L2_DISABLE === 'Y' ? 'L2 DISABLE' : ''}</div>,
            <div>{pipelineNode.testScope.entries.L1_LIGHT === 'Y' ? 'L1 LIGHT' : ''}</div>,
            <div>{pipelineNode.testScope.entries.L1_DISABLE === 'Y' ? 'L1 DISABLE' : ''}</div>,
            <div>{pipelineNode.testScope.entries.NOT_RUN === 'Y' ? 'Disable On All Test' : ''}</div>}</td>
        );
      });

    return React.createElement('table', { className: 'table table-fixed' },
      React.createElement('thead', null,
        React.createElement('tr', null,
          React.createElement('th', { style: { width: '10%' } }, `Seq/${pipelineNodes}`),
          React.createElement('th', { style: { width: '15%' } }, 'If Job Fails'),
          React.createElement('th', { style: { width: '20%' } }, `Type(B/${pNLLengthFilterByBatch}):(P/${pNLLengthFilterByPipeline})`),
          React.createElement('th', { style: { width: '40%' } }, 'Name'),
          React.createElement('th', { style: { width: '15%' } }, 'Test Scope')
        )
      ),
      <tbody>{$rows}</tbody>
    );
  }

  function _deleteModal() {
    if (openModal) {
      return <DeleteModal name={pipeline.name} title="Pipeline" openModal={openModal} onDelete={onDelete} onClose={onCancel} />;
    }

    return null;
  }

  const currentUser = { canWrite: true, canExecute: true }; // Mock currentUser
  const canWrite = currentUser.canWrite;
  const changeParameters = false;
  
  if (pipeline === null) {
    return <LoadingIndicator />;
  }
  
  if (pipeline instanceof Error) {
    return <ErrorAlert error={pipeline} />;
  }

  const $pipelineNodes = _renderPipelineNodes(pipeline);
  const $deleteModal = _deleteModal();
  const $runModal = _runModal();

  return (
    <div style={{ maxWidth: '85%' }} className="container-fluid">
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/list">Pipelines</Link>
          </li>
          <li className="breadcrumb-item active">{pipeline.name}</li>
        </ol>
      </nav>

      <h2 className="display-4">{pipeline.name}</h2>
      <div className="d-flex justify-content-between">
        <div className="btn-toolbar mb-2" role="toolbar">
          {canWrite && (
            <div>
              <Link
                to={`/update/${pipeline.id}`}
                className="btn btn-sm btn-primary btn-light-primary mr-2"
              >
                <i className="fa fa-fw fa-pencil" /> Edit
              </Link>
              <Link
                to={`/clone/${pipeline.id}`}
                className="btn btn-sm btn-primary btn-light-primary mr-2"
              >
                <i className="fa fa-fw fa-copy" /> Clone
              </Link>
              <button className="btn btn-sm btn-danger mr-3" type="button" onClick={onOpenDeleteModal}>
                <i className="fa fa-fw fa-trash" /> Delete
              </button>
            </div>
          )}
          {currentUser.canExecute && (
            <div className="btn-group btn-group-sm mr-2" role="group">
              <Link
                to={`/pipeline/customized-run/${pipeline.id}`}
                className="btn btn-primary btn-light-primary"
              >
                <i className="fa fa-fw fa-play" /> Customized Run
              </Link>
              <button className="btn btn-primary btn-light-primary" type="button" onClick={onRunModal}>
                <i className="fa fa-fw fa-forward" /> Run Pipeline
              </button>
            </div>
          )}
          {canWrite && (
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
                tabIndex="-1"
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
                        <span aria-hidden="true">×</span>
                      </button>
                    </div>
                    <div className="modal-body">
                      <ScheduleCreateFromJobs jobName={pipeline.name} submitType="submitPipeline" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="mb-2">
          <Link
            to={`/notice/${pipeline.name}/${pipeline.id}`}
            className="btn btn-sm btn-primary btn-light-primary mr-2"
          >
            <i className="fa fa-fw fa-comments" /> Notice
          </Link>
        </div>
      </div>

      <div className="row">
        <div className="col-8">
          <section>
            <div className="row">
              <div className="col-4">
                <div className="card mb-3 mb-lg-3 shadow bg-white rounded">
                  <div className="card-header">
                    <h5 className="mb-0">Last Updated</h5>
                  </div>
                  <div className="card-body bg-light">
                    <div className="form-group">
                      <div className="row">
                        <div className="col-sm">Last Updated by</div>
                        <div className="col-sm">{pipeline.lastUpdatedBy}</div>
                      </div>
                      <div className="row">
                        <div className="col-sm">Last Update Time</div>
                        <div className="col-sm">{formatTime(pipeline.updateTime) || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-8">
                <div className="card mb-3 mb-lg-3 shadow bg-white rounded">
                  <div className="card-header">
                    <h5 className="mb-0">Description</h5>
                  </div>
                  <div className="card-body bg-light">
                    <p style={{ whiteSpace: 'pre-line' }}>{pipeline.description}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="card mb-3 mb-lg-3 shadow bg-white rounded">
              <div className="card-header">
                <h5 className="mb-0">Pipeline Nodes</h5>
              </div>
              <div className="card-body bg-light">{$pipelineNodes}</div>
            </div>
          </section>
        </div>

        <div className="col-4">
          <div className="sticky-top sticky-sidebar">
            <div className="card mb-3 mb-lg-3 shadow bg-white rounded">
              <div className="card-header">
                <h5 className="mb-0">Override Parameters</h5>
              </div>
              <div className="card-body bg-light">
                <ParametersTable parameters={pipeline.overriddenParameters} />
              </div>
            </div>

            {(!pipelineNodeSummary || pipelineNodeSummary.nodeType === 'BATCH') && (
              <NodeWithBatchDetail 
                pipelineNodeSummary={pipelineNodeSummary} 
                onRefreshNodeSummary={onRefreshNodeSummary} 
                changeParameters={changeParameters} 
              />
            )}
            
            {pipelineNodeSummary && pipelineNodeSummary.nodeType === 'PIPELINE' && (
              <NodeWithPipelineDetail 
                pipelineNodeSummary={pipelineNodeSummary} 
                onRefreshNodeSummary={onRefreshNodeSummary} 
                changeParameters={changeParameters} 
              />
            )}
          </div>
        </div>
      </div>
      
      <section>{$runModal}</section>
      {$deleteModal}
    </div>
  );
};

export default Pipeline;