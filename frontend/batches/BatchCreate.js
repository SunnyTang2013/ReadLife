import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

import batchService from '../backend/batchService';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';

import BatchDetailForm from './components/BatchDetailForm';


const BatchCreate = () => {
  const [batchDetail, setBatchDetail] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const { fromBatchId } = useParams();
  const navigate = useNavigate();

  const onSave = useCallback((batch) => {
    setIsSaving(true);
    batchService.createBatch(batch)
      .then((batchDetail) => {
        navigate(`/detail/${batchDetail.id}`, { replace: true });
      })
      .catch((error) => {
        setIsSaving(false);
        setSaveError(error);
      });
  }, [navigate]);

  const onCancel = useCallback(() => {
    navigate('/list');
  }, [navigate]);

  const loadBatch = useCallback(() => {
    if (!fromBatchId) {
      setBatchDetail({
        id: null,
        name: '',
        useStaticJobList: false,
        jobPlainInfos: [],
        notContainInJobName: '',
        overriddenParameters: {
          entries: {},
        },
        configGroupVariables: {
          entries: {},
        },
        adGroups: [],
        rodParameters: {
          entries: {},
        },
      });
      setIsSaving(false);
      setSaveError(null);
      return;
    }

    batchService.getBatchDetail(fromBatchId)
      .then((fromBatch) => {
        setBatchDetail(Object.assign({}, fromBatch, {
          id: null,
          owner: null,
          createTime: null,
        }));
        setIsSaving(false);
        setSaveError(null);
      })
      .catch((error) => {
        setBatchDetail(error);
        setIsSaving(false);
        setSaveError(null);
      });
  }, [fromBatchId]);

  useEffect(() => {
    loadBatch();
  }, [loadBatch]);

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
          <li className="breadcrumb-item active">New Batch</li>
        </ol>
      </nav>
      <h2 className="display-4">Create a New Batch</h2>
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

export default BatchCreate;