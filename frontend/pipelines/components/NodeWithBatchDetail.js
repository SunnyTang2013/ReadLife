import React, { useEffect, useState } from 'react';
import { cloneDeep, isEqual } from 'lodash';

import ParametersTable from '../../components/ParametersTable';
import ErrorAlert from '../../components/ErrorAlert';
import batchService from '../../backend/batchService';

const emptyNodeDetail = {
  id: null,
  pipelineId: null,
  sequence: 'N/A',
  overriddenParameters: {
    entries: {
    },
  },
  batchSummary: {
    id: null,
    name: 'N/A',
    pipelineCount: 'N/A',
    jobCount: 'N/A',
    overriddenParameters: {
      entries: {
      },
    },
  },
};

const NodeWithBatchDetail = ({ pipelineNodeSummary, onChangeParameters, onRefreshNodeSummary, changeParameters }) => {
  const [nodeSummary, setNodeSummary] = useState(cloneDeep(pipelineNodeSummary || emptyNodeDetail));

  useEffect(() => {
    setNodeSummary(cloneDeep(pipelineNodeSummary || emptyNodeDetail));
  }, [pipelineNodeSummary]);

  function onRefresh() {
    if (!nodeSummary.batchSummary.id) {
      return;
    }
    batchService.getBatchDetail(nodeSummary.batchSummary.id).then((batchDetail) => {
      const updatedNodeSummary = { ...nodeSummary, batchSummary: batchDetail };
      setNodeSummary(updatedNodeSummary);
      if (onRefreshNodeSummary) {
        onRefreshNodeSummary(updatedNodeSummary);
      }
    })
      .catch((error) => {
        setNodeSummary(error);
      });
  }

  function onChangeOverrideParameters(overriddenParameters) {
    if (!onChangeParameters) {
      return;
    }
    const newNodeSummary = Object.assign({}, nodeSummary, { overriddenParameters });
    setNodeSummary(newNodeSummary);
    onChangeParameters(newNodeSummary);
  }

  if (nodeSummary instanceof Error) {
    return <ErrorAlert error={nodeSummary} />;
  }

  let onChange = onChangeOverrideParameters;
  if (nodeSummary.sequence === 'N/A' || !changeParameters) {
    onChange = null;
  }

  let $linkButton = null;
  if (nodeSummary.batchSummary.id) {
    $linkButton = (
      <div className="form-group">
        <a
          className="card-link"
          target="_blank"
          rel="noopener noreferrer"
          href={`/frontend/pipelines/list?containBatch=${nodeSummary.batchSummary.id}`}
        >
          Quick List
        </a>
        <a
          className="card-link"
          href={`/frontend/batches/detail/${nodeSummary.batchSummary.id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Go To Batch
        </a>
        <button className="btn btn-link" type="button" onClick={onRefresh}>
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="card mb-3 mb-lg-0 shadow bg-white rounded">
      <div className="card-header">
        <h5 className="mb-0">Node Of Batch Information</h5>
      </div>
      <div className="card-body bg-light">
        <div className="form-group">
          <div className="row">
            <div className="col-sm">Name</div>
            <div className="col-sm">{nodeSummary.batchSummary.name}</div>
          </div>
          <div className="row">
            <div className="col-sm">Sequence</div>
            <div className="col-sm">{nodeSummary.sequence}</div>
          </div>
          <div className="row">
            <div className="col-sm">Type</div>
            <div className="col-sm">Batch</div>
          </div>
        </div>
        <div className="form-group">
          <div className="row">
            <div className="col-sm">Used In Pipeline</div>
            <div className="col-sm">
              {nodeSummary.batchSummary && (
                <a
                  href={`/frontend/pipelines/list?containBatch=${nodeSummary.batchSummary.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {nodeSummary.batchSummary.pipelineCount}
                </a>
              )}
              {!nodeSummary.batchSummary.pipelineCount && (
                <i className="fa fa-fw fa-spinner fa-spin mr-1" />
              )}
            </div>
          </div>
          <div className="row">
            <div className="col-sm">Jobs Include</div>
            <div className="col-sm">
              {nodeSummary.batchSummary && `${nodeSummary.batchSummary.jobCount}`}
              {!nodeSummary.batchSummary.jobCount && (
                <i className="fa fa-fw fa-spinner fa-spin mr-1" />
              )}
            </div>
          </div>
        </div>
        {$linkButton}
        
        <hr className="border-dashed border-bottom-0" />
        <h3 className="display-7">Batch Overridden Parameters</h3>
        <div className="form-group">
          <button
            className="btn btn-link"
            type="button"
            data-toggle="collapse"
            data-target="#collapse-batch-overrides"
            aria-expanded="false"
            aria-controls="collapse-batch-overrides"
          >
            Show All
          </button>
        </div>
        <div id="collapse-batch-overrides" className="collapse">
          <div className="d-flex align-items-center">
            <ParametersTable parameters={nodeSummary.batchSummary.overriddenParameters} />
          </div>
        </div>
        
        <hr className="border-dashed border-bottom-0" />
        <div className="form-group">
          <h3 className="display-7">Node Overridden Parameters</h3>
          <ParametersTable parameters={nodeSummary.overriddenParameters} onChange={onChange} />
        </div>
      </div>
    </div>
  );
};

NodeWithBatchDetail.defaultProps = {
  pipelineNodeSummary: null,
  onChangeParameters: null,
};

export default NodeWithBatchDetail;