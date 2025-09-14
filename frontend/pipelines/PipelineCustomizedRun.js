import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { cloneDeep } from 'lodash';

import { slugify, sortCaseInsensitive, sortNumberAsc } from '../utils/utilities';

import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';
import pipelineService from '../backend/pipelineService';
import pipelineRequestService from '../backend/pipelineRequestService';
import AutoGrowTextarea from '../components/AutoGrowTextarea';

function extraChangedParameters(customizedBatchOverrideParameters, defaultBatchOverrideParameters) {
  const customizedArray = {};
  const keys = Object.keys(customizedBatchOverrideParameters);
  keys.forEach((key) => {
    const defaultValue = defaultBatchOverrideParameters[key];
    if (defaultValue !== customizedBatchOverrideParameters[key]) {
      customizedArray[key] = customizedBatchOverrideParameters[key];
    }
  });
  return customizedArray;
}

function getPipelineOverrideParameters(customizedPipelineParameters, defaultPipelineParameters) {
  const customizedArray = {};
  const keys = Object.keys(customizedPipelineParameters);
  keys.forEach((key) => {
    const defaultValue = defaultPipelineParameters[key];
    if (defaultValue !== customizedPipelineParameters[key]) {
      customizedArray[key] = customizedPipelineParameters[key];
    }
  });
  return customizedArray;
}

function getNodeOverrideParameters(nodeSummaries) {
  const overrides = {};
  nodeSummaries.pipelineNodeSummaries.forEach(pipelineNode => {
    if (pipelineNode.nodeType === 'BATCH') {
      const batchSummary = pipelineNode.batchSummary;
      if (batchSummary) {
        overrides[batchSummary.name] = pipelineNode.overriddenParameters.entries;
      }
    } else {
      const pipeline = pipelineNode.pipeline;
      if (pipeline) {
        overrides[pipeline.name] = pipelineNode.overriddenParameters.entries;
      }
    }
  });
  return overrides;
}

function extractCustomizedParameters(userParameters, defaultParameters) {
  const flattenedUserParameters = getNodeOverrideParameters(userParameters);
  const flattenedDefaultParameters = getNodeOverrideParameters(defaultParameters);

  const customizedParameters = {};
  Object.keys(flattenedDefaultParameters).forEach((nodeName) => {
    const userBatchOverrideParameters = flattenedUserParameters[nodeName];
    const defaultBatchOverrideParameters = flattenedDefaultParameters[nodeName];

    const overrides = extraChangedParameters(
      userBatchOverrideParameters, defaultBatchOverrideParameters,
    );
    if (overrides && Object.keys(overrides).length > 0) {
      customizedParameters[nodeName] = { entries: overrides };
    }
  });

  return customizedParameters;
}

function getAllParams(pipelineDetail) {
  return { pipelineNodeSummaries: pipelineDetail.pipelineNodeSummaries };
}

function addOverridesToNodeSummaries(pipelineDetail) {
  const pipeline = pipelineDetail;

  if (pipelineDetail) {
    const nodeSummaries = pipelineDetail.pipelineNodeSummaries.map(
      (pipelineNode) => {
        const nodeSummary = pipelineNode;
        if (pipelineNode.nodeType === 'BATCH'
          && Object.keys(pipelineNode.overriddenParameters.entries).length === 0) {
          nodeSummary.overriddenParameters = pipelineNode.batchSummary.overriddenParameters;
        } else if (pipelineNode.nodeType === 'PIPELINE'
          && Object.keys(pipelineNode.overriddenParameters.entries).length === 0) {
          nodeSummary.overriddenParameters = pipelineNode.pipeline.overriddenParameters;
        }
        return nodeSummary;
      },
    );

    pipeline.pipelineNodeSummaries = nodeSummaries;
    return pipeline;
  }

  return pipelineDetail;
}

const PipelineCustomizedRun = () => {
  const [pipelineDetail, setPipelineDetail] = useState(null);
  const [nodeSummaries, setNodeSummaries] = useState(null);
  const [pipelineOverrides, setPipelineOverrides] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const navigate = useNavigate();
  const { pipelineId } = useParams();

  useEffect(() => {
    _preparePipeline();
  }, [pipelineId]);

  function onChangeParameter(id, event) {
    const name = event.target.name;
    const value = event.target.value.replace(/[\n\r]/g, ' '); // Strip off possible line breaks.
    setNodeSummaries((prevNodeSummaries) => {
      const nodeSummariesClone = cloneDeep(prevNodeSummaries);
      const node = nodeSummariesClone.pipelineNodeSummaries.find(pipelineNode => pipelineNode.id === id);
      node.overriddenParameters.entries[name] = value;
      return nodeSummariesClone;
    });
  }

  function onChangePipelineOverrides(event) {
    const name = event.target.name;
    const value = event.target.value.replace(/[\n\r]/g, ' '); // Strip off possible line breaks.
    setPipelineOverrides((prevPipelineOverrides) => {
      const pipelineOverridesClone = cloneDeep(prevPipelineOverrides);
      pipelineOverridesClone.entries[name] = value;
      return pipelineOverridesClone;
    });
  }

  function onSubmit(event) {
    event.preventDefault();
    const originalNodeSummaries = getAllParams(pipelineDetail);
    const customizedParameters = extractCustomizedParameters(
      nodeSummaries, originalNodeSummaries,
    );

    const customizedPipelineOverrides = getPipelineOverrideParameters(
      pipelineOverrides.entries, pipelineDetail.overriddenParameters.entries,
    );
    customizedParameters.pipelineOverrides = { entries: customizedPipelineOverrides };

    console.log(`About to submit pipeline request for pipeline #${pipelineId}...`);
    pipelineRequestService.submitPipeline(pipelineId, customizedParameters)
      .then((pipelineRequest) => {
        navigate(`/pipeline-request-submitted/${pipelineRequest.id}`);
      })
      .catch((error) => {
        toast.error(`Failed to submit pipeline: ${error}`);
      });
  }

  function onCancel() {
    navigate(`/detail/${pipelineId}`, { replace: true });
  }

  function _preparePipeline() {
    console.log(`Preparing pipeline request for pipeline #${pipelineId}...`);
    pipelineService.getPipelineDetail(pipelineId)
      .then((pipelineDetail) => {
        const pipeline = addOverridesToNodeSummaries(pipelineDetail);

        setPipelineDetail(pipeline);
        setNodeSummaries(getAllParams(pipeline));
        setPipelineOverrides(pipeline.overriddenParameters);
        setIsSubmitting(false);
        setSubmitError(null);
      })
      .catch((error) => {
        setPipelineDetail(error);
        setNodeSummaries(null);
        setPipelineOverrides(null);
        setIsSubmitting(false);
        setSubmitError(null);
      });
  }

  function _renderPipelineNode(pipelineNode) {
    const $sequence = pipelineNode.sequence;
    let $nodeName;
    if (pipelineNode.nodeType === 'BATCH') {
      $nodeName = pipelineNode.batchSummary.name;
    } else {
      $nodeName = pipelineNode.pipeline.name;
    }
    const overriddenParametersEntries = pipelineNode.overriddenParameters.entries;

    const overriddenParameters = sortCaseInsensitive(Object.keys(overriddenParametersEntries));
    const $childRows = overriddenParameters.map(name => 
      React.createElement('tr', { key: `entry-${pipelineNode.id}-${name}` },
        React.createElement('th', { className: 'align-middle', style: { width: '25%' } }, name),
        React.createElement('td', null,
          React.createElement(AutoGrowTextarea, {
            className: 'form-control',
            name: name,
            value: overriddenParametersEntries[name],
            onChange: event => onChangeParameter(pipelineNode.id, event)
          })
        )
      )
    );
    
    const $rows = React.createElement('tr', { key: `entry-${pipelineNode.id}-${$nodeName}` },
      React.createElement('td', null,
        React.createElement('div', { className: 'card-header' },
          React.createElement('h6', { className: 'mb-0' },
            React.createElement('a', {
              'data-toggle': 'collapse',
              href: `#pipelineNode-${slugify($nodeName)}`
            }, `${$sequence} - ${pipelineNode.nodeType} - ${$nodeName}`)
          )
        ),
        React.createElement('div', {
          id: `pipelineNode-${slugify($nodeName)}`,
          className: 'collapse'
        },
          <table className="mb-0 table table-fixed">
            <tbody>{$childRows}</tbody>
          </table>
        )
      )
    );
    
    return React.createElement('div', { key: pipelineNode.id, className: 'card my-2' },
      React.createElement('div', { id: `node-${pipelineNode.id}` },
        React.createElement('table', { className: 'mb-0 table table-fixed' },
          <tbody>{$rows}</tbody>
        )
      )
    );
  }

  function _renderPipelineOverrides(pipelineOverrides, pipelineName) {
    const overriddenParametersEntries = pipelineOverrides.entries;

    const overriddenParameters = sortCaseInsensitive(Object.keys(overriddenParametersEntries));
    const $childRows = overriddenParameters.map(name =>
      React.createElement('tr', { key: `entry-${name}` },
        React.createElement('th', { className: 'align-middle', style: { width: '25%' } }, name),
        React.createElement('td', null,
          React.createElement(AutoGrowTextarea, {
            className: 'form-control',
            name: name,
            value: overriddenParametersEntries[name],
            onChange: event => onChangePipelineOverrides(event)
          })
        )
      )
    );
    
    const $rows = React.createElement('tr', { key: 'entry-pipeline' },
      React.createElement('td', null,
        React.createElement('div', { className: 'card-header' },
          React.createElement('h6', { className: 'mb-0' },
            React.createElement('a', {
              'data-toggle': 'collapse',
              href: '#pipeline-overrides'
            }, pipelineName)
          )
        ),
        React.createElement('div', {
          id: 'pipeline-overrides',
          className: 'collapse'
        },
          React.createElement('table', { className: 'mb-0 table table-fixed' },
            <tbody>{$childRows}</tbody>
          )
        )
      )
    );
    
    return React.createElement('div', { key: 'pipeline-overrides', className: 'card my-2' },
      React.createElement('table', { className: 'mb-0 table table-fixed' },
        <tbody>{$rows}</tbody>
      )
    );
  }

  if (pipelineDetail === null) {
    return <LoadingIndicator />;
  }
  
  if (pipelineDetail instanceof Error) {
    return <ErrorAlert error={pipelineDetail} />;
  }

  const $pipelineNodes = sortNumberAsc(nodeSummaries.pipelineNodeSummaries, s => s.sequence).map(
    (pipelineNode) => {
      const $pipelineNode = _renderPipelineNode(pipelineNode);
      return React.createElement('div', { key: `node-${pipelineNode.id}` }, $pipelineNode);
    },
  );

  const $pipelineParameters = _renderPipelineOverrides(
    pipelineOverrides, pipelineDetail.name,
  );

  return (
    <div>
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/list">Pipeline List</Link>
          </li>
          <li className="breadcrumb-item active">Customized Run</li>
        </ol>
      </nav>

      <h2 className="display-4">{pipelineDetail.name}</h2>

      <div className="alert alert-primary">
        <h4 className="alert-heading">
          <i className="fa fa-fw fa-cog" /> Customized Run
        </h4>
        <div className="my-1">This page allows you to customize some of the pipeline parameters before submitting the pipeline.</div>
        <div className="my-1">Please review and modify as necessary the parameters below, then click the <strong>Submit</strong> button at the bottom of this page.</div>
        <div className="my-1">Level: Advanced > Pipeline > Node</div>
        <div className="my-1">When submitting a pipeline, the parameters on the node will be overridden by pipeline, at last the advanced feature parameters will override node parameters.</div>
      </div>

      <ErrorAlert error={submitError} />

      <form onSubmit={onSubmit}>
        <fieldset disabled={isSubmitting}>
          <section>
            <h3 className="display-6">Pipeline Parameters</h3>
            {$pipelineParameters}
          </section>
          <section>
            <h3 className="display-6">Node Parameters</h3>
            {$pipelineNodes}
          </section>
          <div className="form-group">
            <ul className="list-inline">
              <li className="list-inline-item">
                <button className="btn btn-primary" type="submit">Submit</button>
              </li>
              <li className="list-inline-item">
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={onCancel}
                >
                  Cancel
                </button>
              </li>
            </ul>
          </div>
        </fieldset>
      </form>
    </div>
  );
};

export default PipelineCustomizedRun;