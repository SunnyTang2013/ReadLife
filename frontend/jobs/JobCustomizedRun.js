import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { cloneDeep } from 'lodash';

import jobExecution from '../backend/jobExecution';
import RouterPropTypes from '../proptypes/router';
import { slugify, sortCaseInsensitive } from '../utils/utilities';

import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';
import AutoGrowTextarea from '../components/AutoGrowTextarea';
import { withCurrentUser } from '../components/currentUser';

const flattenParameters = (groupedParameters) => {
  const flattened = { entries: {} };
  Object.values(groupedParameters.groups).forEach((item) => {
    flattened.entries = Object.assign(flattened.entries, item.entries);
  });
  return flattened;
};

const extractCustomizedParameters = (userParameters, defaultParameters) => {
  const flattenedUserParameters = flattenParameters(userParameters);
  const flattenedDefaultParameters = flattenParameters(defaultParameters);
  const customized = { entries: {} };
  Object.keys(flattenedUserParameters.entries).forEach((name) => {
    const userValue = flattenedUserParameters.entries[name];
    const defaultValue = flattenedDefaultParameters.entries[name];
    if (userValue !== defaultValue) {
      customized.entries[name] = userValue;
    }
  });
  return customized;
};

const getAllParams = (jobRequest) => {
  return { groups: { ...jobRequest.functionalParameters.groups,
    ...jobRequest.technicalParameters.groups } };
};

const JobCustomizedRun = () => {
  const [jobRequest, setJobRequest] = useState(null);
  const [parameters, setParameters] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [techGroups, setTechGroups] = useState([]);

  const navigate = useNavigate();
  const { jobId } = useParams();

  useEffect(() => {
    _prepareJobRequest();
  }, [jobId]);

  const onChangeParameter = (groupName, event) => {
    const name = event.target.name;
    const value = event.target.value.replace(/[\n\r]/g, ' '); // Strip off possible line breaks.
    setParameters((prevParameters) => {
      const newParameters = cloneDeep(prevParameters);
      newParameters.groups[groupName].entries[name] = value;
      return newParameters;
    });
  };

  const onSubmit = (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    const originalParameters = getAllParams(jobRequest);
    const customizedParameters = extractCustomizedParameters(
      parameters, originalParameters,
    );
    console.log(`About to submit job request for job #${jobId}...`);
    jobExecution.createCustomizedJobRequest(jobId, customizedParameters)
      .then(savedJobRequest => jobExecution.submitJobRequest(savedJobRequest.id))
      .then(submittedJobRequest => navigate(`/job-request-submitted/${submittedJobRequest.id}`))
      .catch((error) => {
        setIsSubmitting(false);
        setSubmitError(error);
      });
  };

  const onCancel = () => {
    navigate(`/job/detail/${jobId}`, { replace: true });
  };

  const _prepareJobRequest = () => {
    console.log(`Preparing job request for job #${jobId}...`);
    jobExecution.prepareJobRequest(jobId)
      .then((jobRequest) => {
        setTechGroups(jobRequest.technicalParameters.groups);
        setJobRequest(jobRequest);
        setParameters(cloneDeep(getAllParams(jobRequest)));
        setIsSubmitting(false);
        setSubmitError(null);
      })
      .catch((error) => {
        setJobRequest(error);
        setParameters(null);
        setIsSubmitting(false);
        setSubmitError(null);
      });
  };

  const _renderConfigGroup = (groupName, entries) => {
    const parameterNames = sortCaseInsensitive(Object.keys(entries));
    const $rows = parameterNames.map(name => (
      <tr key={`entry-${groupName}-${name}`}>
        <th className="align-middle" style={{ width: '25%' }}>{name}</th>
        <td>
          <AutoGrowTextarea
            className="form-control"
            name={name}
            value={entries[name]}
            onChange={event => onChangeParameter(groupName, event)}
          />
        </td>
      </tr>
    ));
    const startHidden = groupName in techGroups ? 'hide' : 'show';
    return (
      <div key={groupName} className="card my-2">
        <div className="card-header">
          <h6 className="mb-0">
            <a data-toggle="collapse" href={`#config-group-${slugify(groupName)}`}>
              {groupName}
            </a>
          </h6>
        </div>
        <div id={`config-group-${slugify(groupName)}`} className={`collapse ${startHidden}`}>
          <table className="mb-0 table table-fixed">
            <tbody>{$rows}</tbody>
          </table>
        </div>
      </div>
    );
  };

  if (jobRequest === null) {
    return <LoadingIndicator />;
  }
  if (jobRequest instanceof Error) {
    return <ErrorAlert error={jobRequest} />;
  }

  const $configGroups = Object.keys(parameters.groups).map((groupName) => {
    const entries = parameters.groups[groupName].entries;
    const $configGroup = _renderConfigGroup(groupName, entries);
    return <div key={`group-${groupName}`}>{$configGroup}</div>;
  });

  return (
    <div>
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to={`/job/detail/${jobRequest.jobId}`}>{`Job #${jobRequest.jobId}`}</Link>
          </li>
          <li className="breadcrumb-item active">Customized Run</li>
        </ol>
      </nav>
      <h2 className="display-4">{jobRequest.name}</h2>
      <div className="alert alert-primary">
        <h4 className="alert-heading">
          <i className="fa fa-fw fa-cog" />
          {' Customized Run'}
        </h4>
        <div className="my-1">This page allows you to customize some of the job parameters before submitting the job.</div>
        <div className="my-1">
          Please review and modify as necessary the parameters below, then click the {' '}
          <strong>Submit</strong>
          {' button at the bottom of this page.'}
        </div>
      </div>
      <ErrorAlert error={submitError} />
      <form onSubmit={onSubmit}>
        <fieldset disabled={isSubmitting}>
          <section>
            <h3 className="display-6">Parameters</h3>
            {$configGroups}
          </section>
          <div className="form-group">
            <ul className="list-inline">
              <li className="list-inline-item">
                <button className="btn btn-primary" type="submit">
                  Submit
                </button>
              </li>
              <li className="list-inline-item">
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={onCancel}
                >
                  Cancel
                </button>
              </li>
            </ul>
          </div>
        </fieldset>
      </form>
    </div>
  );
};

export default withCurrentUser(JobCustomizedRun);