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
import searchCriteriaService from '../backend/searchCriteriaService';
import { formatTime } from '../utils/utilities';
import DeleteModal from '../components/DeleteModal';
import JobListTable from './components/JobListTable';
import Paginator from '../components/Paginator';

import { convertParametersToString } from './utils';


class SearchCriteriaDetail extends React.Component {
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
      searchCriteriaDetail: null,
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
    searchCriteriaService.deleteCriteriaDetail(this.criteriaId)
      .then(() => {
        this.setState({
          openModal: false,
        }, () => this.onCompleteDeletion());
      })
      .catch((error) => {
        this.setState({
          openModal: false,
          searchCriteriaDetail: error,
        });
      });
  }

  onCompleteDeletion() {
    const { searchCriteriaDetail } = this.state;
    this.setState({ openModal: false }, () => {
      toast.success(`Search Criteria #${searchCriteriaDetail.name} is deleted successfully.`);
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
    const { searchCriteriaDetail } = this.state;
    if (searchCriteriaDetail) {
      this.setState({ loadingJobs: true, openJobListPanel: true }, () => {
        const defaultQuery = SearchCriteriaDetail.getDefaultQuery();
        const jobContent = convertParametersToString(searchCriteriaDetail.parameters);
        const overrideQuery = {
          jobName: searchCriteriaDetail.jobName,
          jobContent: jobContent,
          location: searchCriteriaDetail.location,
        };
        const query = Object.assign({}, defaultQuery, overrideQuery);
        searchCriteriaService.listJobs(query)
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
      searchCriteriaService.listJobs(nextQuery)
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
    searchCriteriaService.getSearchCriteriaDetail(this.criteriaId)
      .then((searchCriteriaDetail) => {
        this.setState({
          searchCriteriaDetail: searchCriteriaDetail,
        });
      })
      .catch((error) => {
        this.setState({
          searchCriteriaDetail: error,
        });
      });
  }

  _deleteModal() {
    const { searchCriteriaDetail, openModal } = this.state;

    if (openModal) {
      return (
        <DeleteModal
          name={searchCriteriaDetail.name}
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
    const { searchCriteriaDetail, jobPage, loadingJobs, openJobListPanel } = this.state;
    const canWrite = this.props.currentUser.canWrite;
    if (searchCriteriaDetail === null) {
      return <LoadingIndicator />;
    }

    if (searchCriteriaDetail instanceof Error) {
      return <ErrorAlert error={searchCriteriaDetail} />;
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
              <Link to="/list">Search Criteria List</Link>
            </li>
            <li className="breadcrumb-item active">{searchCriteriaDetail.name}</li>
          </ol>
        </nav>

        <h2 className="display-4">{searchCriteriaDetail.name}</h2>
        { canWrite && (
        <div className="mb-2">
          <Link
            to={`/update/${searchCriteriaDetail.id}`}
            className="btn btn-sm btn-primary btn-light-primary mr-2"
          >
            <i className="fa fa-fw fa-pencil" /> Edit
          </Link>
          <Link
            to={`/copy/${searchCriteriaDetail.id}`}
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
                        <td>{searchCriteriaDetail.name}</td>
                      </tr>
                      <tr>
                        <th style={{ width: '30%' }}>Description</th>
                        <td>
                          <p style={{ whiteSpace: 'pre-line' }}>{searchCriteriaDetail.description}</p>
                        </td>
                      </tr>
                      <tr>
                        <th style={{ width: '30%' }}>Last Update By</th>
                        <td>{searchCriteriaDetail.lastUpdatedBy}</td>
                      </tr>
                      <tr>
                        <th style={{ width: '30%' }}>Update Time</th>
                        <td>{formatTime(searchCriteriaDetail.updateTime) || 'N/A'}</td>
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
                        <td>{searchCriteriaDetail.jobName || 'N/A'}</td>
                      </tr>
                      <tr>
                        <th style={{ width: '30%' }}>Location</th>
                        <td>{searchCriteriaDetail.location || 'N/A'}</td>
                      </tr>
                    </tbody>
                  </table>
                  <h3 className="display-7">Parameters</h3>
                  <ParametersTable parameters={searchCriteriaDetail.parameters} />
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


SearchCriteriaDetail.propTypes = {
  history: RouterPropTypes.history().isRequired,
  match: RouterPropTypes.match({ criteriaId: PropTypes.string.isRequired }).isRequired,
  currentUser: ScorchPropTypes.currentUser().isRequired,
};

export default withCurrentUser(SearchCriteriaDetail);
