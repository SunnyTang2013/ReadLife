import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cloneDeep } from 'lodash';
import jobExecution from '../backend/jobExecution';
import Alert from '../components/Alert';
import ErrorAlert from '../components/ErrorAlert';
import { withCurrentUser } from '../components/currentUser';

function getDefaultParams() {
  return {
    entries: { jobIds: null, batchName: null },
  };
}

const JobListRun = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [jobListRunParams, setJobListRunParams] = useState(cloneDeep(location.parameters));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batchRequest, setBatchRequest] = useState(null);

  function onGoBackToJobList() {
    navigate(-1);
  }

  function onConfirm() {
    setIsSubmitting(true);
    const params = getDefaultParams();
    params.entries.jobIds = jobListRunParams.entries.jobIds.join();
    params.entries.batchName = jobListRunParams.entries.batchName;
    jobExecution.submitJobs(params).then((batchRequest) => {
      setIsSubmitting(false);
      setBatchRequest(batchRequest);
    }).catch((error) => { setBatchRequest(error); });
  }

  if (!jobListRunParams
    || !jobListRunParams.entries
    || !jobListRunParams.entries.jobIds
    || jobListRunParams.entries.jobIds.length < 1) {
    const errorAlert = new Error('no job is selected to run. please select the job first.');
    return <ErrorAlert error={errorAlert} />;
  }

  if (batchRequest instanceof Error) {
    return <ErrorAlert error={batchRequest} />;
  }

  let $content = null;
  if (batchRequest) {
    let alertType = null;
    if (batchRequest.id) {
      alertType = 'success';
    } else {
      alertType = 'danger';
    }

    $content = (
      <div>
        <section>
          <Alert 
            type={alertType}
            text={`Created and submitted batch job requests with UUID:${batchRequest.uuid}`}
          />
        </section>
        <section>
          <button
            className="btn btn-primary mr-2"
            type="button"
            title="return"
            onClick={onGoBackToJobList}
          >
            Return
          </button>
          <a
            className="btn btn-secondary"
            href={`/frontend/monitoring/batch-request/detail/${batchRequest.id}`}
          >
            View batch Request Detail
          </a>
        </section>
      </div>
    );
  } else {
    $content = (
      <div>
        <div className="my-2">
          {`${jobListRunParams.entries.jobIds.length} jobs will be submitted!`}
        </div>
        <section>
          <Alert type="primary" text="Are you sure to run all selected jobs?" />
        </section>
        <section>
          <button
            className="btn btn-primary mr-2"
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting && <i className="fa fa-spin fa-spinner mr-2" />}
            Yes. Run selected jobs!
          </button>
          <button 
            className="btn btn-secondary" 
            type="button" 
            title="return" 
            onClick={onGoBackToJobList}
          >
            {' No.'}
          </button>
        </section>
      </div>
    );
  }

  return (
    <div>
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item active">Run Selected Jobs</li>
        </ol>
      </nav>
      <h2 className="display-4">Run Selected Jobs</h2>
      {$content}
    </div>
  );
};

export default withCurrentUser(JobListRun);