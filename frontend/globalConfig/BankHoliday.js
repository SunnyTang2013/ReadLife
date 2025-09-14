import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { cloneDeep } from 'lodash';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import bankHolidayService from '../backend/bankHolidayService';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';
import { formatTime } from '../utils/utilities';

const BankHoliday = () => {
  const [input, setInput] = useState({
    name: '', startDate: '', endDate: '', marketDate: '', entityType: 'JobGroupHierarchy',
  });
  const [bankHolidayList, setBankHolidayList] = useState([]);
  const [selectedBankHolidayList, setSelectedBankHolidayList] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [itemForUpdate, setItemForUpdate] = useState({
    name: '', startDate: '', endDate: '', marketDate: '', entityType: 'JobGroupHierarchy',
  });
  const [itemForDel, setItemForDel] = useState({
    name: '', startDate: '', endDate: '', marketDate: '', entityType: 'JobGroupHierarchy',
  });
  const [batchValues, setBatchValues] = useState({ startDate: '', endDate: '', marketDate: '' });

  useEffect(() => {
    document.title = 'Bank Holiday Control';
    loadBankHolidays();
  }, []);

  function onSave() {
    setIsSaving(true);
    const inputCopy = Object.assign({}, input);
    bankHolidayService.addBankHoliday(inputCopy)
      .then(() => {
        setSaveError(null);
        loadBankHolidays();
      })
      .catch((error) => {
        setIsSaving(false);
        setSaveError(error);
      });
  }

  function onEdit() {
    setIsSaving(true);
    const itemForUpdateCopy = Object.assign({}, itemForUpdate);
    bankHolidayService.addBankHoliday(itemForUpdateCopy)
      .then(() => {
        setSaveError(null);
        loadBankHolidays();
      })
      .catch((error) => {
        setIsSaving(false);
        setSaveError(error);
      });
  }

  function onDelBankHoliday() {
    setIsSaving(true);
    const itemForDelCopy = Object.assign({}, itemForDel);
    bankHolidayService.delBankHoliday(itemForDelCopy.id)
      .then(() => {
        setSaveError(null);
        loadBankHolidays();
      })
      .catch((error) => {
        setIsSaving(false);
        setSaveError(error);
      });
  }

  function onChangeProperty(name, event) {
    const value = event.target.value;
    setInput((prevState) => {
      const inputCopy = cloneDeep(prevState);
      inputCopy[name] = value;
      return inputCopy;
    });
  }

  function loadBankHolidays() {
    console.log('Loading bank holidays...');
    bankHolidayService.getBankHolidayList()
      .then((bankHolidayList) => {
        setBankHolidayList(bankHolidayList);
        setIsSaving(false);
      })
      .catch((error) => {
        setSaveError(error);
        setIsSaving(false);
      });
  }

  function renderBankHolidayList() {
    if (!bankHolidayList || bankHolidayList.length === 0) {
      return <div className="alert alert-warning">No bank holidays found.</div>;
    }

    const $rows = bankHolidayList.map(bankHoliday => 
      React.createElement('tr', { key: bankHoliday.id },
        React.createElement('td', null,
          <input type="checkbox" checked={selectedBankHolidayList.includes(bankHoliday)} onChange={() => onSelectBankHoliday(bankHoliday)} />
        ),
        <td>{bankHoliday.name}</td>,
        <td>{formatTime(bankHoliday.startDate}</td>),
        <td>{formatTime(bankHoliday.endDate}</td>),
        <td>{formatTime(bankHoliday.marketDate}</td>),
        <td>{bankHoliday.entityType}</td>,
        React.createElement('td', null,
          React.createElement('button', {
            className: 'btn btn-sm btn-primary mr-2',
            onClick: () => editBankHoliday(bankHoliday)
          }, 'Edit'),
          <button className="btn btn-sm btn-danger" onClick={() => addDel(bankHoliday)}>Delete</button>
        )
      )
    );

    return React.createElement('table', { className: 'table table-striped' },
      React.createElement('thead', null,
        React.createElement('tr', null,
          <th>Select</th>,
          <th>Name</th>,
          <th>Start Date</th>,
          <th>End Date</th>,
          <th>Market Date</th>,
          <th>Entity Type</th>,
          <th>Actions</th>
        )
      ),
      <tbody>{...$rows}</tbody>
    );
  }

  function onSelectBankHoliday(bankHoliday) {
    const isSelected = selectedBankHolidayList.includes(bankHoliday);
    if (isSelected) {
      setSelectedBankHolidayList(selectedBankHolidayList.filter(item => item !== bankHoliday));
    } else {
      setSelectedBankHolidayList([...selectedBankHolidayList, bankHoliday]);
    }
  }

  function editBankHoliday(bankHoliday) {
    setItemForUpdate(bankHoliday);
  }

  function addDel(bankHoliday) {
    setItemForDel(bankHoliday);
  }

  if (isSaving) {
    return <LoadingIndicator />;
  }

  return React.createElement('div', null,
    React.createElement('nav', null,
      React.createElement('ol', { className: 'breadcrumb' },
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: '/' }, 'Global Configurations')
        ),
        <li className="breadcrumb-item active">Bank Holiday</li>
      )
    ),
    <h2 className="display-4">Bank Holiday Management</h2>,
    <ErrorAlert error={saveError} />,
    React.createElement('div', { className: 'row' },
      React.createElement('div', { className: 'col-4' },
        React.createElement('h3', { className: 'display-6' }, 'Add Bank Holiday'),
        React.createElement('form', null,
          React.createElement('div', { className: 'form-group' },
            <label>Name</label>,
            <input className="form-control" type="text" value={input.name} onChange={event => onChangeProperty('name'} event) />
          ),
          React.createElement('div', { className: 'form-group' },
            <label>Entity Type</label>,
            React.createElement('select', {
              className: 'form-control',
              value: input.entityType,
              onChange: event => onChangeProperty('entityType', event)
            },
              <option value="JobGroupHierarchy">JobGroupHierarchy</option>,
              <option value="Other">Other</option>
            )
          ),
          <button type="button" className="btn btn-primary" onClick={onSave}>Add Bank Holiday</button>
        )
      ),
      React.createElement('div', { className: 'col-8' },
        React.createElement('h3', { className: 'display-6' }, 'Bank Holiday List'),
        renderBankHolidayList()
      )
    )
  );
};

export default BankHoliday;