import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import globalConfig from '../backend/globalConfig';
import RemoteObject from '../utils/RemoteObject';

import Alert from '../components/Alert';
import LoadingIndicator from '../components/LoadingIndicator';
import { withCurrentUser } from '../components/currentUser';
import DeleteModal from '../components/DeleteModal';

const ExecutionSystemDetail = ({ currentUser }) => {
  const { executionSystemId } = useParams();
  const navigate = useNavigate();
  const [vsDetail, setVsDetail] = useState(RemoteObject.notLoaded());
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    queryVSDetail();
  }, []);

  function onDelete() {
    globalConfig.deleteExecutionSystem(executionSystemId)
      .then(() => {
        setOpenModal(false);
        onCompleteDeletion();
      })
      .catch((error) => {
        setOpenModal(false);
        setVsDetail(RemoteObject.failed(error));
      });
  }

  function onOpenDeleteModal() {
    setOpenModal(true);
  }

  function onCompleteDeletion() {
    setOpenModal(false);
    toast.success(`Execution System #${executionSystemId} is deleted successfully.`);
    navigate('/execution-system/list');
  }

  function onCancel() {
    setOpenModal(false);
  }

  function deleteModal() {
    if (!vsDetail.isLoaded()) return null;
    
    const { executionSystem } = vsDetail.data;

    if (openModal) {
      return <DeleteModal name={executionSystem.name} title="Execution System" openModal={openModal} onDelete={onDelete} onClose={onCancel} />;
    }
    return null;
  }

  function queryVSDetail() {
    console.log(`Querying detail of execution system #${executionSystemId} ...`);
    globalConfig.queryVSDetail(executionSystemId)
      .then((vsDetail) => {
        setVsDetail(RemoteObject.loaded(vsDetail));
      })
      .catch((error) => {
        setVsDetail(RemoteObject.failed(error));
      });
  }

  const canWrite = currentUser.canWrite;

  if (vsDetail.isNotLoaded()) {
    return <LoadingIndicator />;
  }
  if (vsDetail.isFailed()) {
    return <Alert type="danger" text={vsDetail.error} />;
  }

  const { executionSystem, serviceStatus, deployedLibraries, contextCount } = vsDetail.data;
  const $deleteModal = deleteModal();

  const serviceStatusTypes = {
    OKAY: 'success',
    SUBSYSTEM_FAILURE: 'danger',
    UNAVAILABLE: 'danger',
    UNKNOWN: 'warning',
  };
  const serviceStatusType = serviceStatusTypes[serviceStatus.toLocaleUpperCase()] || 'warning';
  const $serviceStatus = React.createElement('span', { className: `badge badge-${serviceStatusType} badge-outline` },
    <i className="fa fa-fw fa-circle" />,
    serviceStatus
  );

  let $deployedLibraries = '';
  if (deployedLibraries) {
    $deployedLibraries = deployedLibraries.map((library) => {
      const $versions = library.versions.map(version => 
        React.createElement('li', { key: `${library.name}-${version}`, className: 'list-inline-item badge badge-secondary' },
          version
        )
      );
      return React.createElement('div', { key: library.name, className: 'my-2' },
        React.createElement('h4', { className: 'lighter' },
          <i className="fa fa-fw fa-cube" />,
          library.name
        ),
        <ul className="list-inline">{...$versions}</ul>
      );
    });
  }

  return React.createElement('div', null,
    React.createElement('nav', null,
      React.createElement('ol', { className: 'breadcrumb' },
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: '/' }, 'Global Configurations')
        ),
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: '/execution-system/list' }, 'Execution Systems')
        ),
        <li className="breadcrumb-item active">{executionSystem.name}</li>
      )
    ),
    <h2 className="display-4">{executionSystem.name}</h2>,
    React.createElement('div', { className: 'btn-toolbar justify-content-between my-2', role: 'toolbar' },
      React.createElement('div', null,
        canWrite && React.createElement('div', null,
          React.createElement('div', { className: 'btn-group btn-group-sm mr-2', role: 'group' },
            React.createElement(Link, { 
              to: `/execution-system/update/${executionSystemId}`, 
              className: 'btn btn-primary btn-light-primary' 
            },
              <i className="fa fa-fw fa-pencil" />,
              ' Update'
            )
          ),
          contextCount === 0 
            ? <button className="btn btn-sm btn-danger mr-2" type="button" onClick={onOpenDeleteModal}>{<i className="fa fa-fw fa-trash" />,
                ' Delete'}</button>
            : <button className="btn btn-sm btn-primary btn-light-primary mr-2" type="button" title="This execution system cannot be deleted because it is currently in use." disabled>{<i className="fa fa-fw fa-trash" />,
                ' Delete'}</button>
        )
      ),
      React.createElement('div', { className: 'btn-group btn-group-sm text-right', role: 'group' },
        React.createElement(Link, {
          to: `/execution-system-history/list/${executionSystem.id}/${executionSystem.name}`,
          className: 'btn btn-primary btn-light-primary'
        },
          <i className="fa fa-fw fa-history" />,
          ' History'
        )
      )
    ),
    React.createElement('section', null,
      React.createElement('h3', { className: 'display-6' }, `Execution System: ${executionSystem.name}`),
      React.createElement('ul', null,
        React.createElement('li', null,
          React.createElement('span', { className: 'mr-2' }, 'Base URL:'),
          React.createElement('a', { 
            className: 'mr-2', 
            href: `${executionSystem.baseUrl}/console`, 
            target: '_blank', 
            rel: 'noreferrer noopener' 
          },
            executionSystem.baseUrl,
            <i className="fa fa-fw fa-external-link ml-1" />
          ),
          $serviceStatus
        ),
        React.createElement('li', null,
          React.createElement('span', { className: 'mr-2' }, 'Max Running Jobs Limitation:'),
          executionSystem.maxRunning
        )
      )
    ),
    React.createElement('section', null,
      React.createElement('h3', { className: 'display-6' }, 'Deployed Libraries'),
      $deployedLibraries
    ),
    $deleteModal
  );
};

export default ExecutionSystemDetail;