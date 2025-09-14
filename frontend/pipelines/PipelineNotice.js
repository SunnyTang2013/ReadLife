import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Toggle from 'react-toggle';

import pipelineService from '../backend/pipelineService';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';

import DeleteModal from '../components/DeleteModal';
import ParametersTable from '../components/ParametersTable';

const PipelineNotice = () => {
  const [runNotice, setRunNotice] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const navigate = useNavigate();
  const { pipelineName, pipelineId } = useParams();

  useEffect(() => {
    _loadNoticeDetail();
  }, [pipelineId]);

  function onOpenDeleteModal() {
    setOpenModal(true);
  }

  function onOffJenkins(event) {
    const enableJenkins = event.target.checked;
    const updatedRunNotice = Object.assign({}, runNotice, { enableJenkins });
    if (!updatedRunNotice.id) {
      return;
    }
    pipelineService.editNotice(updatedRunNotice)
      .then((savedRunNotice) => {
        setRunNotice(savedRunNotice);
      })
      .catch(() => {
        setRunNotice(updatedRunNotice);
      });
  }

  function onOffSymphony(event) {
    const enableSymphony = event.target.checked;
    const updatedRunNotice = Object.assign({}, runNotice, { enableSymphony });
    if (!updatedRunNotice.id) {
      return;
    }
    pipelineService.editNotice(updatedRunNotice)
      .then((savedRunNotice) => {
        setRunNotice(savedRunNotice);
      })
      .catch(() => {
        setRunNotice(updatedRunNotice);
      });
  }

  function onDelete() {
    if (runNotice.id) {
      pipelineService.deleteNotice(runNotice.id)
        .then(() => {
          setOpenModal(false);
          onCompleteDeletion();
        })
        .catch((error) => {
          setOpenModal(false);
          setRunNotice(error);
        });
    } else {
      setOpenModal(false);
    }
  }

  function onCompleteDeletion() {
    setOpenModal(false);
    toast.success(`Notice #${pipelineName} is deleted successfully.`);
    navigate(`/detail/${pipelineId}`);
  }

  function onCancel() {
    setOpenModal(false);
  }

  function _loadNoticeDetail() {
    pipelineService.getNoticeDetail(pipelineId)
      .then((runNotice) => {
        if (runNotice.id) {
          setRunNotice(runNotice);
        } else {
          setRunNotice({
            id: null,
            typeName: pipelineName,
            enableJenkins: false,
            callJenkinsParameters: {
              entries: {},
            },
            enableSymphony: false,
            symphonyRoom: '',
          });
        }
      })
      .catch(error => setRunNotice(error));
  }

  function _deleteModal() {
    if (openModal) {
      return <DeleteModal name="Notice" title="Notice" openModal={openModal} onDelete={onDelete} onClose={onCancel} />;
    }

    return null;
  }

  if (runNotice === null) {
    return <LoadingIndicator />;
  }
  
  if (runNotice instanceof Error) {
    return <ErrorAlert error={runNotice} />;
  }

  const $deleteModal = _deleteModal();

  return React.createElement('div', { style: { maxWidth: '85%' }, className: 'container-fluid' },
    React.createElement('nav', null,
      React.createElement('ol', { className: 'breadcrumb' },
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: `/detail/${pipelineId}` }, pipelineName)
        )
      )
    ),

    React.createElement('div', { className: 'd-flex justify-content-between' },
      React.createElement('div', { className: 'mb-2' },
        React.createElement(Link, {
          to: `/updateNotice/${pipelineName}/${pipelineId}`,
          className: 'btn btn-sm btn-primary btn-light-primary mr-2'
        },
          <i className="fa fa-fw fa-pencil" />, ' Edit'
        ),
        <button className="btn btn-sm btn-danger mr-3" type="button" onClick={onOpenDeleteModal}>{<i className="fa fa-fw fa-trash" />, ' Delete'}</button>
      )
    ),

    React.createElement('section', null,
      React.createElement('div', { className: 'row' },
        React.createElement('div', { className: 'col-6' },
          React.createElement('div', { className: 'card mb-3 mb-lg-0 shadow bg-white rounded' },
            React.createElement('div', { className: 'card-header' },
              React.createElement('div', { className: 'd-flex justify-content-between' },
                React.createElement('div', { className: 'mb-2' },
                  React.createElement('h5', { className: 'mb-0' }, 'Jenkins')
                ),
                <div className="mb-2">{<Toggle id="cheese-status" checked={runNotice.enableJenkins} onChange={onOffJenkins} />}</div>
              )
            ),
            React.createElement('div', { className: 'card-body bg-light' },
              React.createElement('div', { className: 'form-group' },
                <ParametersTable parameters={runNotice.callJenkinsParameters} />
              )
            )
          )
        ),

        React.createElement('div', { className: 'col-6' },
          React.createElement('div', { className: 'card mb-3 mb-lg-3 shadow bg-white rounded' },
            React.createElement('div', { className: 'card-header' },
              React.createElement('div', { className: 'd-flex justify-content-between' },
                React.createElement('div', { className: 'mb-2' },
                  React.createElement('h5', { className: 'mb-0' }, 'Symphony')
                ),
                <div className="mb-2">{<Toggle id="cheese-status" checked={runNotice.enableSymphony} onChange={onOffSymphony} />}</div>
              )
            ),
            React.createElement('div', { className: 'card-body bg-light' },
              React.createElement('p', { style: { whiteSpace: 'pre-line' } }, runNotice.symphonyRoom)
            )
          )
        )
      )
    ),

    $deleteModal
  );
};

export default PipelineNotice;