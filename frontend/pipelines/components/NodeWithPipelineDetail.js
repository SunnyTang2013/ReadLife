import React, { useState, useEffect, useCallback } from 'react';
import { cloneDeep, isEqual } from 'lodash';

import { formatTime } from '../../utils/utilities';
import ParametersTable from '../../components/ParametersTable';
import pipelineService from '../../backend/pipelineService';

const emptyNodeDetail = {
  id: null,
  pipelineId: null,
  sequence: 'N/A',
  overriddenParameters: {
    entries: {
    },
  },
  pipeline: {
    id: null,
    name: 'N/A',
    lastUpdatedBy: 'N/A',
    updateTime: 'N/A',
  },
};

const NodeWithPipelineDetail = ({ pipelineNodeSummary, onChangeParameters, changeParameters, onRefreshNodeSummary }) => {
  const [nodeSummary, setNodeSummary] = useState(cloneDeep(pipelineNodeSummary || emptyNodeDetail));

  useEffect(() => {
    setNodeSummary(cloneDeep(pipelineNodeSummary || emptyNodeDetail));
  }, [pipelineNodeSummary]);

  const onChangeOverrideParameters = useCallback((overriddenParameters) => {
    if (!onChangeParameters) {
      return;
    }
    const newNodeSummary = Object.assign({}, nodeSummary, { overriddenParameters });
    setNodeSummary(newNodeSummary);
    onChangeParameters(newNodeSummary);
  }, [nodeSummary, onChangeParameters]);

  const onRefresh = useCallback(() => {
    if (!nodeSummary.pipeline.id) {
      return;
    }
    pipelineService.getPipelineDetail(nodeSummary.pipeline.id)
      .then((pipeline) => {
        const updatedNodeSummary = { ...nodeSummary, pipeline };
        setNodeSummary(updatedNodeSummary);
        onRefreshNodeSummary(updatedNodeSummary);
      })
      .catch(error => setNodeSummary(error));
  }, [nodeSummary, onRefreshNodeSummary]);

  let onChange = onChangeOverrideParameters;
  if (nodeSummary.sequence === 'N/A' || !changeParameters) {
    onChange = null;
  }

  return (
    <div className="card mb-3 mb-lg-0 shadow bg-white rounded">
      <div className="card-header">
        <h5 className="mb-0">Pipeline Information</h5>
      </div>
      <div className="card-body bg-light">
        <div className="form-group">
          <div className="row">
            <div className="col-sm">Name</div>
            <div className="col-sm">
              <a
                href={`/frontend/pipelines/detail/${nodeSummary.pipeline.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {nodeSummary.pipeline.name}
              </a>
            </div>
          </div>
          <div className="row">
            <div className="col-sm">Sequence</div>
            <div className="col-sm">{nodeSummary.sequence}</div>
          </div>
        </div>
        <div className="form-group">
          <div className="row">
            <div className="col-sm">Last Updated by</div>
            <div className="col-sm">{nodeSummary.pipeline.lastUpdatedBy}</div>
          </div>
          <div className="row">
            <div className="col-sm">Last Update Time</div>
            <div className="col-sm">{formatTime(nodeSummary.pipeline.updateTime) || 'N/A'}</div>
          </div>
        </div>
        
        <div className="form-group">
          <button
            className="btn btn-link"
            type="button"
            onClick={onRefresh}
          >
            Refresh
          </button>
        </div>
        
        <hr className="border-dashed border-bottom-0" />
        <h3 className="display-7">Pipeline Overridden Parameters</h3>
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
            <ParametersTable parameters={nodeSummary.pipeline.overriddenParameters} />
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

export default NodeWithPipelineDetail;