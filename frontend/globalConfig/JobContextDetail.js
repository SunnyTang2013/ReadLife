import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import jobContextService from '../backend/jobContextService';
import RemoteObject from '../utils/RemoteObject';

import Alert from '../components/Alert';
import LoadingIndicator from '../components/LoadingIndicator';
import JobConfigGroupsBlock from '../components/JobConfigGroupsBlock';
import { withCurrentUser } from '../components/currentUser';
import DeleteModal from '../components/DeleteModal';

const JobContextDetail = ({ currentUser }) => {
  const { jobContextId } = useParams();
  const navigate = useNavigate();
  const [jobContextDetail, setJobContextDetail] = useState(RemoteObject.notLoaded());
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    loadJobContextDetail();
  }, [jobContextId]);

  function loadJobContextDetail() {
    console.log(`Loading job context #${jobContextId} ...`);
    jobContextService.getJobContext(jobContextId)
      .then((jobContext) => {
        setJobContextDetail(RemoteObject.loaded(jobContext));
      })
      .catch((error) => {
        setJobContextDetail(RemoteObject.failed(error));
      });
  }

  function onDelete() {
    // Delete functionality - would require full implementation
    setOpenModal(false);
    navigate('/job-context/list');
  }

  function onOpenDeleteModal() {
    setOpenModal(true);
  }

  function onCloseModal() {
    setOpenModal(false);
  }

  if (jobContextDetail.isNotLoaded()) {
    return <LoadingIndicator />;
  }
  if (jobContextDetail.isFailed()) {
    return <Alert type="danger" text={jobContextDetail.error} />;
  }

  const jobContext = jobContextDetail.data;
  const canWrite = currentUser.canWrite;

  return React.createElement('div', null,
    React.createElement('nav', null,
      React.createElement('ol', { className: 'breadcrumb' },
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: '/' }, 'Global Configurations')
        ),
        React.createElement('li', { className: 'breadcrumb-item' },
          React.createElement(Link, { to: '/job-context/list' }, 'Job Contexts')
        ),
        <li className="breadcrumb-item active">{jobContext.name}</li>
      )
    ),
    <h2 className="display-4">{jobContext.name}</h2>,
    React.createElement('div', { className: 'btn-toolbar justify-content-between my-2', role: 'toolbar' },
      React.createElement('div', null,
        canWrite && React.createElement('div', { className: 'btn-group btn-group-sm mr-2', role: 'group' },
          React.createElement(Link, { 
            to: `/job-context/update/${jobContext.id}`, 
            className: 'btn btn-primary btn-light-primary' 
          },
            <i className="fa fa-fw fa-pencil" />,
            ' Update'
          ),
          <button className="btn btn-danger" type="button" onClick={onOpenDeleteModal}>{<i className="fa fa-fw fa-trash" />,
            ' Delete'}</button>
        )
      )
    ),
    React.createElement('section', null,
      React.createElement('h3', { className: 'display-6' }, 'Information'),
      React.createElement('table', { className: 'table table-striped table-fixed my-0' },
        React.createElement('tbody', null,
          React.createElement('tr', null,
            React.createElement('th', { style: { width: '30%' } }, 'Execution System'),
            React.createElement('td', null,
              React.createElement(Link, { to: `/execution-system/detail/${jobContext.executionSystem.id}` },
                jobContext.executionSystem.name
              )
            )
          ),
          <tr>{<th>Used in</th>,
            <td>{`${jobContext.jobCount} jobs`}</td>}</tr>
        )
      )
    ),
    React.createElement('section', null,
      React.createElement('h3', { className: 'display-6' }, 'Configuration Groups'),
      <JobConfigGroupsBlock categoryType="technical" jobConfigGroups={jobContext.configGroups} />
    ),
    openModal && <DeleteModal name={jobContext.name} title="Job Context" openModal={openModal} onDelete={onDelete} onClose={onCloseModal} />
  );
};

export default JobContextDetail;