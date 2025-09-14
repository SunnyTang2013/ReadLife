import React from 'react';
import { Link } from 'react-router-dom';

import { isEqual, cloneDeep } from 'lodash';
import queryString from 'query-string';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import searchCriteriaService from '../backend/searchCriteriaService';

import Alert from '../components/Alert';
import LoadingIndicator from '../components/LoadingIndicator';
import Paginator from '../components/Paginator';

import { withCurrentUser } from '../components/currentUser';
import { formatTime } from '../utils/utilities';
import ScorchPropTypes from '../proptypes/scorch';
import RouterPropTypes from '../proptypes/router';
import DeleteModal from '../components/DeleteModal';


class SearchCriteriaList extends React.Component {
  static getDefaultQuery() {
    return {
      nameKeyword: '',
      minCreateTime: '',
      maxCreateTime: '',
      lastUpdatedBy: '',
      sort: 'name,asc',
      page: 0,
      size: 50,
    };
  }

  static onQuickRunSearch(batchId) {
    searchCriteriaService.submitBatch(batchId)
      .then((batchRequest) => {
        toast.success(`Batch has been submitted, status is: ${batchRequest.status}`);
      })
      .catch((error) => {
        toast.error(`Failed to submit batch: ${error}`);
      });
  }

  constructor(props) {
    super(props);
    this.state = {
      searchCriteriaPage: null,
      filteringOptions: {},
      selectedCriteria: [],
      openModal: false,
      delSearchCriteria: null,
    };

    this.onClickPage = this.onClickPage.bind(this);
    this.onCheckOrUncheckSearchCriteriaList = this.onCheckOrUncheckSearchCriteriaList.bind(this);
    this.onCheckOrUncheckSearchCriteria = this.onCheckOrUncheckSearchCriteria.bind(this);
    this.onDelCriteriaList = this.onDelCriteriaList.bind(this);
    this.onChangeProperty = this.onChangeProperty.bind(this);
    this.onChangeCreateTimeRange = this.onChangeCreateTimeRange.bind(this);
    this.onClickUpdatedByMe = this.onClickUpdatedByMe.bind(this);
    this.onApplyFilteringOptions = this.onApplyFilteringOptions.bind(this);
    this.onResetFilteringOptions = this.onResetFilteringOptions.bind(this);
    this.onOpenDeleteModal = this.onOpenDeleteModal.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onCancel = this.onCancel.bind(this);
  }

  componentDidMount() {
    this._loadCriteriaPage();
  }

  componentDidUpdate(prevProps) {
    if (!isEqual(prevProps, this.props)) {
      this._clearAndLoadSearchCriteriaPage();
    }
  }

  onChangeProperty(name, event) {
    const value = event.target.value;
    this.setState((prevState) => {
      const filteringOptions = cloneDeep(prevState.filteringOptions);
      filteringOptions[name] = value;
      return { filteringOptions };
    });
  }

  onDelCriteriaList() {
    const { selectedCriteria } = this.state;
    if (selectedCriteria.length < 1) {
      toast.warn('No criteria selected to del.');
      return;
    }
    searchCriteriaService.onDelCriteriaList(selectedCriteria)
      .then(() => {
        this.setState({
          openModal: false,
        }, () => this._clearAndLoadSearchCriteriaPage());
      })
      .catch((error) => {
        this.setState({
          openModal: false,
          searchCriteriaPage: error,
        });
      });
  }

  onCheckOrUncheckSearchCriteriaList(event) {
    const { searchCriteriaPage, selectedCriteria } = this.state;
    if (event.target.id === 'SELECT_ALL_CRITERIA') {
      searchCriteriaPage.content.map(batch => {
        if (!selectedCriteria.includes(batch.id)) {
          selectedCriteria.push(batch.id);
        }
        return selectedCriteria;
      });
    } else if (event.target.id === 'CLEAR') {
      searchCriteriaPage.content.map(batch => {
        const index = selectedCriteria.indexOf(batch.id);
        if (index > -1) {
          selectedCriteria.splice(index, 1);
        }
        return selectedCriteria;
      });
    }

    this.setState({ selectedCriteria: selectedCriteria });
  }

  onCheckOrUncheckSearchCriteria(searchCriteria, event) {
    const { selectedCriteria } = this.state;
    const index = selectedCriteria.indexOf(searchCriteria.id);
    if (event.target.checked && index === -1) {
      selectedCriteria.push(searchCriteria.id);
      this.setState({ selectedCriteria: selectedCriteria });
    } else if (!event.target.checked && index > -1) {
      selectedCriteria.splice(index, 1);
      this.setState({ selectedCriteria: selectedCriteria });
    }
  }

  onClickPage(page) {
    const url = this._getQueryUrl({ page });
    this.props.history.push(url);
  }

  onChangeCreateTimeRange(name, dateTime) {
    this.setState((prevState) => {
      const filteringOptions = Object.assign({}, prevState.filteringOptions);
      if (!dateTime) {
        filteringOptions[name] = null;
      } else {
        filteringOptions[name] = dateTime.toISOString();
      }
      return { filteringOptions };
    });
  }

  onClickUpdatedByMe() {
    const { currentUser } = this.props;
    if (currentUser && currentUser.username) {
      this.setState((prevState) => {
        const lastUpdatedBy = currentUser.username;
        const filteringOptions = Object.assign({}, prevState.filteringOptions, { lastUpdatedBy });
        return { filteringOptions };
      });
    }
  }

  onApplyFilteringOptions() {
    const queryOverrides = Object.assign({}, this.state.filteringOptions);
    Object.keys(queryOverrides).forEach((key) => {
      queryOverrides[key] = (queryOverrides[key] || '').trim();
    });
    queryOverrides.page = 0; // Need to reset page number to 0.
    const url = this._getQueryUrl(queryOverrides);
    this.props.history.push(url);
  }

  onResetFilteringOptions() {
    const defaultQuery = SearchCriteriaList.getDefaultQuery();
    const queryOverrides = {
      name: defaultQuery.name,
      lastUpdatedBy: defaultQuery.lastUpdatedBy,
      minCreateTime: defaultQuery.minCreateTime,
      maxCreateTime: defaultQuery.maxCreateTime,
      page: 0,
    };
    this.setState({ filteringOptions: {} });
    const url = this._getQueryUrl(queryOverrides);
    this.props.history.push(url);
  }

  onDelete() {
    const { delSearchCriteria } = this.state;
    if (delSearchCriteria) {
      searchCriteriaService.deleteCriteriaDetail(delSearchCriteria.id)
        .then(() => {
          this.setState({
            openModal: false,
          }, () => this._clearAndLoadSearchCriteriaPage());
        })
        .catch((error) => {
          this.setState({
            openModal: false,
            searchCriteriaPage: error,
          });
        });
    } else {
      this.onCancel();
    }
  }

  onCancel() {
    this.setState({ openModal: false });
  }

  onOpenDeleteModal(delSearchCriteria) {
    this.setState({ openModal: true, delSearchCriteria: delSearchCriteria });
  }

  get query() {
    const defaultQuery = SearchCriteriaList.getDefaultQuery();
    const query = queryString.parse(this.props.location.search);
    return Object.assign({}, defaultQuery, query);
  }

  _getQueryUrl(overrides) {
    const nextQuery = Object.assign({}, this.query, overrides);
    return `${this.props.location.pathname}?${queryString.stringify(nextQuery)}`;
  }

  _loadCriteriaPage() {
    const query = this.query;
    searchCriteriaService.findSearchCriteriaByKeywords(query)
      .then((searchCriteriaPage) => {
        this.setState({ searchCriteriaPage });
      })
      .catch(error => this.setState({ searchCriteriaPage: error }));
  }

  _clearAndLoadSearchCriteriaPage() {
    this.setState({
      searchCriteriaPage: null,
      selectedCriteria: [],
    }, () => this._loadCriteriaPage());
  }

  _deleteModal() {
    const { delSearchCriteria, openModal } = this.state;

    if (openModal) {
      return (
        <DeleteModal
          name={delSearchCriteria.name}
          title="Search Criteria"
          openModal={openModal}
          onDelete={this.onDelete}
          onClose={this.onCancel}
        />
      );
    }
    return null;
  }

  _renderFilteringOptions() {
    const filteringOptions = Object.assign({}, this.query, this.state.filteringOptions);
    let minCreateTime = null;
    if (filteringOptions.minCreateTime) {
      minCreateTime = new Date(filteringOptions.minCreateTime);
    }
    let maxCreateTime = null;
    if (filteringOptions.maxCreateTime) {
      maxCreateTime = new Date(filteringOptions.maxCreateTime);
    }

    return (
      <aside>
        <h2 className="display-6">Filtering Options</h2>
        <div className="card">
          <div className="card-body">
            <div className="form-group">
              <label htmlFor="query-name-keyword">Name Contains:</label>
              <input
                id="query-name-keyword"
                className="form-control"
                value={filteringOptions.nameKeyword}
                onChange={event => this.onChangeProperty('nameKeyword', event)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="query-min-create-time">From Time:</label>
              <DatePicker
                id="query-min-create-time"
                className="form-control"
                selected={minCreateTime}
                onChange={selected => this.onChangeCreateTimeRange('minCreateTime', selected)}
                dateFormat="yyyy-MM-dd HH:mm"
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={30}
                timeCaption="time"
              />
            </div>
            <div className="form-group">
              <label htmlFor="query-max-create-time">Till Time:</label>
              <DatePicker
                id="query-max-create-time"
                className="form-control"
                selected={maxCreateTime}
                onChange={selected => this.onChangeCreateTimeRange('maxCreateTime', selected)}
                dateFormat="yyyy-MM-dd HH:mm"
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={30}
                timeCaption="time"
              />
            </div>
            <div className="form-group">
              <label htmlFor="query-update-username">Last Updated By:</label>
              <input
                id="query-update-username"
                className="form-control"
                value={filteringOptions.lastUpdatedBy}
                onChange={event => this.onChangeProperty('lastUpdatedBy', event)}
              />
              {this.props.currentUser.username && (
                <button
                  className="anchor"
                  type="button"
                  onClick={this.onClickUpdatedByMe}
                >
                  Updated by me
                </button>
              )}
            </div>
            <div className="form-group">
              <button
                type="button"
                className="btn btn-primary mr-2"
                onClick={this.onApplyFilteringOptions}
              >
                Search
              </button>
              <button
                type="button"
                className="btn btn-light"
                onClick={this.onResetFilteringOptions}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  render() {
    const {
      searchCriteriaPage,
      selectedCriteria,
    } = this.state;

    const {
      sort,
    } = this.query;

    const canWrite = this.props.currentUser.canWrite;
    const canExecute = this.props.currentUser.canExecute;
    const ordering = sort.split(',')[1];

    if (searchCriteriaPage === null) {
      return <LoadingIndicator />;
    }
    if (searchCriteriaPage instanceof Error) {
      return <Alert type="danger" text={String(searchCriteriaPage)} />;
    }

    const $filteringOptions = this._renderFilteringOptions();
    const $deleteModal = this._deleteModal();

    const $searchCriteriaRows = searchCriteriaPage.content.map(searchCriteria => (
      <tr key={`batch-row-${searchCriteria.id}`}>
        <td>
          <input
            type="checkbox"
            checked={selectedCriteria.indexOf(searchCriteria.id) > -1}
            onChange={event => this.onCheckOrUncheckSearchCriteria(searchCriteria, event)}
          />
        </td>
        <td>
          <Link to={`/detail/${searchCriteria.id}`}>{searchCriteria.name}</Link>
        </td>
        <td className="text-nowrap">{searchCriteria.lastUpdatedBy}</td>
        <td className="text-nowrap">{formatTime(searchCriteria.updateTime) || 'N/A'}</td>
        <td className="text-nowrap">
          <div className="btn-group btn-group-xs" role="group">
            {canWrite && (
              <Link to={`/update/${searchCriteria.id}`} className="btn btn-outline-primary" title="Configure">
                <i className="fa fa-fw fa-pencil" />
              </Link>
            )}
            <a
              href={`/frontend/jobs/?filterScope=Search_Criteria&page=0&searchCriteriaId=${searchCriteria.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-primary"
            >
              <i className="fa fa-fw fa-search" />
            </a>
            {canWrite && (
              <button
                className="btn btn-outline-danger"
                type="button"
                title="Delete Search Criteria"
                onClick={() => this.onOpenDeleteModal(searchCriteria)}
              >
                <i className="fa fa-fw fa-trash" />
              </button>
            )}
          </div>
          {!canWrite && !canExecute && (
            <span className="text-muted">--</span>
          )}
        </td>
      </tr>
    ));

    let $sortIcon = null;
    if (ordering === SearchCriteriaList.ASC) {
      $sortIcon = <i className="fa fa-fw fa-sort-alpha-asc ml-1" />;
    } else if (ordering === SearchCriteriaList.DESC) {
      $sortIcon = <i className="fa fa-fw fa-sort-alpha-desc ml-1" />;
    }

    let $searchCriteriaListTable = null;
    if ($searchCriteriaRows.length === 0) {
      $searchCriteriaListTable = <Alert type="warning" text="No criteria found." />;
    } else {
      $searchCriteriaListTable = (
        <table className="table table-striped mb-2">
          <thead>
            <tr>
              <th style={{ width: '7%' }}>
                <div className="btn-group">
                  <button
                    data-toggle="dropdown"
                    className="btn btn-primary dropdown-toggle"
                    type="button"
                    id="dropdown-menu"
                  >ACTIONS
                  </button>
                  <div className="dropdown-menu">
                    <button id="SELECT_ALL_CRITERIA" className="dropdown-item" type="button" onClick={this.onCheckOrUncheckSearchCriteriaList}>Select All</button>
                    <button id="CLEAR" className="dropdown-item" type="button" onClick={this.onCheckOrUncheckSearchCriteriaList}>Clear</button>
                    {canWrite && (
                      <button id="DELETE_CRITERIA" className="dropdown-item" type="button" title="Del Selected Criteria" onClick={this.onDelCriteriaList}>Delete Criteria</button>
                    )}
                  </div>
                </div>
              </th>
              <th>
                <button className="anchor" type="button" onClick={this.onToggleNameOrdering}>
                  Name {$sortIcon}
                </button>
              </th>
              <th className="text-nowrap" style={{ width: '10%' }}>Last Update By</th>
              <th className="text-nowrap" style={{ width: '10%' }}>Update Time</th>
              <th className="text-nowrap" style={{ width: '10%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {$searchCriteriaRows}
          </tbody>
        </table>
      );
    }

    return (
      <div>
        <h2 className="display-4">Search Criteria</h2>
        <div className="row mb-2">
          <div className="col-9">
            <div className="d-flex justify-content-end align-items-center">
              { canWrite && (
                <div className="text-right my-2">
                  <Link to="/create" className="btn btn-primary btn-light-primary">
                    <i className="fa fa-fw fa-plus" /> Add A New Criteria
                  </Link>
                </div>
              )}
            </div>
            <div>
              {$searchCriteriaListTable}
            </div>
            <Paginator page={searchCriteriaPage} onClickPage={this.onClickPage} />
          </div>
          <div className="col-3">
            {$filteringOptions}
          </div>
        </div>
        {$deleteModal}
      </div>
    );
  }
}

SearchCriteriaList.ASC = 'asc';
SearchCriteriaList.DESC = 'desc';

SearchCriteriaList.propTypes = {
  history: RouterPropTypes.history().isRequired,
  location: RouterPropTypes.location().isRequired,
  currentUser: ScorchPropTypes.currentUser().isRequired,
};

export default withCurrentUser(SearchCriteriaList);
