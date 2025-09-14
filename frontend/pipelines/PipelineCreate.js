import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import pipelineService from '../backend/pipelineService';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';

import PipelineForm from './components/PipelineForm';

const PipelineCreate = () => {
  const [pipeline, setPipeline] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const navigate = useNavigate();
  const { fromPipelineId } = useParams();

  useEffect(() => {
    _loadPipeline();
  }, [fromPipelineId]);

  function onSave(pipeline) {
    setIsSaving(true);
    pipelineService.createPipeline(pipeline)
      .then((nodeDetail) => {
        navigate(`/detail/${nodeDetail.id}`, { replace: true });
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
    if (!fromPipelineId) {
      setPipeline({
        id: null,
        name: '',
        description: '',
        pipelineNodeSummaries: [],
        overriddenParameters: {
          entries: {},
        },
        testScope: {
          entries: {},
        },
      });
      setIsSaving(false);
      setSaveError(null);
      return;
    }

    pipelineService.getPipelineDetail(fromPipelineId)
      .then((fromPipeline) => {
        setPipeline(Object.assign({}, fromPipeline, {
          id: null,
          description: '',
          createTime: null,
          updateTime: null,
        }));
        setIsSaving(false);
        setSaveError(null);
      })
      .catch((error) => {
        setPipeline(error);
        setIsSaving(false);
        setSaveError(null);
      });
  }

  if (pipeline === null) {
    return <LoadingIndicator />;
  }
  
  if (pipeline instanceof Error) {
    return <ErrorAlert error={pipeline} />;
  }

  return (
    <div style={{ maxWidth: '85%' }} className="container-fluid">
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/list">Pipelines</Link>
          </li>
          <li className="breadcrumb-item active">New Pipeline</li>
        </ol>
      </nav>
      <h2 className="display-4">Create a New Pipeline</h2>
      <ErrorAlert error={saveError} />
      <PipelineForm pipeline={pipeline} onSave={onSave} onCancel={onCancel} disabled={isSaving} />
    </div>
  );
};

export default PipelineCreate;