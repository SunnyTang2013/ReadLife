import React, { useState, useCallback } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';

import ErrorAlert from '../components/ErrorAlert';
import ReleaseGroupForm from './components/ReleaseGroupForm';
import Alert from '../components/Alert';
import releaseService from '../backend/releaseService';

const CreatePackage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  
  const packageName = params.packageName || 'releaseItem';
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [resultInfo, setResultInfo] = useState(null);
  const [packageVersion, setPackageVersion] = useState(null);
  const [currentPackageName, setCurrentPackageName] = useState(packageName);
  const [CRToolUrl, setCRToolUrl] = useState(null);
  const [jiraKey, setJiraKey] = useState(null);

  const onSave = useCallback((releaseJobs) => {
    setIsSaving(true);
    setResultInfo(null);
    
    releaseService.createReleasePackage(jiraKey, releaseJobs)
      .then((result) => {
        if (result.status === 'SUCCESS') {
          localStorage.removeItem('releaseItem');
          setIsSaving(false);
          setSaveError(null);
          setResultInfo({
            status: 'success',
            info: `Create package successfully ! Package version is ${result.data.result['maven2.version']}. Jira ${result.data.result.jiraKey} created/updated.`,
          });
          setPackageVersion(result.data.result.version);
          setCRToolUrl(result.data.result.CRToolUrl);
        } else {
          setIsSaving(false);
          setSaveError(null);
          setResultInfo({
            status: 'danger',
            info: `Create package fail ! Result message is ${result.message}.`,
          });
        }
      })
      .catch((error) => {
        setIsSaving(false);
        setSaveError(error);
        setResultInfo(null);
      });
  }, [jiraKey]);

  const onCancel = useCallback(() => {
    navigate('/job-config-group/list');
  }, [navigate]);

  const onAnalyze = useCallback((item) => {
    if (!isSaving) {
      navigate('/analysis-package', {
        state: {
          packageName: currentPackageName,
          item: [item],
        },
      });
    }
  }, [navigate, isSaving, currentPackageName]);

  const onCompare = useCallback((item) => {
    if (!isSaving) {
      navigate('/compare-items', {
        state: {
          packageName: currentPackageName,
          item: [item],
        },
      });
    }
  }, [navigate, isSaving, currentPackageName]);

  const onClone = useCallback((packageName) => {
    setCurrentPackageName(packageName);
    navigate('/create-package');
  }, [navigate]);

  const handleSetJiraKey = useCallback((key) => {
    setJiraKey(key);
  }, []);

  function renderResultInfo() {
    console.log(packageVersion);
    console.log(jiraKey);
    if (!resultInfo) {
      return null;
    }
    if (resultInfo.status === 'success') {
      return (
        <div className="alert alert-success my-2">
          <i className="fa fa-fw fa-check-circle-o mr-1" />
          <span className="mr-3">{resultInfo.info}</span>
          <a target="_blank" rel="noopener noreferrer" href={CRToolUrl}>
            <i className="fa fa-fw fa-hand-o-right" />
            {' Create CR'}
          </a>
        </div>
      );
    }
    return <Alert type={resultInfo.status} text={resultInfo.info} />;
  }

  const title = currentPackageName === 'releaseItem' ? 'Create Package For Release' : 'Package Detail';
  const $resultInfo = renderResultInfo();

  return (
    <div>
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/list">Release Manager</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/list-package">Package List</Link>
          </li>
          <li className="breadcrumb-item active">Create Package</li>
        </ol>
      </nav>
      <h2 className="display-4">{title}</h2>
      <div className="row">
        <div className="col-3">
          <a
            className="nav-link"
            target="_blank"
            rel="noopener noreferrer"
            href="https://confluence.hk.hsbc/display/FIITQ/How+to+use+Release+Manager"
          >
            <i className="fa fa-fw fa-question-circle" />
            {' How To Use Release Manager'}
          </a>
        </div>
        <div className="col-3">
          <a
            className="nav-link"
            target="_blank"
            rel="noopener noreferrer"
            href="https://gbmt-confluence.prd.fx.gbm.cloud.uk.hsbc/display/FIITQ/Release+Manager+Control+On+Job+Context+And+Release+Environment"
          >
            <i className="fa fa-fw fa-question-circle" />
            {' New change for context release'}
          </a>
        </div>
        <div className="col-6" />
      </div>
      <ErrorAlert error={saveError} />
      {$resultInfo}
      <ReleaseGroupForm
        onSave={onSave}
        onCancel={onCancel}
        onClone={onClone}
        onAnalyze={onAnalyze}
        onCompare={onCompare}
        isSaving={isSaving}
        packageName={currentPackageName}
        jiraKey={handleSetJiraKey}
        resultInfo={resultInfo}
      />
    </div>
  );
};

export default CreatePackage;