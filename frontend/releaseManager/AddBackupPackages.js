import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { cloneDeep } from 'lodash';
import releaseService from '../backend/releaseService';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';

const AddBackupPackages = () => {
  const [input, setInput] = useState({ seq: '', packageVersion: '', description: '' });
  const [packageList, setPackageList] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [packageForUpdate, setPackageForUpdate] = useState({ seq: '', packageVersion: '', description: '' });
  const [packageForDel, setPackageForDel] = useState({ seq: '', packageVersion: '', description: '' });
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = useCallback(() => {
    releaseService.listBackupPackages()
      .then((packageList) => {
        setPackageList(packageList);
        setIsSaving(false);
        setSaveError(null);
      })
      .catch((error) => {
        setPackageList(error);
        setIsSaving(false);
        setSaveError(null);
      });
  }, []);

  const onSave = useCallback(() => {
    setIsSaving(true);
    const inputCopy = Object.assign({}, input);
    releaseService.backupPackage(inputCopy)
      .then((packageList) => {
        setPackageList(packageList);
        setIsSaving(false);
        setSaveError(null);
      })
      .catch((error) => {
        setIsSaving(false);
        setSaveError(error);
      });
  }, [input]);

  const onEdit = useCallback(() => {
    setIsSaving(true);
    const packageForUpdateCopy = Object.assign({}, packageForUpdate);
    releaseService.backupPackage(packageForUpdateCopy)
      .then((packageList) => {
        setPackageList(packageList);
        setIsSaving(false);
        setSaveError(null);
      })
      .catch((error) => {
        setIsSaving(false);
        setSaveError(error);
      });
  }, [packageForUpdate]);

  const onDelBackup = useCallback(() => {
    setIsSaving(true);
    const packageForDelCopy = Object.assign({}, packageForDel);
    releaseService.delBackupPackage(packageForDelCopy)
      .then((packageList) => {
        setPackageList(packageList);
        setIsSaving(false);
        setSaveError(null);
      })
      .catch((error) => {
        setIsSaving(false);
        setSaveError(error);
      });
  }, [packageForDel]);

  const onChangeProperty = useCallback((name, event) => {
    const value = event.target.value;
    setInput(prevState => {
      const inputCopy = cloneDeep(prevState);
      inputCopy[name] = value;
      return inputCopy;
    });
  }, []);

  const onChangeBackup = useCallback((name, event) => {
    const value = event.target.value;
    setPackageForUpdate(prevState => {
      const packageForUpdateCopy = cloneDeep(prevState);
      packageForUpdateCopy[name] = value;
      return packageForUpdateCopy;
    });
  }, []);

  const editBackup = useCallback((packageForUpdate) => {
    setPackageForUpdate(packageForUpdate);
  }, []);

  const addDel = useCallback((packageForDel) => {
    setPackageForDel(packageForDel);
  }, []);

  let $rows = null;
  if (isSaving) {
    $rows = React.createElement('tr', null,
      React.createElement('td', { className: 'text-nowrap' },
        <LoadingIndicator />
      )
    );
  } else if (error) {
    $rows = React.createElement('tr', null,
      React.createElement('td', { className: 'text-nowrap' },
        <ErrorAlert error={error} />
      )
    );
  } else if (!packageList || packageList.length === 0) {
    $rows = React.createElement('tr', null,
      React.createElement('td', { className: 'text-nowrap' }, 'No data found ...'),
      <td className="text-nowrap" />,
      <td className="text-nowrap" />,
      <td className="text-nowrap" />
    );
  } else {
    $rows = (packageList || []).map(packageBackup => 
      React.createElement('tr', { key: packageBackup.seq },
        React.createElement('td', { className: 'text-nowrap' }, packageBackup.seq),
        React.createElement('td', { className: 'text-nowrap' },
          React.createElement(Link, { to: `/package-detail/${packageBackup.packageVersion}` },
            <i className="pointer fa fa-fw fa-th text-muted mr-1" />,
            packageBackup.packageVersion
          )
        ),
        <td className="text-nowrap">{packageBackup.description}</td>,
        <td className="text-nowrap">{packageBackup.owner}</td>,
        <td className="text-nowrap">{packageBackup.createTime}</td>,
        React.createElement('td', { className: 'text-nowrap' },
          React.createElement('button', {
            type: 'button',
            className: 'btn btn-outline-primary btn-sm',
            'data-toggle': 'modal',
            'data-target': '#editModal',
            onClick: () => editBackup(packageBackup)
          }, 'Edit'),
          <button type="button" className="btn btn-outline-danger btn-sm" 'data-toggle'="modal" 'data-target'="#delModal" onClick={() => addDel(packageBackup)}>Del</button>
        )
      )
    );
  }

  return React.createElement('div', { className: 'container-fluid', style: { maxWidth: '85%' } },
    React.createElement('nav', null,
      React.createElement('ol', { className: 'breadcrumb' },
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: '/list' }, 'Release Package List')
        ),
        <li className="breadcrumb-item active">Release Backup List</li>
      )
    ),
    <h2 className="display-4">Release Package Backup</h2>,
    <ErrorAlert error={saveError} />,
    React.createElement('form', { className: 'my-2' },
      React.createElement('fieldset', { disabled: isSaving },
        React.createElement('section', { className: 'mb-3' },
          React.createElement('h3', { className: 'display-6' }, 'Add new'),
          React.createElement('div', { className: 'row' },
            React.createElement('div', { className: 'form-group col-2' },
              React.createElement('label', { htmlFor: 'batch-detail-name' }, 'Seq'),
              <div>{<input id="package-seq" className="form-control" type="text" value={input.seq || ''} onChange={event => onChangeProperty('seq'} event}</div> />
              )
            ),
            React.createElement('div', { className: 'form-group col-5' },
              React.createElement('label', { htmlFor: 'batch-detail-entity' }, 'Package Version'),
              <div>{<input id="package-version" className="form-control" type="text" value={input.packageVersion || ''} onChange={event => onChangeProperty('packageVersion'} event}</div> />
              )
            ),
            React.createElement('div', { className: 'form-group col-5' },
              React.createElement('label', { htmlFor: 'batch-detail-entity' }, 'Backup Description'),
              <div>{<input id="package-description" className="form-control" type="text" value={input.description || ''} onChange={event => onChangeProperty('description'} event}</div> />
              )
            )
          )
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('ul', { className: 'list-inline' },
            React.createElement('li', { className: 'list-inline-item' },
              React.createElement('button', {
                className: 'btn btn-primary',
                type: 'button',
                onClick: onSave
              }, 'Save')
            )
          )
        )
      )
    ),
    // Edit Modal
    React.createElement('div', {
      className: 'modal fade',
      id: 'editModal',
      tabIndex: '-1',
      role: 'dialog',
      'aria-labelledby': 'editModalLabel',
      'aria-hidden': 'true'
    },
      React.createElement('div', { className: 'modal-dialog modal-dialog-centered' },
        React.createElement('div', { className: 'modal-content' },
          React.createElement('div', { className: 'modal-header' },
            React.createElement('h4', { className: 'modal-title', id: 'editModalLabel' }, 'Update Backup'),
            React.createElement('button', {
              type: 'button',
              className: 'close',
              'data-dismiss': 'modal',
              'aria-label': 'Close'
            },
              React.createElement('span', { 'aria-hidden': 'true' }, '×')
            )
          ),
          React.createElement('div', { className: 'modal-body' },
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', {
                className: 'col-form-label col-form-label-sm',
                htmlFor: 'inputSmall'
              }, 'Seq'),
              <input className="form-control form-control-sm" type="text" value={packageForUpdate.seq || ''} onChange={event => onChangeBackup('seq'} event) />
            ),
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', {
                className: 'col-form-label col-form-label-sm',
                htmlFor: 'inputSmall'
              }, 'Package Version'),
              <input className="form-control form-control-sm" type="text" value={packageForUpdate.packageVersion || ''} onChange={event => onChangeBackup('packageVersion'} event) />
            ),
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', {
                className: 'col-form-label col-form-label-sm',
                htmlFor: 'inputSmall'
              }, 'Backup Description'),
              <input className="form-control form-control-sm" type="text" value={packageForUpdate.description || ''} onChange={event => onChangeBackup('description'} event) />
            )
          ),
          React.createElement('div', { className: 'modal-footer' },
            React.createElement('button', {
              type: 'button',
              className: 'btn btn-secondary',
              'data-dismiss': 'modal'
            }, 'Close'),
            <button type="button" className="btn btn-primary" onClick={onEdit}>Save changes</button>
          )
        )
      )
    ),
    // Delete Modal
    React.createElement('div', {
      className: 'modal fade',
      id: 'delModal',
      tabIndex: '-1',
      role: 'dialog',
      'aria-labelledby': 'delModalLabel',
      'aria-hidden': 'true'
    },
      React.createElement('div', { className: 'modal-dialog modal-dialog-centered' },
        React.createElement('div', { className: 'modal-content' },
          React.createElement('div', { className: 'modal-header' },
            React.createElement('h4', { className: 'modal-title', id: 'delModalLabel' }, 'Update Backup'),
            React.createElement('button', {
              type: 'button',
              className: 'close',
              'data-dismiss': 'modal',
              'aria-label': 'Close'
            },
              React.createElement('span', { 'aria-hidden': 'true' }, '×')
            )
          ),
          <div className="modal-body">{`Delete ${packageForDel.packageVersion} ?`}</div>,
          React.createElement('div', { className: 'modal-footer' },
            React.createElement('button', {
              type: 'button',
              className: 'btn btn-secondary',
              'data-dismiss': 'modal'
            }, 'Close'),
            <button type="button" className="btn btn-danger" onClick={onDelBackup}>Delete</button>
          )
        )
      )
    ),
    React.createElement('section', null,
      React.createElement('table', { className: 'table table-striped' },
        React.createElement('thead', null,
          React.createElement('tr', null,
            React.createElement('th', { className: 'text-nowrap' }, 'Release Seq'),
            <th className="text-nowrap">Package Name</th>,
            <th className="text-nowrap">Package description</th>,
            <th className="text-nowrap">Backup Owner</th>,
            <th className="text-nowrap">Create Time</th>,
            <th className="text-nowrap">Modify</th>
          )
        ),
        <tbody>{$rows}</tbody>
      )
    )
  );
};

export default AddBackupPackages;