import React, { useState, useCallback } from 'react';

const MetricFooterDetails = ({ globalMessages, allJobsOrder, distinctPandoraVersions, metricsDetail }) => {
  const [dropDownFlag, setDropDownFlag] = useState({});

  const onCollapse = useCallback((jobID) => {
    setDropDownFlag(prevState => ({
      ...prevState,
      [jobID]: !prevState[jobID]
    }));
  }, []);

  const renderGlobalMessage = useCallback((globalMessagesData) => {
    if (!globalMessagesData || globalMessagesData.length === 0) {
      return (
        <div>
          <h2 className="display-6">Checks Results</h2>
          <div key="glb-msg" className="card">
            <h5>No messages available</h5>
          </div>
        </div>
      );
    }

    // Filter duplicate message as detection is made on each pandoraversion
    const distinctMessages = globalMessagesData.filter((item, idx) => (globalMessagesData.indexOf(item) === idx));
    const messageElements = distinctMessages.map((message, index) =>
      <h5 key={index}>{message}</h5>
    );

    return (
      <div>
        <h2 className="display-6">Checks Results</h2>
        <div key="glb-msg" className="card">{messageElements}</div>
      </div>
    );
  }, []);

  const renderJobPerfDiff = useCallback((jobPerfDiff) => {
    if (!jobPerfDiff) {
      return (
        <div>
          <h2 className="display-6">Difference between TAR and REF job for selected metric and actions:</h2>
          <div key="perf-diff" className="card">
            <h5>No performance difference data available</h5>
          </div>
        </div>
      );
    }

    const perfDiffElements = jobPerfDiff.split('\n').map((str, index) =>
      <h5 key={index}>{str}</h5>
    );

    return (
      <div>
        <h2 className="display-6">Difference between TAR and REF job for selected metric and actions:</h2>
        <div key="perf-diff" className="card">{perfDiffElements}</div>
      </div>
    );
  }, []);

  const renderMetricByJob = useCallback((actionNode) => {
    return (
      <React.Fragment>
        <tr key={actionNode.id}>
          <td>{actionNode.pandoraBuildKey}</td>
          <td>{actionNode.pandoraVersion}</td>
          <td>{actionNode.actionDetails}</td>
          <td>{`${actionNode.actionStartTime}/${actionNode.actionEndTime}`}</td>
          <td>{actionNode.actionElapsedTime}</td>
          <td>{actionNode.actionSeqNb}</td>
        </tr>
      </React.Fragment>
    );
  }, []);

  const renderMetricJobsNodes = useCallback((jobsNodes) => {
    if (!jobsNodes || jobsNodes.length === 0) {
      return <div className="alert alert-info">No job metrics data available</div>;
    }

    // Filter jobnames in this list
    const tempListJobs = jobsNodes.map(item => item.jobname);
    const distinctJobs = tempListJobs.filter((item, idx) => (tempListJobs.indexOf(item) === idx));

    const jobRowElements = distinctJobs.map(distinctItem => {
      const oneJob = jobsNodes.filter(item => item.jobname === distinctItem);
      
      const actionElements = oneJob.map(action => {
        if (dropDownFlag[distinctItem]) {
          return renderMetricByJob(action);
        }
        return null;
      }).filter(element => element !== null);

      // Use jobname and not ref to open same job for all pandoraversion
      const angle = dropDownFlag[distinctItem] ? 'fa-angle-down' : 'fa-angle-right';

      return (
        <React.Fragment key={distinctItem}>
          <tr>
            <td colSpan="6">
              <a
                className="btn btn-link"
                data-toggle="collapse"
                href={`#collapse${distinctItem}`}
                role="button"
                aria-expanded="false"
                aria-controls={`collapse${distinctItem}`}
                onClick={() => onCollapse(distinctItem)}
              >
                <i className={`fa fa-fw ${angle}`} />
                {` ${distinctItem}`}
              </a>
            </td>
          </tr>
          {actionElements}
        </React.Fragment>
      );
    });

    return (
      <div className="table-responsive">
        <table className="table table-striped table-sm">
          <thead>
            <tr>
              <th scope="col">Pandora Build Key</th>
              <th scope="col">Pandora Version</th>
              <th scope="col">Action Details</th>
              <th scope="col">Start/End Time</th>
              <th scope="col">Elapsed Time</th>
              <th scope="col">Seq Nb</th>
            </tr>
          </thead>
          <tbody>{jobRowElements}</tbody>
        </table>
      </div>
    );
  }, [dropDownFlag, onCollapse, renderMetricByJob]);

  const renderMetricLines = useCallback(() => {
    if (!metricsDetail || metricsDetail.length === 0) {
      return <div className="alert alert-info">No metrics data available for display</div>;
    }

    return renderMetricJobsNodes(metricsDetail);
  }, [metricsDetail, renderMetricJobsNodes]);

  const rowList = renderMetricLines();
  const globalMessageWidget = renderGlobalMessage(globalMessages);
  const jobPerfDiffWidget = renderJobPerfDiff(allJobsOrder);

  return (
    <React.Fragment>
      <ul className="nav nav-tabs" role="tablist" id="techs-tab">
        <li className="nav-item" href="#nav-list-tab">
          <a
            className="nav-link active"
            data-toggle="tab"
            href="#jobs-list"
            role="tab"
          >
            Jobs List
          </a>
        </li>
        <li className="nav-item" href="#nav-technical-check">
          <a
            className="nav-link"
            data-toggle="tab"
            href="#technical-check"
            role="tab"
          >
            Technical Checks
          </a>
        </li>
        <li
          className="nav-item"
          id="nav-job-comparaiso"
          href="#nav-job-comparaison"
        >
          <a
            className="nav-link"
            data-toggle="tab"
            href="#job-comparaison"
            role="tab"
          >
            Job Perf Diff
          </a>
        </li>
      </ul>
      <div className="tab-content" id="techs-tab-contents">
        <div
          id="jobs-list"
          className="tab-pane fade show active py-2"
          role="tabpanel"
        >
          {rowList}
        </div>
        <div id="technical-check" className="tab-pane fade py-2" role="tabpanel">
          {globalMessageWidget}
        </div>
        <div id="job-comparaison" className="tab-pane fade py-2" role="tabpanel">
          {jobPerfDiffWidget}
        </div>
      </div>
    </React.Fragment>
  );
};

export default MetricFooterDetails;