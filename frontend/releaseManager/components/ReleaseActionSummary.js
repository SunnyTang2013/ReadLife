import React, { useState, useEffect, useCallback } from 'react';
import ErrorAlert from '../../components/ErrorAlert';
import { sortCaseInsensitiveDesc } from '../../utils/utilities';
import ReleaseStatics from './ReleaseStatics';

const ReleaseActionSummary = ({ 
  releaseItems, 
  onUpdateItems, 
  onCompare, 
  onAnalyze, 
  packageName = null 
}) => {
  const [sortedReleaseItems, setSortedReleaseItems] = useState(
    sortCaseInsensitiveDesc(releaseItems, item => item.type)
  );

  const onDeleteItem = useCallback((index) => {
    const newReleaseItems = [...sortedReleaseItems];
    newReleaseItems.splice(index, 1);
    setSortedReleaseItems(newReleaseItems);
    onUpdateItems(newReleaseItems);
  }, [sortedReleaseItems, onUpdateItems]);

  const updateReleaseItems = useCallback((items) => {
    const sortedItems = sortCaseInsensitiveDesc(items, item => item.type);
    setSortedReleaseItems(sortedItems);
  }, []);

  useEffect(() => {
    updateReleaseItems(releaseItems);
    if (packageName) {
      sessionStorage.setItem(packageName, JSON.stringify(releaseItems));
    }
  }, [releaseItems, updateReleaseItems, packageName]);

  let jobRows = null;
  if (sortedReleaseItems instanceof Error) {
    jobRows = (
      <tr>
        <td colSpan="6">
          <ErrorAlert error={sortedReleaseItems} />
        </td>
      </tr>
    );
  } else if (sortedReleaseItems.length === 0) {
    jobRows = (
      <tr>
        <td colSpan="6">Waiting to add...</td>
      </tr>
    );
  } else {
    jobRows = sortedReleaseItems.map((item, index) => {
      const rowKey = index + 1;
      const rowName = ReleaseStatics.rowName(item);
      const type = item.type === ReleaseStatics.JOB_GROUP ? 'Hierarchy' : item.type;
      
      return (
        <tr key={`parameter-${rowKey}`}>
          <td>{` ${type} `}</td>
          <td>{` ${rowName} `}</td>
          <td>{` ${item.action} `}</td>
          <td>
            <button
              className="anchor text-muted"
              type="button"
              title="Analyze this item"
              onClick={() => onAnalyze(item)}
            >
              <i className="fa fa-fw fa-cogs" />
            </button>
          </td>
          <td>
            {(item.type === ReleaseStatics.JOB || item.type === ReleaseStatics.CONTEXT) && (
              <button 
                className="anchor text-muted" 
                type="button" 
                title="Compare this item" 
                onClick={() => onCompare(item)}
              >
                <i className="fa fa-fw fa-files-o" />
              </button>
            )}
          </td>
          <td>
            {packageName === 'releaseItem' && (
              <button
                className="anchor text-muted"
                type="button"
                title="Delete this item"
                onClick={() => onDeleteItem(index)}
              >
                <i className="fa fa-fw fa-trash" />
              </button>
            )}
          </td>
        </tr>
      );
    });
  }

  return (
    <div>
      <table className="table table-striped table-fixed my-0">
        <thead>
          <tr>
            <th style={{ width: '10%' }}>Type</th>
            <th style={{ width: '50%' }}>Description</th>
            <th style={{ width: '15%' }}>Action</th>
            <th style={{ width: '10%' }}>Analysis</th>
            <th style={{ width: '10%' }}>Compare</th>
            <th style={{ width: '10%' }}></th>
          </tr>
        </thead>
        <tbody>{jobRows}</tbody>
      </table>
    </div>
  );
};

export default ReleaseActionSummary;