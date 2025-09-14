import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import pipelineService from '../backend/pipelineService';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';

import PipelineNoticeForm from './components/PipelineNoticeForm';

const PipelineNoticeEdit = () => {
  const [runNotice, setRunNotice] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const navigate = useNavigate();
  const { pipelineName, pipelineId } = useParams();

  useEffect(() => {
    _loadPipeline();
  }, [pipelineId]);

  function onSave(runNotice) {
    setIsSaving(true);
    pipelineService.editNotice(runNotice)
      .then(() => {
        navigate(`/notice/${pipelineName}/${pipelineId}`, { replace: true });
      })
      .catch((error) => {
        setIsSaving(false);
        setSaveError(error);
      });
  }

  function onCancel() {
    navigate('/list');
  }

  function _loadPipeline() {
    pipelineService.getNoticeDetail(pipelineId)
      .then((runNotice) => {
        if (runNotice.id) {
          setRunNotice(runNotice);
        } else {
          setRunNotice({
            id: null,
            typeName: pipelineName,
            typeId: pipelineId,
            enableJenkins: false,
            refType: 'PIPELINE',
            callJenkinsParameters: {
              entries: {},
            },
            enableSymphony: false,
            symphonyRoom: '',
          });
        }
      })
      .catch(error => setRunNotice(error));
  }

  if (runNotice === null) {
    return <LoadingIndicator />;
  }
  
  if (runNotice instanceof Error) {
    return <ErrorAlert error={runNotice} />;
  }

  return React.createElement('div', { style: { maxWidth: '85%' }, className: 'container-fluid' },
    React.createElement('nav', null,
      React.createElement('ol', { className: 'breadcrumb' },
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: `/notice/${pipelineName}/${pipelineId}` }, pipelineName)
        )
      )
    ),
    <h2 className="display-4">Create a New Notice</h2>,
    <ErrorAlert error={saveError} />,
    <PipelineNoticeForm runNotice={runNotice} onSave={onSave} onCancel={onCancel} disabled={isSaving} />
  );
};

export default PipelineNoticeEdit;