import React from 'react';

/**
 * This component renders a table showing a list of new items.
 */
const NewItemsReport = ({ compareReport }) => {
  let $dataList = null;
  if (compareReport.newItemNames.length > 0) {
    const $compareRows = compareReport.newItemNames.map(
      (name) => <li key={name} className="list-group-item">{name}</li>
    );
    $dataList = (
      <div className="card border-success mb-3">
        <div className="align-items-center">
          <ul className="list-group list-group-flush">
            {$compareRows}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="card shadow mb-3">
      <div className="card-body">
        <h4 className="card-title">New</h4>
        <h6 className="card-subtitle mb-2 text-muted">{`Total ${compareReport.addNewItems}`}</h6>
      </div>
      <div className="row">
        <div className="col-lg-6">{$dataList}</div>
      </div>
    </div>
  );
};

export default NewItemsReport;