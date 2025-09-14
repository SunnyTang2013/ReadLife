import React, { useState, useCallback, useEffect } from 'react';
import { cloneDeep } from 'lodash';
import { toast } from 'react-toastify';
import ProfilePipelineNodeBlock from './ProfilePipelineNodeBlock';
import Alert from '../../components/Alert';
import pipelineService from '../../backend/pipelineService';

function createProfileInput(profile) {
  return Object.assign({}, profile, {
    profileNodeIds: profile.profileNodeSummaries.map(item => item.id),
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

const ProfilePipelineForm = ({ profile, onSave, onCancel, disabled = false }) => {
  const [input, setInput] = useState(() => createProfileInput(profile));
  const [profileNodeSummary, setProfileNodeSummary] = useState(null);
  const [saveWarning, setSaveWarning] = useState(null);
  const [nodeValueSummary, setNodeValueSummary] = useState(null);
  const [nodeType, setNodeType] = useState('BATCH');

  const onChangePipelineProperty = useCallback((name, event) => {
    const value = event.target.value;
    setInput(prevInput => {
      const newInput = cloneDeep(prevInput);
      newInput[name] = value;
      return newInput;
    });
    setSaveWarning(null);
  }, []);

  const onChangePipelineNodes = useCallback(async () => {
    if (!nodeType || !nodeValueSummary) {
      return;
    }
    if (nodeType === 'PIPELINE' && input.id === nodeValueSummary.id) {
      toast.warn('You can not add a pipeline itself as its node.');
      return;
    }
    let pipelineNode = null;
    if (nodeType === 'BATCH') {
      pipelineNode = {
        nodeType: nodeType,
        batchSummary: nodeValueSummary,
        testScope: {
          entries: {},
        },
      };
    } else {
      pipelineNode = {
        nodeType: nodeType,
        pipeline: nodeValueSummary,
        testScope: {
          entries: {},
        },
      };
    }
    if (nodeType === 'BATCH') {
      const profileNodeSummaries = input.profileNodeSummaries
        .filter(item => !(item.nodeType === pipelineNode.nodeType
          && item.batchSummary.name === pipelineNode.batchSummary.name))
        .concat([pipelineNode]);

      setInput(prevInput => ({
        ...prevInput,
        profileNodeSummaries
      }));
      return;
    }

    if (profile.id) {
      const isDeadLoop = await CheckDeadLoop(input.id, nodeValueSummary.id);
      if (!isDeadLoop) {
        const profileNodeSummaries = input.profileNodeSummaries
          .filter(item => !(item.nodeType === pipelineNode.nodeType
            && item.pipeline.name === pipelineNode.pipeline.name))
          .concat([pipelineNode]);

        setInput(prevInput => ({
          ...prevInput,
          profileNodeSummaries
        }));
      }
      return;
    }

    const profileNodeSummaries = input.profileNodeSummaries
      .filter(item => !(item.sequence === pipelineNode.sequence
        && item.nodeType === pipelineNode.nodeType
        && item.pipeline.name === pipelineNode.pipeline.name))
      .concat([pipelineNode]);

    setInput(prevInput => ({
      ...prevInput,
      profileNodeSummaries
    }));
  }, [nodeType, nodeValueSummary, input, profile]);

  const onInputNodeName = useCallback((nodeType, nodeValueSummary) => {
    setNodeType(nodeType);
    setNodeValueSummary(nodeValueSummary);
  }, []);

  const onChangeParameters = useCallback((nodeSummary) => {
    setInput(prevInput => {
      const newInput = cloneDeep(prevInput);
      const pipelineNodeList = newInput.profileNodeSummaries.map(node => {
        if (node.nodeType === nodeSummary.nodeType && node.sequence === nodeSummary.sequence) {
          if ((node.nodeType === 'BATCH' && node.batchSummary.name === nodeSummary.batchSummary.name)
            || (node.nodeType === 'PIPELINE' && node.pipeline.name === nodeSummary.pipeline.name)) {
            return nodeSummary;
          }
        }
        return node;
      });
      newInput.profileNodeSummaries = pipelineNodeList;
      return newInput;
    });
  }, []);

  const onSaveHandler = useCallback((event) => {
    event.preventDefault();
    const newInput = cloneDeep(input);
    if (!newInput.name) {
      setSaveWarning({
        type: 'warning',
        text: 'Please input a name.',
      });
      return;
    }

    if (newInput.name.length > 110) {
      toast.error('Profile name too long, please use shorter one');
      return;
    }
    delete newInput.profileNodeIds;
    setSaveWarning(null);
    onSave(newInput);
  }, [input, onSave]);

  const onDeleteNode = useCallback((pipelineNode) => {
    setInput(prevInput => {
      const { profileNodeSummaries } = prevInput;
      let updatedPipelineNodes = null;
      
      if (pipelineNode.nodeType === 'BATCH') {
        updatedPipelineNodes = profileNodeSummaries
          .filter(item => !(item.sequence === pipelineNode.sequence
            && item.nodeType === pipelineNode.nodeType
            && item.batchSummary.name === pipelineNode.batchSummary.name));

        if (profileNodeSummary && profileNodeSummary.sequence === pipelineNode.sequence
          && profileNodeSummary.nodeType === pipelineNode.nodeType
          && profileNodeSummary.batchSummary.id === pipelineNode.batchSummary.id) {
          setProfileNodeSummary(null);
        }
      } else {
        updatedPipelineNodes = profileNodeSummaries
          .filter(item => !(item.sequence === pipelineNode.sequence
            && item.nodeType === pipelineNode.nodeType
            && item.pipeline.name === pipelineNode.pipeline.name));

        if (profileNodeSummary && profileNodeSummary.sequence === pipelineNode.sequence
          && profileNodeSummary.nodeType === pipelineNode.nodeType
          && profileNodeSummary.pipeline.id === pipelineNode.pipeline.id) {
          setProfileNodeSummary(null);
        }
      }

      return {
        ...prevInput,
        profileNodeSummaries: updatedPipelineNodes
      };
    });
  }, [profileNodeSummary]);

  const onChangeNodeTestScope = useCallback((event) => {
    const { name, checked, value } = event.target;
    const isChecked = checked ? 'Y' : 'N';
    
    setInput(prevInput => {
      const pipelineNodeList = prevInput.profileNodeSummaries;
      const newPipelineNodeList = pipelineNodeList.map((item) => {
        let itemNode;
        if (item.nodeType === 'PIPELINE') {
          itemNode = `${item.nodeType}@${item.pipeline.name}`;
        } else {
          itemNode = `${item.nodeType}@${item.batchSummary.name}`;
        }
        if (name === itemNode) {
          const testScope = cloneDeep(item.testScope);
          testScope.entries[value] = isChecked;
          return Object.assign({}, item, { testScope });
        }
        return item;
      });

      return {
        ...prevInput,
        profileNodeSummaries: newPipelineNodeList
      };
    });
  }, []);

  const onShowNodeDetail = useCallback((pipelineNode) => {
    setProfileNodeSummary(pipelineNode);
  }, []);

  const onRefreshNodeSummary = useCallback((nodeSummary) => {
    setInput(prevInput => {
      const newInput = cloneDeep(prevInput);
      const pipelineNodeList = newInput.profileNodeSummaries.map(node => {
        if (node.nodeType === nodeSummary.nodeType && node.sequence === nodeSummary.sequence) {
          if ((node.nodeType === 'BATCH' && node.batchSummary.name === nodeSummary.batchSummary.name)
            || (node.nodeType === 'PIPELINE' && node.pipeline.name === nodeSummary.pipeline.name)) {
            return nodeSummary;
          }
        }
        return node;
      });
      newInput.profileNodeSummaries = pipelineNodeList;
      return newInput;
    });
  }, []);

  const onCancelHandler = useCallback((event) => {
    event.preventDefault();
    onCancel && onCancel(event);
  }, [onCancel]);

  const renderNodeTable = useCallback((input) => {
    const pipelineNodeList = input.profileNodeSummaries;
    const rows = (pipelineNodeList || []).map(pipelineNode => {
      let key;
      if (pipelineNode.nodeType === 'BATCH') {
        key = `${pipelineNode.sequence}-${pipelineNode.nodeType}-${pipelineNode.batchSummary.id}`;
      } else {
        key = `${pipelineNode.sequence}-${pipelineNode.nodeType}-${pipelineNode.pipeline.id}`;
      }

      let nodeName;
      if (pipelineNode.nodeType === 'PIPELINE') {
        nodeName = `${pipelineNode.nodeType}@${pipelineNode.pipeline.name}`;
      } else {
        nodeName = `${pipelineNode.nodeType}@${pipelineNode.batchSummary.name}`;
      }

      return React.createElement('tr', { key },
        <td>{pipelineNode.nodeType}</td>,
        React.createElement('td', null,
          pipelineNode.nodeType === 'BATCH' && React.createElement('a', {
            href: '#nodeinfo',
            style: { userSelect: 'auto' },
            onClick: () => onShowNodeDetail(pipelineNode)
          }, pipelineNode.batchSummary.name),
          pipelineNode.nodeType === 'PIPELINE' && <a href="#nodeinfo" style={{ userSelect: 'auto'}>{onClick: (}</a> => onShowNodeDetail(pipelineNode)
          }, pipelineNode.pipeline.name)
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
                <input type="checkbox" className="form-check-input" name={nodeName} value="EXCLUDE" checked={pipelineNode.testScope.entries.EXCLUDE === 'Y'} onChange={onChangeNodeTestScope} />,
                'EXCLUDE'
              )
            )
          )
        )
      );
    });

    return React.createElement('table', { className: 'table table-striped table-fixed' },
      React.createElement('thead', null,
        React.createElement('tr', null,
          React.createElement('th', { style: { width: '10%', paddingLeft: '10px' } }, 'Node Type'),
          React.createElement('th', { style: { width: '60%', paddingLeft: '25px' } }, 'Node Name'),
          React.createElement('th', { style: { width: '10%', paddingLeft: '25px' } }, 'Action'),
          React.createElement('th', { style: { width: '20%', paddingLeft: '25px' } }, 'Check To Exclude')
        )
      ),
      <tbody>{...rows}</tbody>
    );
  }, [onShowNodeDetail, onDeleteNode, onChangeNodeTestScope]);

  const pipelineNodeTable = renderNodeTable(input);

  return React.createElement('div', null,
    saveWarning && <Alert type={saveWarning.type} text={saveWarning.text} />,
    React.createElement('div', { className: 'row no-gutters' },
      React.createElement('div', { className: 'col-lg-8 pr-lg-2' },
        React.createElement('form', { className: 'my-2' },
          React.createElement('fieldset', { disabled },
            React.createElement('section', null,
              React.createElement('div', { className: 'card mb-3 shadow bg-white rounded' },
                React.createElement('div', { className: 'card-header' },
                  React.createElement('h5', { className: 'mb-0' }, 'Profile Info')
                ),
                React.createElement('div', { className: 'card-body bg-light' },
                  React.createElement('div', { className: 'form-row' },
                    React.createElement('div', { className: 'col-12' },
                      React.createElement('div', { className: 'form-group' },
                        React.createElement('label', { htmlFor: 'pipeline-name' }, 'Profile Name'),
                        <input id="pipeline-name" className="form-control" type="text" value={input.name} onChange={event => onChangePipelineProperty('name'} event) />
                      )
                    ),
                    React.createElement('div', { className: 'col-12' },
                      React.createElement('div', { className: 'form-group' },
                        React.createElement('label', { htmlFor: 'event-description' }, 'Description'),
                        <textarea className="form-control" id="event-description" name="description" rows="6" value={input.description || ''} onChange={event => onChangePipelineProperty('description'} event) />
                      )
                    )
                  )
                )
              ),
              React.createElement('div', { className: 'card mb-3 shadow bg-white rounded' },
                React.createElement('div', { className: 'card-header' },
                  React.createElement('h5', { className: 'mb-0' }, 'Selected Nodes')
                ),
                React.createElement('div', { className: 'card-body bg-light' },
                  React.createElement('div', { className: 'mb-3' },
                    React.createElement('div', { className: 'row' },
                      React.createElement('div', { className: 'col-8' },
                        <ProfilePipelineNodeBlock onChange={onInputNodeName} />
                      ),
                      React.createElement('div', { className: 'col-2' },
                        React.createElement('button', {
                          className: 'btn btn-primary btn-light-primary',
                          type: 'button',
                          onClick: onChangePipelineNodes
                        },
                          <i className="fa fa-fw fa-plus" />,
                          ' Add'
                        )
                      )
                    )
                  ),
                  pipelineNodeTable
                )
              )
            ),
            React.createElement('div', { className: 'form-group' },
              React.createElement('button', {
                className: 'btn btn-primary mr-2',
                type: 'button',
                onClick: onSaveHandler
              }, 'Save'),
              <button className="btn btn-secondary" type="button" onClick={onCancelHandler}>Cancel and Go Back</button>
            )
          )
        )
      )
    )
  );
};

export default ProfilePipelineForm;