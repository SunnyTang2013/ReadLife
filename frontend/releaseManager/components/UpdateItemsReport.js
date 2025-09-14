import React from 'react';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { sortCaseInsensitive } from '../../utils/utilities';

/**
 * This component renders a table showing a list of going to update items.
 */
const UpdateItemsReport = ({ compareReport, env }) => {
  const itemNames = sortCaseInsensitive(Object.keys(compareReport.unMatchItemsMap));
  
  const cards = itemNames.map(name => {
    const item = compareReport.unMatchItemsMap[name];
    
    const rows = item.map((unMatch) => (
      <tr key={`${unMatch.itemName}-${unMatch.releaseValue}-${unMatch.targetInstanceValue}`}>
        <th scope="row" className="col-2">{unMatch.itemName}</th>
        <td colSpan={2}>
          <ReactDiffViewer
            oldValue={(!unMatch.targetInstanceValue || unMatch.targetInstanceValue === 'N/A') ? '' : unMatch.targetInstanceValue}
            newValue={(!unMatch.releaseValue || unMatch.releaseValue === 'N/A') ? '' : unMatch.releaseValue}
            hideLineNumbers={true}
            styles={{
              line: {
                wordBreak: 'break-all',
              },
            }}
          />
        </td>
      </tr>
    ));

    return (
      <div className="col-lg-4" key={name}>
        <div className="card border-warning mb-3">
          <div className="card-header">{name}</div>
          <div className="d-flex align-items-center">
            <table className="table table-borderless mb-2 table-fixed">
              <thead>
                <tr>
                  <th scope="col" className="col-2">Name</th>
                  <th scope="col">{env}</th>
                  <th scope="col">Package</th>
                </tr>
              </thead>
              <tbody>{rows}</tbody>
            </table>
          </div>
        </div>
      </div>
    );
  });

  return (
    <div className="card shadow mb-3">
      <div className="card-body">
        <h4 className="card-title">Update</h4>
        <h6 className="card-subtitle mb-2 text-muted">{`Total ${compareReport.updatedItems}`}</h6>
      </div>
      <div className="row">{cards}</div>
    </div>
  );
};

export default UpdateItemsReport;