import React from 'react';
import ParametersTable from '../../components/ParametersTable';

/**
 * This component renders a table showing a list of job config groups.
 */
const ReportBatchItems = ({ releaseItems }) => {
  const compareRows = releaseItems.map((item, i) => {
    let jobs = null;
    if (item.jobs) {
      jobs = item.jobs.map(job =>
        <li className="list-group-item" key={job.naturalKey}>{job.naturalKey}</li>
      );
    }
    
    return (
      <div className="col-lg-4 mb-3" key={item.name}>
        <div className="card border-info mb-3">
          <div className="card-header">{item.name}</div>
          <div className="d-flex align-items-center">
            <table className="table table-borderless mb-2 table-fixed">
              <tbody>
                {item.description && (
                  <tr>
                    <th>Description</th>
                    <td>{item.description}</td>
                  </tr>
                )}
                {item.batchType && (
                  <tr>
                    <th>Batch Type</th>
                    <td>{item.batchType}</td>
                  </tr>
                )}
                {item.typeId && (
                  <tr>
                    <th>Type Id</th>
                    <td>{item.typeId}</td>
                  </tr>
                )}
                {item.categoryName && (
                  <tr>
                    <th>Category Name</th>
                    <td>{item.categoryName}</td>
                  </tr>
                )}
                {item.entity && (
                  <tr>
                    <th>Entity</th>
                    <td>{item.entity}</td>
                  </tr>
                )}
                {item.useStaticJobList && (
                  <tr>
                    <th>Static List</th>
                    <td>{String(item.useStaticJobList)}</td>
                  </tr>
                )}
                {item.containInJobName && (
                  <tr>
                    <th>Contain In Job Name</th>
                    <td>{item.containInJobName}</td>
                  </tr>
                )}
                {item.notContainInJobName && (
                  <tr>
                    <th>Not Contain In Job Name</th>
                    <td>{item.notContainInJobName}</td>
                  </tr>
                )}
                <tr>
                  <th>Jobs</th>
                  <td>
                    <ul className="list-group list-group-flush">
                      {jobs || []}
                    </ul>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <ul className="list-group list-group-flush" id={`overrideParameters${i}`}>
            <button
              className="btn btn-link"
              type="button"
              data-toggle="collapse"
              data-target={`#collapseOverride${i}`}
              aria-expanded="false"
              aria-controls={`collapseOverride${i}`}
            >
              overrideParameters
            </button>
          </ul>
          <div id={`collapseOverride${i}`} className="collapse">
            <div className="d-flex align-items-center">
              <ParametersTable parameters={item.overrideParameters} />
            </div>
          </div>
          <ul className="list-group list-group-flush" id={`rodParameters${i}`}>
            <button
              className="btn btn-link"
              type="button"
              data-toggle="collapse"
              data-target={`#collapseRod${i}`}
              aria-expanded="false"
              aria-controls={`collapseRod${i}`}
            >
              rodParameters
            </button>
          </ul>
          <div id={`collapseRod${i}`} className="collapse">
            <div className="d-flex align-items-center">
              <ParametersTable parameters={item.rodParameters} />
            </div>
          </div>
          <ul className="list-group list-group-flush" id={`configGroupVariables${i}`}>
            <button
              className="btn btn-link"
              type="button"
              data-toggle="collapse"
              data-target={`#collapseConfig${i}`}
              aria-expanded="false"
              aria-controls={`collapseConfig${i}`}
            >
              configGroupVariables
            </button>
          </ul>
          <div id={`collapseConfig${i}`} className="collapse">
            <div className="d-flex align-items-center">
              <ParametersTable parameters={item.configGroupVariables} />
            </div>
          </div>
        </div>
      </div>
    );
  });

  return (
    <div className="card shadow" id="accordion">
      <div className="card-body">
        <h4 className="card-title">All</h4>
        <h6 className="card-subtitle mb-2 text-muted">{`Total ${releaseItems.length}`}</h6>
      </div>
      <div className="row">{compareRows}</div>
    </div>
  );
};

export default ReportBatchItems;