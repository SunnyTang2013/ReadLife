import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import releaseService from '../backend/releaseService';
import ErrorAlert from '../components/ErrorAlert';

const ReleaseCreate = () => {
  const [releaseName, setReleaseName] = useState('');
  const [jobGroupBundle, setJobGroupBundle] = useState(null);
  const [verificationErrors, setVerificationErrors] = useState(null);
  const [verificationWarnings, setVerificationWarnings] = useState(null);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const onChangeReleaseName = useCallback((event) => {
    const releaseNameValue = event.target.value;
    setReleaseName(releaseNameValue);
  }, []);

  const onChooseJsonFile = useCallback((event) => {
    const file = event.target.files[0];
    setIsWorking(true);
    
    const fileReader = new FileReader();
    fileReader.onloadend = () => {
      try {
        const jsonContent = String(fileReader.result);
        const parsedJobGroupBundle = JSON.parse(jsonContent);
        setJobGroupBundle(parsedJobGroupBundle);
        setIsWorking(false);
        setError(null);
        // checkWarningForJobGroupBundle(parsedJobGroupBundle);
      } catch (parseError) {
        console.log(`Fail to parse JSON file: ${parseError}`);
        setJobGroupBundle(null);
        setIsWorking(false);
        setError(parseError);
      }
    };
    fileReader.readAsText(file);
  }, []);

  const onReleaseJobGroupBundle = useCallback(() => {
    setIsWorking(true);
    
    releaseService.releaseJobGroupBundle(releaseName, jobGroupBundle)
      .then((release) => {
        toast.success(`Released job group (Release #${release.id}) successfully!`);
        navigate(`/detail/${release.id}`);
      })
      .catch((releaseError) => {
        setIsWorking(false);
        setError(releaseError);
      });
  }, [releaseName, jobGroupBundle, navigate]);

  const onVerifyAndReleaseJobGroupBundle = useCallback(() => {
    setVerificationWarnings(null);
    setIsWorking(true);
    
    releaseService.verifyJobGroupBundle(releaseName, jobGroupBundle)
      .then((verification) => {
        const verificationErrorsResult = verification.errors;
        const verificationWarningsResult = verification.warnings;
        
        if (verificationErrorsResult && verificationErrorsResult.length > 0) {
          setVerificationErrors(verificationErrorsResult);
          setIsWorking(false);
          setError(null);
          throw new Error('Verification of job group bundle failed.');
        }

        if (verificationWarningsResult && verificationWarningsResult.length > 0) {
          setVerificationWarnings(verificationWarningsResult);
          setIsWorking(false);
          setError(null);
        } else {
          // Verification of job group bundle passed. Continue to release.
          onReleaseJobGroupBundle();
        }
      })
      .catch((verifyError) => {
        setIsWorking(false);
        setError(verifyError);
      });
  }, [releaseName, jobGroupBundle, onReleaseJobGroupBundle]);

  const onRestart = useCallback(() => {
    setJobGroupBundle(null);
    setVerificationErrors(null);
    setVerificationWarnings(null);
    setIsWorking(false);
    setError(null);
  }, []);

  const renderFileUploadForm = useCallback(() => {
    return React.createElement('section', null,
      React.createElement('fieldset', { disabled: isWorking },
        React.createElement('ul', { className: 'timeline' },
          React.createElement('li', null,
            <i className="timeline-icon fa fa-fw fa-cubes text-primary" />,
            React.createElement('div', { className: 'timeline-item' },
              React.createElement('h3', { className: 'lighter' }, 'Specify a unique release name'),
              React.createElement('div', { className: 'form-group' },
                React.createElement('input', {
                  className: 'form-control form-control-lg',
                  style: { width: '20rem' },
                  type: 'text',
                  value: releaseName,
                  onChange: onChangeReleaseName
                })
              )
            )
          ),
          React.createElement('li', null,
            <i className="timeline-icon fa fa-fw fa-upload text-primary" />,
            React.createElement('div', { className: 'timeline-item' },
              React.createElement('h3', { className: 'lighter' }, 'Choose the job group bundle JSON file to release'),
              <div className="form-group">{<input className="form-control-file" type="file" accept=".json" disabled={releaseName.trim(}</div> === ''} onChange={onChooseJsonFile} />
              )
            )
          )
        )
      )
    );
  }, [isWorking, releaseName, onChangeReleaseName, onChooseJsonFile]);

  const renderJobGroupBundle = useCallback(() => {
    if (!jobGroupBundle) {
      return React.createElement('div');
    }

    let $configGroups = null;
    if (jobGroupBundle.configGroups.length > 0) {
      const $rows = jobGroupBundle.configGroups.map(configGroup =>
        React.createElement('tr', { key: configGroup.name },
          <td>{configGroup.name}</td>,
          React.createElement('td', { className: 'text-nowrap' }, configGroup.category),
          <td className="text-nowrap">{`${Object.keys(configGroup.parameters.entries}</td>.length} parameters`
          )
        )
      );
      $configGroups = React.createElement('table', { className: 'table table-striped' },
        React.createElement('thead', null,
          React.createElement('tr', null,
            React.createElement('th', { className: 'text-nowrap' }, 'Name'),
            React.createElement('th', { 
              className: 'text-nowrap', 
              style: { width: '15%' } 
            }, 'Category'),
            React.createElement('th', { 
              className: 'text-nowrap', 
              style: { width: '15%' } 
            }, 'Parameters')
          )
        ),
        <tbody>{...$rows}</tbody>
      );
    } else {
      $configGroups = <div className="alert alert-secondary">{<i className="fa fa-fw fa-exclamation-triangle" />,
        ' No config groups to release.'}</div>;
    }

    let $jobs = null;
    if (jobGroupBundle.jobs.length > 0) {
      const $rows = jobGroupBundle.jobs.map(job =>
        React.createElement('tr', { key: job.name },
          React.createElement('td', null,
            job.name,
            React.createElement('span', { className: 'ml-2 badge badge-secondary' }, job.type)
          ),
          <td className="text-nowrap">{job.context.naturalKey}</td>,
          <td className="text-nowrap">{`${job.configGroups.length} config groups`}</td>
        )
      );
      $jobs = React.createElement('table', { className: 'table table-striped' },
        React.createElement('thead', null,
          React.createElement('tr', null,
            React.createElement('th', { className: 'text-nowrap' }, 'Name'),
            React.createElement('th', { 
              className: 'text-nowrap', 
              style: { width: '15%' } 
            }, 'Context'),
            React.createElement('th', { 
              className: 'text-nowrap', 
              style: { width: '15%' } 
            }, 'Config Groups')
          )
        ),
        <tbody>{...$rows}</tbody>
      );
    } else {
      $jobs = <div className="alert alert-secondary">{<i className="fa fa-fw fa-exclamation-triangle" />,
        ' No jobs to release.'}</div>;
    }

    let $nextStep = null;

    if (verificationErrors && verificationErrors.length > 0) {
      // Verification failed: Next step is to restart over.
      const $items = verificationErrors.map(error =>
        <li key={error}>{error}</li>
      );
      $nextStep = React.createElement('div', null,
        React.createElement('div', { className: 'alert alert-danger my-2' },
          React.createElement('h4', { className: 'lighter' },
            <i className="fa fa-fw fa-exclamation-triangle mr-1" />,
            'Verification of job group bundle failed.'
          ),
          <ul>{...$items}</ul>
        ),
        React.createElement('fieldset', { disabled: isWorking },
          React.createElement('div', { className: 'form-group' },
            React.createElement('button', {
              className: 'btn btn-secondary',
              type: 'button',
              onClick: onRestart
            }, 'Please fix the errors and restart.')
          )
        )
      );
    } else if (verificationWarnings && verificationWarnings.length > 0) {
      const $items = verificationWarnings.map(warning =>
        <li key={warning}>{warning}</li>
      );
      $nextStep = React.createElement('div', null,
        React.createElement('div', { className: 'alert alert-warning my-2' },
          React.createElement('h4', { className: 'lighter' },
            <i className="fa fa-fw fa-exclamation-triangle mr-1" />,
            'Verification of job group bundle with warnings.'
          ),
          <ul>{...$items}</ul>,
          <h4 className="lighter">Are you sure you want to go ahead the release?</h4>
        ),
        React.createElement('fieldset', { disabled: isWorking },
          React.createElement('div', { className: 'form-group' },
            React.createElement('button', {
              className: 'btn btn-primary mr-2',
              type: 'button',
              onClick: onReleaseJobGroupBundle
            }, 'Yes, I am sure. Confirm the release.'),
            <button className="btn btn-secondary" type="button" onClick={onRestart}>Restart</button>
          )
        )
      );
    } else {
      // Not yet verified. Next step is verify.
      $nextStep = React.createElement('div', null,
        React.createElement('div', { className: 'alert alert-primary my-2' },
          'Are you sure you want to release job group ',
          <strong>{jobGroupBundle.name}</strong>,
          ' ?'
        ),
        React.createElement('fieldset', { disabled: isWorking },
          React.createElement('div', { className: 'form-group' },
            React.createElement('button', {
              className: 'btn btn-primary mr-2',
              type: 'button',
              onClick: onVerifyAndReleaseJobGroupBundle
            }, 'Yes, I am sure. Verify and release this job group.'),
            <button className="btn btn-secondary" type="button" onClick={onRestart}>Restart</button>
          )
        )
      );
    }

    return React.createElement('div', null,
      React.createElement('section', null,
        React.createElement('div', { className: 'my-2' },
          <i className="fa fa-fw fa-check text-success mr-1" />,
          'Loaded job group ',
          <strong>{jobGroupBundle.name}</strong>,
          ' from JSON file.'
        ),
        React.createElement('div', { className: 'card my-2' },
          React.createElement('div', { className: 'card-header' },
            React.createElement('h6', { className: 'mb-0' },
              React.createElement('a', { href: '#config-groups', 'data-toggle': 'collapse' },
                `${jobGroupBundle.configGroups.length} Config Groups`
              )
            )
          ),
          <div id="config-groups" className="card-body collapse">{$configGroups}</div>
        ),
        React.createElement('div', { className: 'card my-2' },
          React.createElement('div', { className: 'card-header' },
            React.createElement('h6', { className: 'mb-0' },
              React.createElement('a', { href: '#jobs', 'data-toggle': 'collapse' },
                `${jobGroupBundle.jobs.length} Jobs`
              )
            )
          ),
          <div id="jobs" className="card-body collapse">{$jobs}</div>
        )
      ),
      <section>{$nextStep}</section>
    );
  }, [jobGroupBundle, verificationErrors, verificationWarnings, isWorking, onRestart, onReleaseJobGroupBundle, onVerifyAndReleaseJobGroupBundle]);

  let $content = null;
  if (jobGroupBundle === null) {
    $content = renderFileUploadForm();
  } else {
    $content = renderJobGroupBundle();
  }

  return React.createElement('div', null,
    React.createElement('nav', null,
      React.createElement('ol', { className: 'breadcrumb' },
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: '/list' }, 'Releases')
        ),
        <li className="breadcrumb-item active">Create a new release</li>
      )
    ),
    <h2 className="display-4">Release a job group</h2>,
    <ErrorAlert error={error} />,
    $content
  );
};

export default ReleaseCreate;