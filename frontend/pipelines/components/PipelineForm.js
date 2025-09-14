import React, { useState, useCallback, useEffect } from 'react';
import { cloneDeep } from 'lodash';
import { toast } from 'react-toastify';

import PipelineNodeBlock from './PipelineNodeBlock';
import NodeWithBatchDetail from './NodeWithBatchDetail';
import Alert from '../../components/Alert';
import NodeWithPipelineDetail from './NodeWithPipelineDetail';
import ParametersTable from '../../components/ParametersTable';
import pipelineService from '../../backend/pipelineService';

function createPipelineInput(pipeline) {
  return Object.assign({}, pipeline, {
    pipelineNodeIds: pipeline.pipelineNodeSummaries.map(item => item.id),
  });
}

async function CheckDeadLoop(parentId, childId) {
  const isLoop = await pipelineService.checkPipelineDeadLoop(parentId, childId)
    .then((result) => {
      if (result.data && result.data.isLoop) {
        toast.error('Reference cycle detected, please choose another pipeline');
        return true;
      }
      return false;
    })
    .catch((error) => {
      toast.error(`Failed to check loop: ${error}`);
      return true;
    });

  return isLoop;
}

const PipelineForm = ({ pipeline, onSave, onCancel, disabled = false }) => {
  const [input, setInput] = useState(createPipelineInput(pipeline));
  const [pipelineNodeSummary, setPipelineNodeSummary] = useState(null);
  const [saveWarning, setSaveWarning] = useState(null);
  const [currentSeq, setCurrentSeq] = useState(1);
  const [nodeValueSummary, setNodeValueSummary] = useState(null);
  const [nodeType, setNodeType] = useState('BATCH');

  const onChangePipelineProperty = useCallback((name, event) => {
    const value = event.target.value;
    setInput((prevInput) => {
      const newInput = cloneDeep(prevInput);
      newInput[name] = value;
      return newInput;
    });
    setSaveWarning(null);
  }, []);

  const onChangePipelineNodes = useCallback(() => {
    if (!currentSeq || !nodeType || !nodeValueSummary) {
      return;
    }
    if (nodeType === 'PIPELINE' && input.id === nodeValueSummary.id) {
      toast.warn('You can not add a pipeline itself as its node.');
      return;
    }
    let pipelineNode = null;
    if (nodeType === 'BATCH') {
      pipelineNode = {
        sequence: currentSeq,
        nodeType: nodeType,
        batchSummary: nodeValueSummary,
        overriddenParameters: {
          entries: {},
        },
        testScope: {
          entries: {},
        },
      };
    } else {
      pipelineNode = {
        sequence: currentSeq,
        nodeType: nodeType,
        pipeline: nodeValueSummary,
        overriddenParameters: {
          entries: {},
        },
        testScope: {
          entries: {},
        },
      };
    }
    if (nodeType === 'BATCH') {
      const pipelineNodeSummaries = input.pipelineNodeSummaries
        .filter(item => !(item.sequence === pipelineNode.sequence
          && item.nodeType === pipelineNode.nodeType
          && item.batchSummary.name === pipelineNode.batchSummary.name))
        .concat([pipelineNode]);

      setInput({ ...input, pipelineNodeSummaries });
      return;
    }

    if (pipeline.id) {
      CheckDeadLoop(input.id, nodeValueSummary.id).then(isDeadLoop => {
        if (!isDeadLoop) {
          const pipelineNodeSummaries = input.pipelineNodeSummaries
            .filter(item => !(item.sequence === pipelineNode.sequence
              && item.nodeType === pipelineNode.nodeType
              && item.pipeline.name === pipelineNode.pipeline.name))
            .concat([pipelineNode]);

          setInput({ ...input, pipelineNodeSummaries });
        }
      });
      return;
    }

    const pipelineNodeSummaries = input.pipelineNodeSummaries
      .filter(item => !(item.sequence === pipelineNode.sequence
        && item.nodeType === pipelineNode.nodeType
        && item.pipeline.name === pipelineNode.pipeline.name))
      .concat([pipelineNode]);

    setInput({ ...input, pipelineNodeSummaries });
  }, [currentSeq, nodeType, nodeValueSummary, input, pipeline.id]);

  const onInputNodeName = useCallback((nodeType, nodeValueSummary) => {
    setNodeType(nodeType);
    setNodeValueSummary(nodeValueSummary);
  }, []);

  const onChangeNodeSeq = useCallback((pipelineNode, event) => {
    const value = event.target.value;
    setInput((prevInput) => {
      const newInput = cloneDeep(prevInput);
      const pipelineNodeList = newInput.pipelineNodeSummaries;
      pipelineNodeList.map(node => {
        if (node.nodeType === pipelineNode.nodeType && node.sequence === pipelineNode.sequence) {
          if ((node.nodeType === 'BATCH' && node.batchSummary.name === pipelineNode.batchSummary.name)
            || (node.nodeType === 'PIPELINE' && node.pipeline.name === pipelineNode.pipeline.name)) {
            const updateNode = node;
            updateNode.sequence = value;
            return updateNode;
          }
        }
        return node;
      });
      return newInput;
    });
  }, []);

  const onChangeSeq = useCallback((event) => {
    const nextSeq = event.target.value;
    if (!nextSeq) {
      setCurrentSeq(nextSeq);
    } else {
      const nextInt = parseInt(nextSeq, 10);
      if (Number.isNaN(nextInt)) {
        setCurrentSeq(0);
      } else {
        setCurrentSeq(nextInt);
      }
    }
  }, []);

  const onChangeOverrideParameters = useCallback((overriddenParameters) => {
    setInput((prevInput) => Object.assign({}, prevInput, { overriddenParameters }));
  }, []);

  const onChangeParameters = useCallback((nodeSummary) => {
    setInput((prevInput) => {
      const newInput = cloneDeep(prevInput);
      const pipelineNodeList = newInput.pipelineNodeSummaries.map(node => {
        if (node.nodeType === nodeSummary.nodeType && node.sequence === nodeSummary.sequence) {
          if ((node.nodeType === 'BATCH' && node.batchSummary.name === nodeSummary.batchSummary.name)
            || (node.nodeType === 'PIPELINE' && node.pipeline.name === nodeSummary.pipeline.name)) {
            return nodeSummary;
          }
        }
        return node;
      });
      newInput.pipelineNodeSummaries = pipelineNodeList;
      return newInput;
    });
  }, []);

  const handleSave = useCallback((event) => {
    event.preventDefault();
    // Drop off context and config groups from job input.
    const inputCopy = cloneDeep(input);
    if (!inputCopy.name) {
      setSaveWarning({
        type: 'warning',
        text: 'Please input a name.',
      });
      return;
    }

    if (inputCopy.name.length > 110) {
      toast.error('Pipeline name too long, please use shorter one');
      return;
    }
    delete inputCopy.pipelineNodeIds;
    setSaveWarning(null);
    onSave(inputCopy);
  }, [input, onSave]);

  const onDeleteNode = useCallback((pipelineNode) => {
    setInput((prevInput) => {
      const pipelineNodeList = prevInput.pipelineNodeSummaries;

      let updatedPipelineNodes = null;
      if (pipelineNode.nodeType === 'BATCH') {
        updatedPipelineNodes = pipelineNodeList
          .filter(item => !(item.sequence === pipelineNode.sequence
            && item.nodeType === pipelineNode.nodeType
            && item.batchSummary.name === pipelineNode.batchSummary.name));

        if (pipelineNodeSummary && pipelineNodeSummary.sequence === pipelineNode.sequence
          && pipelineNodeSummary.nodeType === pipelineNode.nodeType
          && pipelineNodeSummary.batchSummary.id === pipelineNode.batchSummary.id) {
          setPipelineNodeSummary(null);
        }
      } else {
        updatedPipelineNodes = pipelineNodeList
          .filter(item => !(item.sequence === pipelineNode.sequence
            && item.nodeType === pipelineNode.nodeType
            && item.pipeline.name === pipelineNode.pipeline.name));

        if (pipelineNodeSummary && pipelineNodeSummary.sequence === pipelineNode.sequence
          && pipelineNodeSummary.nodeType === pipelineNode.nodeType
          && pipelineNodeSummary.pipeline.id === pipelineNode.pipeline.id) {
          setPipelineNodeSummary(null);
        }
      }

      return { ...prevInput, pipelineNodeSummaries: updatedPipelineNodes };
    });
  }, [pipelineNodeSummary]);

  const onChangeNodeStatus = useCallback((event) => {
    const statusCheck = event.target.value;
    const targetNode = event.target.name;
    setInput((prevInput) => {
      const pipelineNodeList = prevInput.pipelineNodeSummaries;

      const newPipelineNodeList = pipelineNodeList.map((item) => {
        let itemNode;
        if (item.nodeType === 'PIPELINE') {
          itemNode = `${item.sequence}@${item.nodeType}@${item.pipeline.name}`;
        } else {
          itemNode = `${item.sequence}@${item.nodeType}@${item.batchSummary.name}`;
        }
        if (targetNode === itemNode) {
          return Object.assign({}, item, { status: statusCheck });
        }
        return item;
      });

      return { ...prevInput, pipelineNodeSummaries: newPipelineNodeList };
    });
  }, []);

  const onChangeNodeTestScope = useCallback((event) => {
    const { name, checked, value } = event.target;
    const isChecked = checked ? 'Y' : 'N';
    setInput((prevInput) => {
      const pipelineNodeList = prevInput.pipelineNodeSummaries;

      const newPipelineNodeList = pipelineNodeList.map((item) => {
        let itemNode;
        if (item.nodeType === 'PIPELINE') {
          itemNode = `${item.sequence}@${item.nodeType}@${item.pipeline.name}`;
        } else {
          itemNode = `${item.sequence}@${item.nodeType}@${item.batchSummary.name}`;
        }
        if (name === itemNode) {
          const testScope = cloneDeep(item.testScope);
          testScope.entries[value] = isChecked;
          return Object.assign({}, item, { testScope });
        }
        return item;
      });

      return { ...prevInput, pipelineNodeSummaries: newPipelineNodeList };
    });
  }, []);

  const onShowNodeDetail = useCallback((pipelineNode) => {
    setPipelineNodeSummary(pipelineNode);
  }, []);

  const onRefreshNodeSummary = useCallback((nodeSummary) => {
    setInput((prevInput) => {
      const newInput = cloneDeep(prevInput);
      const pipelineNodeList = newInput.pipelineNodeSummaries.map(node => {
        if (node.nodeType === nodeSummary.nodeType && node.sequence === nodeSummary.sequence) {
          if ((node.nodeType === 'BATCH' && node.batchSummary.name === nodeSummary.batchSummary.name)
            || (node.nodeType === 'PIPELINE' && node.pipeline.name === nodeSummary.pipeline.name)) {
            return nodeSummary;
          }
        }
        return node;
      });
      newInput.pipelineNodeSummaries = pipelineNodeList;
      return newInput;
    });
  }, []);

  const handleCancel = useCallback((event) => {
    event.preventDefault();
    onCancel && onCancel(event);
  }, [onCancel]);

  const renderNodeTable = useCallback((input) => {
    const pipelineNodeList = input.pipelineNodeSummaries;
    const $rows = (pipelineNodeList || []).map(pipelineNode => {
      let key;
      if (pipelineNode.nodeType === 'BATCH') {
        key = `${pipelineNode.sequence}-${pipelineNode.nodeType}-${pipelineNode.batchSummary.id}`;
      } else {
        key = `${pipelineNode.sequence}-${pipelineNode.nodeType}-${pipelineNode.pipeline.id}`;
      }
      const active = !pipelineNode.status || pipelineNode.status === '' || pipelineNode.status === 'ACTIVE';

      let nodeName;
      if (pipelineNode.nodeType === 'PIPELINE') {
        nodeName = `${pipelineNode.sequence}@${pipelineNode.nodeType}@${pipelineNode.pipeline.name}`;
      } else {
        nodeName = `${pipelineNode.sequence}@${pipelineNode.nodeType}@${pipelineNode.batchSummary.name}`;
      }

      return React.createElement('tr', { key: key },
        React.createElement('td', null,
          React.createElement('div', null,
            <input className="form-control" type="text" value={pipelineNode.sequence} onChange={event => onChangeNodeSeq(pipelineNode, event)} />
          )
        ),
        <td>{pipelineNode.nodeType}</td>,
        React.createElement('td', null,
          pipelineNode.nodeType === 'BATCH' &&
            React.createElement('a', {
              href: '#nodeinfo',
              style: { userSelect: 'auto' },
              onClick: () => onShowNodeDetail(pipelineNode)
            }, pipelineNode.batchSummary.name),
          pipelineNode.nodeType === 'PIPELINE' &&
            <a href="#nodeinfo" style={{ userSelect: 'auto'}} onClick={() => onShowNodeDetail(pipelineNode)}>
              {pipelineNode.pipeline.name}
            </a>
        ),
        React.createElement('td', null,
          React.createElement('button', {
            type: 'button',
            className: 'btn btn-link',
            onClick: () => onDeleteNode(pipelineNode)
          }, 'Delete')
        ),
        React.createElement('td', null,
          React.createElement('div', { className: 'mt-2' },
            React.createElement('div', { className: 'form-check' },
              React.createElement('label', { className: 'form-check-label' },
                <input type="radio" className="form-check-input" name={nodeName} value="ACTIVE" checked={active} onChange={onChangeNodeStatus} />,
                'Stop pipeline'
              )
            ),
            React.createElement('div', { className: 'form-check' },
              React.createElement('label', { className: 'form-check-label' },
                <input type="radio" className="form-check-input" name={nodeName} value="IGNORE" checked={pipelineNode.status === 'IGNORE'} onChange={onChangeNodeStatus} />,
                'Trigger next sequence'
              )
            )
          )
        ),
        React.createElement('td', null,
          React.createElement('div', { className: 'mt-2' },
            React.createElement('div', { className: 'form-check' },
              React.createElement('label', { className: 'form-check-label' },
                <input type="checkbox" className="form-check-input" name={nodeName} value="L2_DISABLE" checked={pipelineNode.testScope.entries.L2_DISABLE === 'Y'} onChange={onChangeNodeTestScope} />,
                'L2 Disabled'
              )
            ),
            React.createElement('div', { className: 'form-check' },
              React.createElement('label', { className: 'form-check-label' },
                <input type="checkbox" className="form-check-input" name={nodeName} value="L1_DISABLE" checked={pipelineNode.testScope.entries.L1_DISABLE === 'Y'} onChange={onChangeNodeTestScope} />,
                'L1 Disabled'
              )
            ),
            React.createElement('div', { className: 'form-check' },
              React.createElement('label', { className: 'form-check-label' },
                <input type="checkbox" className="form-check-input" name={nodeName} value="L1_LIGHT" checked={pipelineNode.testScope.entries.L1_LIGHT === 'Y'} onChange={onChangeNodeTestScope} />,
                'L1 Light'
              )
            ),
            React.createElement('div', { className: 'form-check' },
              React.createElement('label', { className: 'form-check-label' },
                <input type="checkbox" className="form-check-input" name={nodeName} value="NOT_RUN" checked={pipelineNode.testScope.entries.NOT_RUN === 'Y'} onChange={onChangeNodeTestScope} />,
                'Disable On All Test'
              )
            )
          )
        )
      );
    });

    return React.createElement('table', { className: 'table table-striped table-fixed' },
      React.createElement('thead', null,
        React.createElement('tr', null,
          React.createElement('th', { style: { width: '10%' } }, 'Sequence'),
          React.createElement('th', { style: { width: '10%', paddingLeft: '10px' } }, 'Node Type'),
          React.createElement('th', { style: { width: '40%', paddingLeft: '25px' } }, 'Node Name'),
          React.createElement('th', { style: { width: '10%', paddingLeft: '25px' } }, 'Action'),
          React.createElement('th', { style: { width: '15%', paddingLeft: '25px' } }, 'If job fails'),
          React.createElement('th', { style: { width: '15%', paddingLeft: '25px' } }, 'Test Scope')
        )
      ),
      <tbody>{$rows}</tbody>
    );
  }, [onChangeNodeSeq, onShowNodeDetail, onDeleteNode, onChangeNodeStatus, onChangeNodeTestScope]);

  const changeParameters = true;
  const $pipelineNodeTable = renderNodeTable(input);

  return React.createElement('div', null,
    saveWarning && <Alert type={saveWarning.type} text={saveWarning.text} />,
    React.createElement('div', { className: 'row no-gutters' },
      React.createElement('div', { className: 'col-lg-8 pr-lg-2' },
        React.createElement('form', { className: 'my-2' },
          React.createElement('fieldset', { disabled: disabled },
            React.createElement('section', null,
              React.createElement('div', { className: 'card mb-3 shadow bg-white rounded' },
                React.createElement('div', { className: 'card-header' },
                  React.createElement('h5', { className: 'mb-0' }, 'Pipeline Info')
                ),
                React.createElement('div', { className: 'card-body bg-light' },
                  React.createElement('div', { className: 'form-row' },
                    React.createElement('div', { className: 'col-12' },
                      React.createElement('div', { className: 'form-group' },
                        React.createElement('label', { htmlFor: 'pipeline-name' }, 'Pipeline Name'),
                        <input id="pipeline-name" className="form-control" type="text" value={input.name} onChange={event => onChangePipelineProperty('name', event)} />
                      )
                    ),
                    React.createElement('div', { className: 'col-12' },
                      React.createElement('div', { className: 'form-group' },
                        React.createElement('label', { htmlFor: 'event-description' }, 'Description'),
                        <textarea className="form-control" id="event-description" name="description" rows="6" value={input.description || ''} onChange={event => onChangePipelineProperty('description', event)} />
                      )
                    )
                  )
                )
              ),

              React.createElement('div', { className: 'card mb-3 shadow bg-white rounded' },
                React.createElement('div', { className: 'card-header' },
                  React.createElement('h5', { className: 'mb-0' }, 'Pipeline Nodes')
                ),
                React.createElement('div', { className: 'card-body bg-light' },
                  React.createElement('div', { className: 'mb-3' },
                    React.createElement('div', { className: 'row' },
                      React.createElement('div', { className: 'col-2' },
                        <input className="form-control" type="text" placeholder="Please input sequence" onChange={onChangeSeq} value={currentSeq} />
                      ),
                      <div className="col-8">{<PipelineNodeBlock onChange={onInputNodeName} />}</div>,
                      React.createElement('div', { className: 'col-2' },
                        React.createElement('button', {
                          className: 'btn btn-primary btn-light-primary',
                          type: 'button',
                          onClick: onChangePipelineNodes
                        },
                          <i className="fa fa-fw fa-plus" />, ' Add'
                        )
                      )
                    ),
                    <small className="ml-2 form-text text-muted">Sequence Is Numeric</small>
                  ),
                  $pipelineNodeTable
                )
              ),

              React.createElement('div', { className: 'card mb-3 shadow bg-white rounded' },
                React.createElement('div', { className: 'card-header' },
                  React.createElement('h5', { className: 'mb-0' }, 'Override Parameters')
                ),
                <div className="card-body bg-light">{<ParametersTable parameters={input.overriddenParameters} onChange={onChangeOverrideParameters} />}</div>
              )
            ),

            React.createElement('div', { className: 'form-group' },
              React.createElement('button', { className: 'btn btn-primary mr-2', type: 'button', onClick: handleSave },
                'Save'
              ),
              <button className="btn btn-secondary" type="button" onClick={handleCancel}>Cancel and Go Back</button>
            )
          )
        )
      ),
      React.createElement('div', { className: 'col-lg-4 pl-lg-2 my-2' },
        React.createElement('div', { className: 'sticky-top sticky-sidebar', id: 'nodeinfo' },
          (!pipelineNodeSummary || pipelineNodeSummary.nodeType === 'BATCH') &&
            <NodeWithBatchDetail pipelineNodeSummary={pipelineNodeSummary} onChangeParameters={onChangeParameters} changeParameters={changeParameters} onRefreshNodeSummary={onRefreshNodeSummary} />,
          pipelineNodeSummary && pipelineNodeSummary.nodeType === 'PIPELINE' &&
            <NodeWithPipelineDetail pipelineNodeSummary={pipelineNodeSummary} onChangeParameters={onChangeParameters} changeParameters={changeParameters} onRefreshNodeSummary={onRefreshNodeSummary} />
        )
      )
    )
  );
};

export default PipelineForm;