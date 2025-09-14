import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Link, useParams, useNavigate } from 'react-router-dom';

import { cloneDeep, isEqual } from 'lodash';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';
import { withCurrentUser } from '../components/currentUser';
import AutoGrowTextarea from '../components/AutoGrowTextarea';
import batchService from '../backend/batchService';

/**
 * Compares user-provided parameters and default parameters, extracts and returns parameters that
 * have been customized / changed by user.
 */
function extractCustomizedParameters(userParameters, defaultParameters) {
  const customized = { entries: {} };
  Object.keys(defaultParameters).forEach((key) => {
    const userValue = userParameters[key];
    const defaultValue = defaultParameters[key];
    if (userValue !== defaultValue) {
      customized.entries[key] = userValue;
    }
  });
  return customized;
}

function getAllParams(batchDetail) {
  return { overriddenParameters: batchDetail.overriddenParameters };
}

const BatchCustomizedRun = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  
  const [batchDetail, setBatchDetail] = useState(null);
  const [parameters, setParameters] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const onChangeParameter = useCallback((event) => {
    const name = event.target.name;
    const value = event.target.value.replace(/[\n\r]/g, ' '); // Strip off possible line breaks.
    setParameters((prevParameters) => {
      const newParameters = cloneDeep(prevParameters);
      newParameters[name] = value;
      return newParameters;
    });
  }, []);

  const onSubmit = useCallback((event) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    const originalParameters = getAllParams(batchDetail).overriddenParameters.entries;
    const customizedParameters = extractCustomizedParameters(
      parameters, originalParameters,
    );
    console.log(`About to submit batch request for batch #${batchId}...`);
    batchService.customizeBatch(batchId, customizedParameters)
      .then((batchRequest) => {
        navigate(`/batch-request-submitted/${batchRequest.id}`);
      })
      .catch((error) => {
        toast.error(`Failed to submit batch: ${error}`);
        setIsSubmitting(false);
      });
  }, [batchDetail, parameters, batchId, navigate]);

  const onCancel = useCallback(() => {
    navigate(`/detail/${batchId}`, { replace: true });
  }, [batchId, navigate]);

  const prepareBatch = useCallback(() => {
    console.log(`Preparing batch request for batch #${batchId}...`);
    batchService.getBatchDetail(batchId)
      .then((batchDetailResult) => {
        const overriddenParameters = batchDetailResult.overriddenParameters.entries;
        setBatchDetail(batchDetailResult);
        setParameters(overriddenParameters);
        setIsSubmitting(false);
        setSubmitError(null);
      })
      .catch((error) => {
        setBatchDetail(error);
        setParameters(null);
        setIsSubmitting(false);
        setSubmitError(null);
      });
  }, [batchId]);

  const clearAndLoadBatch = useCallback(() => {
    setBatchDetail(null);
    setParameters(null);
    setIsSubmitting(false);
    setSubmitError(null);
    prepareBatch();
  }, [prepareBatch]);

  useEffect(() => {
    prepareBatch();
  }, [prepareBatch]);

  const renderBatch = (overriddenParameters) => {
    const $rows = Object.keys(overriddenParameters).map(key =>
      <tr key={`entry-${key}`}>
        <th className="align-middle" style={{ width: '25%' }}>{key}</th>
        <td>
          <AutoGrowTextarea
            className="form-control"
            name={key}
            value={overriddenParameters[key]}
            onChange={onChangeParameter}
          />
        </td>
      </tr>
    );
    return (
      <div className="card my-2">
        <div id="batch">
          <table className="mb-0 table table-fixed">
            <tbody>{$rows}</tbody>
          </table>
        </div>
      </div>
    );
  };

  if (batchDetail === null) {
    return <LoadingIndicator />;
  }
  if (batchDetail instanceof Error) {
    return <ErrorAlert error={batchDetail} />;
  }

  const $batchOverriddenParameter = renderBatch(parameters);

  return (
    <div>
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/list">Batch List</Link>
          </li>
          <li className="breadcrumb-item active">Customized Run</li>
        </ol>
      </nav>

      <h2 className="display-4">{batchDetail.name}</h2>

      <div className="alert alert-primary">
        <h4 className="alert-heading">
          <i className="fa fa-fw fa-cog" /> Customized Run
        </h4>
        <div className="my-1">
          This page allows you to customize some of the batch parameters before submitting the batch.
        </div>
        <div className="my-1">
          Please review and modify as necessary the parameters below, then click the{' '}
          <strong>Submit</strong> button at the bottom of this page.
        </div>
      </div>

      <ErrorAlert error={submitError} />

      <form onSubmit={onSubmit}>
        <fieldset disabled={isSubmitting}>
          <section>
            <h3 className="display-6">Parameters</h3>
            {$batchOverriddenParameter}
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

export default withCurrentUser(BatchCustomizedRun);