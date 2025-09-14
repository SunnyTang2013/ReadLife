import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { isEqual } from 'lodash';

import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';

import pipelineService from '../backend/pipelineService';
import PipelineForm from './components/PipelineForm';

const PipelineDetailUpdate = () => {
  const [pipelineDetail, setPipelineDetail] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const navigate = useNavigate();
  const { pipelineId } = useParams();

  useEffect(() => {
    _loadPipelineDetail();
  }, [pipelineId]);

  function onSave(pipelineDetail) {
    setIsSaving(true);
    pipelineService.updatePipeline(pipelineDetail)
      .then(() => {
        toast.success('Pipeline is updated successfully.');
        navigate(`/detail/${pipelineDetail.id}`, { replace: true });
      })
      .catch((error) => {
        setIsSaving(false);
        setSaveError(error);
      });
  }

  function onCancel() {
    navigate(`/detail/${pipelineId}`, { replace: true });
  }

  function _loadPipelineDetail() {
    pipelineService.getPipelineDetail(pipelineId)
      .then((pipelineDetail) => {
        setPipelineDetail(pipelineDetail);
        setIsSaving(false);
        setSaveError(null);
      })
      .catch((error) => {
        setPipelineDetail(error);
        setIsSaving(false);
        setSaveError(null);
      });
  }

  if (pipelineDetail === null) {
    return <LoadingIndicator />;
  }
  
  if (pipelineDetail instanceof Error) {
    return <ErrorAlert error={pipelineDetail} />;
  }

  return (
    <div style={{ maxWidth: '85%' }} className="container-fluid">
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/list">Pipeline List</Link>
          </li>
          <li className="breadcrumb-item active">{pipelineDetail.name}</li>
        </ol>
      </nav>
      <h2 className="display-4">{`Update: ${pipelineDetail.name}`}</h2>
      <ErrorAlert error={saveError} />
      <PipelineForm pipeline={pipelineDetail} onSave={onSave} onCancel={onCancel} disabled={isSaving} />
    </div>
  );
};

export default PipelineDetailUpdate;