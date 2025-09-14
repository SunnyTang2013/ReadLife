import React from 'react';
import ParametersTable from '../../components/ParametersTable';

/**
 * This component renders a table showing a list of job config groups.
 */
const ReportConfigGroupItems = ({ releaseItems }) => {
  const compareRows = releaseItems.map((item, i) => (
    <div className="col-lg-4 mb-3" key={item.name}>
      <div className="card border-info mb-3">
        <div className="card-header">{item.name}</div>
        <div className="d-flex align-items-center">
          <table className="table table-borderless mb-2 table-fixed">
            <tbody>
              <tr>
                <th>Description</th>
                <td>{item.description}</td>
              </tr>
              <tr>
                <th>Category</th>
                <td>{item.category}</td>
              </tr>
              <tr>
                <th>Author</th>
                <td>{item.author}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ul className="list-group list-group-flush" id={`Parameters${i}`}>
          <button
            className="btn btn-link"
            type="button"
            data-toggle="collapse"
            data-target={`#collapse${i}`}
            aria-expanded="false"
            aria-controls={`collapse${i}`}
          >
            Parameters
          </button>
        </ul>
        <div id={`collapse${i}`} className="collapse">
          <div className="d-flex align-items-center">
            <ParametersTable parameters={item.parameters} />
          </div>
        </div>
      </div>
    </div>
  ));

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

export default ReportConfigGroupItems;