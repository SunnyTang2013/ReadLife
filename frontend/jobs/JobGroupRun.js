import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

import jobGroupService from '../backend/jobGroupService';
import jobExecution from '../backend/jobExecution';
import RemoteObject from '../utils/RemoteObject';

import Alert from '../components/Alert';
import LoadingIndicator from '../components/LoadingIndicator';

const JobGroupRun = () => {
  const { jobGroupId } = useParams();
  const [jobGroup, setJobGroup] = useState(RemoteObject.notLoaded());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [simpleResult, setSimpleResult] = useState(null);

  useEffect(() => {
    loadJobGroup();
  }, [jobGroupId]);

  const onConfirm = () => {
    setIsSubmitting(true);
    jobExecution.submitJobGroup(jobGroupId).then((simpleResult) => {
      console.log(`Received result: [${simpleResult.status}] ${simpleResult.message}`);
      setIsSubmitting(false);
      setSimpleResult(simpleResult);
    });
  };

  const loadJobGroup = () => {
    console.log(`Loading job group info by ID: ${jobGroupId}`);
    jobGroupService.getJobGroup(jobGroupId)
      .then((data) => {
        setJobGroup(RemoteObject.loaded(data));
        setIsSubmitting(false);
        setSimpleResult(null);
      })
      .catch((error) => {
        setJobGroup(RemoteObject.failed(error));
        setIsSubmitting(false);
        setSimpleResult(null);
      });
  };

  if (jobGroup.isNotLoaded()) {
    return <LoadingIndicator />;
  }
  if (jobGroup.isFailed()) {
    return <Alert type={"danger"} text={jobGroup.error} />;
  }

  let $content = null;
  if (simpleResult) {
    let alertType = null;
    switch (simpleResult.status) {
      case 'SUCCESS':
        alertType = 'success';
        break;
      case 'ERROR':
        alertType = 'danger';
        break;
      default:
        alertType = 'warning';
        break;
    }
    $content = (
      <div>
        <section>
          <Alert type={alertType} text={simpleResult.message} />
        </section>
        <section>
          <Link 
            to={`/job/list/${jobGroup.data.id}`}
            className="btn btn-outline-secondary"
          >
            {`Return to ${jobGroup.data.name}`}
          </Link>
        </section>
      </div>
    );
  } else {
    $content = (
      <div>
        <section>
          <Alert type="primary" text="Are you sure to run all jobs in this job group?" />
        </section>
        <section>
          <button
            className="btn btn-primary mr-2"
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting && <i className="fa fa-spin fa-spinner mr-2" />}
            Yes. Run all jobs!
          </button>
          <Link 
            to={`/job/list/${jobGroup.data.id}`}
            className="btn btn-secondary"
          >
            No.
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div>
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to={`/job/list/${jobGroup.data.id}`}>
              {`Job Group: ${jobGroup.data.name}`}
            </Link>
          </li>
          <li className="breadcrumb-item active">Run All Jobs</li>
        </ol>
      </nav>
      <h2 className="display-4">Run All Jobs</h2>
      {$content}
    </div>
  );
};

export default JobGroupRun;