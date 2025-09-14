import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';

import batchService from '../backend/batchService';
import BatchDetailForm from './components/BatchDetailForm';


const BatchDetailUpdate = () => {
  const [batchDetail, setBatchDetail] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const { batchId } = useParams();
  const navigate = useNavigate();

  const loadBatchDetail = useCallback(() => {
    batchService.getBatchDetail(batchId)
      .then((batchDetail) => {
        setBatchDetail(batchDetail);
        setIsSaving(false);
        setSaveError(null);
      })
      .catch((error) => {
        setBatchDetail(error);
        setIsSaving(false);
        setSaveError(null);
      });
  }, [batchId]);

  useEffect(() => {
    loadBatchDetail();
  }, [loadBatchDetail]);

  const onSave = useCallback((batchDetail) => {
    setIsSaving(true);
    batchService.updateBatch(batchDetail)
      .then(() => {
        toast.success('Batch is updated successfully.');
        navigate(`/detail/${batchDetail.id}`, { replace: true });
      })
      .catch((error) => {
        setIsSaving(false);
        setSaveError(error);
      });
  }, [navigate]);

  const onCancel = useCallback(() => {
    navigate(`/detail/${batchId}`, { replace: true });
  }, [navigate, batchId]);

  if (batchDetail === null) {
    return <LoadingIndicator />;
  }
  if (batchDetail instanceof Error) {
    return <ErrorAlert error={batchDetail} />;
  }

  return (
    <div className="container-fluid" style={{ maxWidth: '85%' }}>
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/list">Batch List</Link>
          </li>
          <li className="breadcrumb-item active">{batchDetail.name}</li>
        </ol>
      </nav>
      <h2 className="display-4">Update: {batchDetail.name}</h2>
      <ErrorAlert error={saveError} />
      <BatchDetailForm
        batchDetail={batchDetail}
        onSave={onSave}
        onCancel={onCancel}
        disabled={isSaving}
      />
    </div>
  );
};

export default BatchDetailUpdate;