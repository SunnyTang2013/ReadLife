import React from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';

import RouterPropTypes from '../proptypes/router';

import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';
import ParametersTable from '../components/ParametersTable';
import { withCurrentUser } from '../components/currentUser';
import ScorchPropTypes from '../proptypes/scorch';
import { formatTime } from '../utils/utilities';
import DeleteModal from '../components/DeleteModal';
import JobListTable from './components/JobListTable';
import Paginator from '../components/Paginator';
import quantsAQSCoverageService from '../backend/quantAqsCoverageService';

import { convertParametersToString } from './utils';


class QuantAqsCoverageDetail extends React.Component {
  static getDefaultQuery() {
    return {
      jobName: '',
      jobContent: '',
      location: '',
      sort: 'name,asc',
      page: 0,
      size: 50,
    };
  }

  constructor(props) {
    super(props);
    this.criteriaId = props.match.params.criteriaId;
    this.state = {
      quantAqsCoverageDetail: null,
      openModal: false,
      openJobListPanel: false,
      jobPage: null,
      loadingJobs: false,
    };
    this.onDelete = this.onDelete.bind(this);
    this.onOpenDeleteModal = this.onOpenDeleteModal.bind(this);
    this.onCompleteDeletion = this.onCompleteDeletion.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.onRunSearch = this.onRunSearch.bind(this);
    this.onClickPage = this.onClickPage.bind(this);
  }

  componentDidMount() {
    this._loadData();
  }

  onDelete() {
    quantsAQSCoverageService.deleteQuantAqsCoverage(this.criteriaId)
      .then(() => {
        this.setState({
          openModal: false,
        }, () => this.onCompleteDeletion());
      })
      .catch((error) => {
        this.setState({
          openModal: false,
          quantAqsCoverageDetail: error,
        });
      });
  }

  onCompleteDeletion() {
    const { quantAqsCoverageDetail } = this.state;
    this.setState({ openModal: false }, () => {
      toast.success(`Search Criteria #${quantAqsCoverageDetail.name} is deleted successfully.`);
      this.props.history.push('/list');
    });
  }

  onCancel() {
    this.setState({ openModal: false });
  }

  onOpenDeleteModal() {
    this.setState({ openModal: true });
  }

  onRunSearch() {
    const { quantAqsCoverageDetail } = this.state;
    if (quantAqsCoverageDetail) {
      this.setState({ loadingJobs: true, openJobListPanel: true }, () => {
        const defaultQuery = quantAqsCoverageDetail.getDefaultQuery();
        const jobContent = convertParametersToString(quantAqsCoverageDetail.parameters);
        const overrideQuery = {
          jobName: quantAqsCoverageDetail.jobName,
          jobContent: jobContent,
          location: quantAqsCoverageDetail.location,
        };
        const query = Object.assign({}, defaultQuery, overrideQuery);
        quantsAQSCoverageService.listJobs(query)
          .then((jobPage) => {
            this.setState({
              jobPage: jobPage,
              loadingJobs: false,
              query: query,
            });
          })
          .catch((error) => {
            this.setState({
              jobPage: error,
              loadingJobs: false,
              query: query,
            });
          });
      });
    }
  }

  onClickPage(page) {
    const { query } = this.state;
    const nextQuery = Object.assign({}, query, { page });
    this.setState({ loadingJobs: true, openJobListPanel: true }, () => {
      quantsAQSCoverageService.listJobs(nextQuery)
        .then((jobPage) => {
          this.setState({
            jobPage: jobPage,
            loadingJobs: false,
            query: query,
          });
        }).catch((error) => {
          this.setState({
            jobPage: error,
            loadingJobs: false,
            query: query,
          });
        });
    });
  }

  _loadData() {
    quantsAQSCoverageService.getQuantAqsCoverageDetail(this.criteriaId)
      .then((quantAqsCoverageDetail) => {
        this.setState({
          quantAqsCoverageDetail: quantAqsCoverageDetail,
        });
      })
      .catch((error) => {
        this.setState({
          quantAqsCoverageDetail: error,
        });
      });
  }

  _deleteModal() {
    const { quantAqsCoverageDetail, openModal } = this.state;

    if (openModal) {
      return (
        <DeleteModal
          name={quantAqsCoverageDetail.name}
          title="Search Criteria"
          openModal={openModal}
          onDelete={this.onDelete}
          onClose={this.onCancel}
        />
      );
    }
    return null;
  }

  render() {
    const { quantAqsCoverageDetail, jobPage, loadingJobs, openJobListPanel } = this.state;
    const canWrite = this.props.currentUser.canWrite;
    if (quantAqsCoverageDetail === null) {
      return <LoadingIndicator />;
    }

    if (quantAqsCoverageDetail instanceof Error) {
      return <ErrorAlert error={quantAqsCoverageDetail} />;
    }

    const $deleteModal = this._deleteModal();

    let criteriaColStyle = 'col-lg-12';
    if (openJobListPanel) {
      criteriaColStyle = 'col-lg-6';
    }

    let $jobListTable = <LoadingIndicator />;
    if (!loadingJobs && jobPage) {
      $jobListTable = (
        <div>
          <JobListTable jobList={jobPage.content} />
          <Paginator page={jobPage} onClickPage={this.onClickPage} />
        </div>
      );
    }

    return (
      <div className="container-fluid" style={{ maxWidth: '85%' }}>
        <nav>
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link to="/list">Quant AQS Coverage List</Link>
            </li>
            <li className="breadcrumb-item active">{quantAqsCoverageDetail.name}</li>
          </ol>
        </nav>

        <h2 className="display-4">{quantAqsCoverageDetail.name}</h2>
        { canWrite && (
          <div className="mb-2">
            <Link
              to={`/update/${quantAqsCoverageDetail.id}`}
              className="btn btn-sm btn-primary btn-light-primary mr-2"
            >
              <i className="fa fa-fw fa-pencil" /> Edit
            </Link>
            <Link
              to={`/copy/${quantAqsCoverageDetail.id}`}
              className="btn btn-sm btn-primary btn-light-primary mr-2"
            >
              <i className="fa fa-fw fa-copy" /> Clone
            </Link>
            <button
              className="btn btn-sm btn-danger mr-2"
              type="button"
              onClick={this.onOpenDeleteModal}
            >
              <i className="fa fa-fw fa-trash" /> Delete
            </button>
            <button
              className="btn btn-sm btn-primary btn-light-primary"
              type="button"
              onClick={this.onRunSearch}
            >
              <i className="fa fa-fw fa-play" /> Run Search
            </button>
          </div>
        )}

        <div className="row">
          <div className={criteriaColStyle}>
            <div className="card">
              <div className="card-body">
                <section>
                  <table className="table table-striped table-fixed mb-0">
                    <tbody>
                      <tr>
                        <th style={{ width: '30%' }}>Name</th>
                        <td>{quantAqsCoverageDetail.name}</td>
                      </tr>
                      <tr>
                        <th style={{ width: '30%' }}>Description</th>
                        <td>
                          <p style={{ whiteSpace: 'pre-line' }}>{quantAqsCoverageDetail.description}</p>
                        </td>
                      </tr>
                      <tr>
                        <th style={{ width: '30%' }}>Last Update By</th>
                        <td>{quantAqsCoverageDetail.lastUpdatedBy}</td>
                      </tr>
                      <tr>
                        <th style={{ width: '30%' }}>Update Time</th>
                        <td>{formatTime(quantAqsCoverageDetail.updateTime) || 'N/A'}</td>
                      </tr>
                    </tbody>
                  </table>
                </section>

                <h3 className="display-6">Definition</h3>
                <section>
                  <table className="table table-fixed mb-0">
                    <tbody>
                      <tr>
                        <th style={{ width: '30%' }}>Job Name Contains</th>
                        <td>{quantAqsCoverageDetail.jobName || 'N/A'}</td>
                      </tr>
                      <tr>
                        <th style={{ width: '30%' }}>Location</th>
                        <td>{quantAqsCoverageDetail.location || 'N/A'}</td>
                      </tr>
                    </tbody>
                  </table>
                  <h3 className="display-7">Parameters</h3>
                  <ParametersTable parameters={quantAqsCoverageDetail.parameters} />
                </section>
              </div>
            </div>
          </div>
          {
            openJobListPanel && (
              <div className="col-lg-6">
                <div className="card">
                  <div className="card-body">
                    <h3 className="display-7">Job List</h3>
                    {$jobListTable}
                  </div>
                </div>
              </div>
            )
          }
        </div>

        {$deleteModal}
      </div>
    );
  }
}
QuantAqsCoverageDetail.propTypes = {
  history: RouterPropTypes.history().isRequired,
  match: RouterPropTypes.match({ criteriaId: PropTypes.string.isRequired }).isRequired,
  currentUser: ScorchPropTypes.currentUser().isRequired,
};
export default withCurrentUser(QuantAqsCoverageDetail);
