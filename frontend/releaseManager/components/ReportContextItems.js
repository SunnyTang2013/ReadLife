import React from 'react';

/**
 * This component renders a table showing a list of job config groups.
 */
const ReportContextItems = ({ releaseItems }) => {
  const compareRows = releaseItems.map((item) => {
    let configGroups = null;
    if (item.configGroups) {
      configGroups = item.configGroups.map(configName =>
        <li className="list-group-item" key={configName}>{configName}</li>
      );
    }
    
    return (
      <div className="col-lg-4 mb-3" key={item.name}>
        <div className="card border-info mb-3">
          <div className="card-header">{item.name}</div>
          <div className="d-flex align-items-center">
            <table className="table table-borderless mb-2 table-fixed">
              <tbody>
                <tr>
                  <th>Execution System</th>
                  <td>{item.executionSystem}</td>
                </tr>
                <tr>
                  <th>ConfigGroups</th>
                  <td>
                    <ul className="list-group list-group-flush">
                      {configGroups || []}
                    </ul>
                  </td>
                </tr>
              </tbody>
            </table>
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

export default ReportContextItems;