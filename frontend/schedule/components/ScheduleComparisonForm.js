import React, { useState, useEffect, useCallback } from 'react';
import { sortCaseInsensitive } from '../../utils/utilities';

import ErrorAlert from '../../components/ErrorAlert';
import LoadingIndicator from '../../components/LoadingIndicator';
import { withCurrentUser } from '../../components/currentUser';
import Forest from '../../components/Forest';
import getScheduleDetailInfo from './ScheduleReleaseDetailForm';
import Alert from '../../components/Alert';
import ParametersTable from '../../components/ParametersTable';

function extractForest(scheduleComparisons) {
  if (!scheduleComparisons || !scheduleComparisons.compareEntities
    || scheduleComparisons.compareEntities.length === 0) {
    return [];
  }

  const forest = [
    { name: 'create', parentName: '' }, 
    { name: 'update', parentName: '' }, 
    { name: 'delete', parentName: '' }
  ];
  
  scheduleComparisons.compareEntities.forEach(entity => {
    const item = {
      name: `${entity.jobName}@${entity.schedule}`,
      parentName: entity.action,
    };
    forest.push(item);
  });
  return forest;
}

function checkAbleToCreatePackage(scheduleComparisons) {
  if (!scheduleComparisons || !scheduleComparisons.compareEntities
    || scheduleComparisons.compareEntities.length === 0) {
    return true;
  }

  let canCreate = true;
  scheduleComparisons.compareEntities.forEach(itemEntity => {
    if (itemEntity.action === 'create' && itemEntity.existsRef) {
      canCreate = false;
    }
    if (itemEntity.action === 'update' && !itemEntity.existsRef) {
      canCreate = false;
    }
    if (itemEntity.action === 'delete' && !itemEntity.existsRef) {
      canCreate = false;
    }
  });
  return canCreate;
}

const ScheduleComparisonForm = ({ scheduleComparisons, onCreateRelease }) => {
  const [itemDetail, setItemDetail] = useState(null);
  const [comparisonData, setComparisonData] = useState(scheduleComparisons);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(() => {
    setItemDetail(null);
    setComparisonData(scheduleComparisons);
  }, [scheduleComparisons]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onClickItem = useCallback((releaseJobName) => {
    const [jobName, schedule] = releaseJobName.name.split('@');
    const foundItemDetail = comparisonData.compareEntities.find(
      (comparison) => comparison.jobName === jobName && comparison.schedule === schedule,
    );
    setItemDetail(foundItemDetail);
  }, [comparisonData]);

  if (comparisonData === null) {
    return <LoadingIndicator />;
  }
  if (comparisonData instanceof Error) {
    return <ErrorAlert error={comparisonData} />;
  }

  const forest = extractForest(comparisonData);

  let itemEntity = itemDetail;
  if (!itemEntity) {
    itemEntity = comparisonData.compareEntities[0];
  }
  
  const scheduleReleaseDetails = getScheduleDetailInfo(itemEntity.scheduleReleaseDetails);
  const canCreate = checkAbleToCreatePackage(comparisonData);

  let alertType = 'primary';
  let updateError = '';
  if (!itemEntity.existsRef) {
    if (itemEntity.action === 'update') {
      updateError = ', can not update!';
      alertType = 'danger';
    }
  }
  
  const scheduleDetails = itemEntity.existsRef
    ? getScheduleDetailInfo(itemEntity.scheduleDetails)
    : React.createElement(Alert, { 
        text: `Not exist in target environment${updateError}`, 
        type: alertType 
      });

  let warning = null;
  if (itemEntity.action === 'create' && itemEntity.existsRef) {
    warning = <Alert text="Existing data in target environment, cannot create!" type="danger" />;
  }
  if (itemEntity.action === 'delete' && !itemEntity.existsRef) {
    warning = <Alert text="Not exists data in target environment, cannot delete!" type="danger" />;
  }

  let updateItems = null;
  if (itemEntity.action === 'update' && itemEntity.compareItems
    && itemEntity.compareItems.length > 0) {
    updateItems = sortCaseInsensitive(itemEntity.compareItems, item => item.itemName)
      .map((item) => {
        if (item.itemName === 'overrideParameters') {
          return React.createElement('tr', { 
            key: item.itemName, 
            className: `${item.diff && 'table-warning'}` 
          },
            <td>{item.itemName}</td>,
            <td>{item.tar && <ParametersTable parameters={item.tar} />}</td>,
            <td>{item.ref && <ParametersTable parameters={item.ref} />}</td>
          );
        }
        return React.createElement('tr', { 
          key: item.itemName, 
          className: `${item.diff && 'table-warning'}` 
        },
          <td>{item.itemName}</td>,
          <td>{String(item.tar}</td>),
          <td>{String(item.ref}</td>)
        );
      });
  }

  return React.createElement('div', null,
    React.createElement('h2', { className: 'display-4' }, 'Release Comparison'),
    React.createElement('div', { className: 'row' },
      React.createElement('div', { className: 'col-3' },
        <Forest forest={forest} onClickItem={onClickItem} expanded />
      ),
      React.createElement('div', { className: 'col-9' },
        React.createElement('section', null,
          updateItems && React.createElement('table', { className: 'table table-striped table-fixed my-0' },
            React.createElement('thead', null,
              React.createElement('tr', null,
                React.createElement('th', { className: 'col-2' }, 'Field Name'),
                <th className="col-5">Release Value</th>,
                <th className="col-5">Ref Value</th>
              )
            ),
            <tbody>{...updateItems}</tbody>
          ),
          React.createElement('div', { className: 'row' },
            React.createElement('div', { className: 'col-6' },
              React.createElement('h2', { className: 'display-5' }, 'Release Details')
            ),
            React.createElement('div', { className: 'col-6' },
              React.createElement('h2', { className: 'display-5' }, 'Prod Information')
            )
          ),
          React.createElement('div', { className: 'row' },
            React.createElement('div', { className: 'col-6' },
              React.createElement(Alert, { 
                text: `Action: ${itemEntity.action}`, 
                type: 'primary' 
              })
            ),
            <div className="col-6">{warning}</div>
          ),
          React.createElement('div', { className: 'row' },
            React.createElement('div', { className: 'col-6' }, scheduleReleaseDetails),
            <div className="col-6">{!(itemEntity.action === 'delete' && !itemEntity.existsRef}</div> && scheduleDetails
            )
          )
        )
      )
    ),
    React.createElement('div', { className: 'form-group pull-right' },
      React.createElement('ul', { className: 'list-inline' },
        !canCreate && <Alert text="Unexpected release item found, please check!" type="danger" />
      ),
      React.createElement('ul', { className: 'list-inline' },
        React.createElement('li', { className: 'list-inline-item' },
          React.createElement('button', {
            className: 'btn btn-primary',
            type: 'button',
            disabled: !canCreate,
            'data-dismiss': 'modal',
            onClick: () => onCreateRelease()
          },
            isSubmitting && <i className="fa fa-spin fa-spinner mr-1" />,
            'Confirm Create'
          )
        ),
        React.createElement('li', { className: 'list-inline-item' },
          React.createElement('button', {
            className: 'btn btn-default',
            type: 'button',
            'data-dismiss': 'modal'
          }, 'Cancel')
        )
      )
    )
  );
};

export default withCurrentUser(ScheduleComparisonForm);