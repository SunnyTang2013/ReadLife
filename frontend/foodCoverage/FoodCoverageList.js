import React from 'react';
// import { Link } from 'react-router-dom';
import { isEqual, cloneDeep } from 'lodash';
import queryString from 'query-string';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import Alert from '../components/Alert';
import LoadingIndicator from '../components/LoadingIndicator';

import { withCurrentUser } from '../components/currentUser';
import ScorchPropTypes from '../proptypes/scorch';
import RouterPropTypes from '../proptypes/router';
import DeleteModal from '../components/DeleteModal';
import quantAqsCoverageService from '../backend/quantAqsCoverageService';
import Paginator from '../components/Paginator';


class QuantAqsCoverageList extends React.Component {
  static getDefaultQuery() {
    return {
      nameKeyword: '',
      minCreateTime: '',
      maxCreateTime: '',
      lastUpdatedBy: '',
      scope: '',
      consumer: '',
      manifest: '',
      liveVers: '',
      curve: '',
      pdp: '',
      pbmDescription: '',
      contextName: '',
      sort: 'jobName,asc',
      aqs: '',
      page: 0,
      size: 50,
    };
  }

  static onQuickRunSearch(batchId) {
    quantAqsCoverageService.submitBatch(batchId)
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
      quantAqsCoveragePage: null,
      filteringOptions: {},
      selectedCoverage: [],
      openModal: false,
      delQuantAqsCoverage: null,
    };

    this.onClickPage = this.onClickPage.bind(this);
    this.onCheckOrUncheckQuantAqsCoverageList = this.onCheckOrUncheckQuantAqsCoverageList
      .bind(this);
    this.onCheckOrUncheckQuantAqsCoverage = this.onCheckOrUncheckQuantAqsCoverage.bind(this);
    this.onDelCoverageList = this.onDelCoverageList.bind(this);
    this.onChangeProperty = this.onChangeProperty.bind(this);
    this.onChangeCreateTimeRange = this.onChangeCreateTimeRange.bind(this);
    this.onClickUpdatedByMe = this.onClickUpdatedByMe.bind(this);
    this.onApplyFilteringOptions = this.onApplyFilteringOptions.bind(this);
    this.onResetFilteringOptions = this.onResetFilteringOptions.bind(this);
    this.onOpenDeleteModal = this.onOpenDeleteModal.bind(this);
    this.onChangeAqs = this.onChangeAqs.bind(this);
    this.onChangeConsumer = this.onChangeConsumer.bind(this);
    this.onChangeScope = this.onChangeScope.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.onChangePageSize = this.onChangePageSize.bind(this);
  }

  componentDidMount() {
    this._loadCoveragePage();
  }

  componentDidUpdate(prevProps) {
    if (!isEqual(prevProps, this.props)) {
      this._clearAndLoadQuantAqsCoveragePage();
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

  onChangePageSize(event) {
    const size = event.target.value;
    this.setState((prevState) => {
      const filteringOptions = Object.assign({}, prevState.filteringOptions, { size });
      return { filteringOptions };
    });
  }

  onChangeAqs(event) {
    const aqs = event.target.value;
    this.setState((prevState) => {
      const filteringOptions = Object.assign({}, prevState.filteringOptions, { aqs });
      return { filteringOptions };
    });
  }

  onChangeConsumer(event) {
    let opt;
    let consumer = '';
    const len = event.target.options.length;
    for (let i = 0; i < len; i++) {
      opt = event.target.options[i];
      if (opt.selected) {
        consumer = `${consumer + opt.value},`;
      }
    }

    consumer = consumer.substring(0, consumer.length - 1);
    this.setState((prevState) => {
      const filteringOptions = Object.assign({}, prevState.filteringOptions,
        { consumer });
      return { filteringOptions };
    });
  }

  onChangeScope(event) {
    const scope = event.target.value;
    this.setState((prevState) => {
      const filteringOptions = Object.assign({}, prevState.filteringOptions, { scope });
      return { filteringOptions };
    });
  }

  onDelCoverageList() {
    const { selectedCoverage } = this.state;
    if (selectedCoverage.length < 1) {
      toast.warn('No Coverage selected to del.');
      return;
    }
    quantAqsCoverageService.onDelCoverageList(selectedCoverage)
      .then(() => {
        this.setState({
          openModal: false,
        }, () => this._clearAndLoadQuantAqsCoveragePage());
      })
      .catch((error) => {
        this.setState({
          openModal: false,
          quantAqsCoveragePage: error,
        });
      });
  }

  onCheckOrUncheckQuantAqsCoverageList(event) {
    const { quantAqsCoveragePage, selectedCoverage } = this.state;
    if (event.target.id === 'SELECT_ALL_COVERAGE') {
      quantAqsCoveragePage.content.map(batch => {
        if (!selectedCoverage.includes(batch.id)) {
          selectedCoverage.push(batch.id);
        }
        return selectedCoverage;
      });
    } else if (event.target.id === 'CLEAR') {
      quantAqsCoveragePage.content.map(batch => {
        const index = selectedCoverage.indexOf(batch.id);
        if (index > -1) {
          selectedCoverage.splice(index, 1);
        }
        return selectedCoverage;
      });
    }

    this.setState({ selectedCoverage: selectedCoverage });
  }

  onCheckOrUncheckQuantAqsCoverage(quantAqsCoverage, event) {
    const { selectedCoverage } = this.state;
    const index = selectedCoverage.indexOf(quantAqsCoverage.id);
    if (event.target.checked && index === -1) {
      selectedCoverage.push(quantAqsCoverage.id);
      this.setState({ selectedCoverage: selectedCoverage });
    } else if (!event.target.checked && index > -1) {
      selectedCoverage.splice(index, 1);
      this.setState({ selectedCoverage: selectedCoverage });
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
    const defaultQuery = QuantAqsCoverageList.getDefaultQuery();
    const queryOverrides = {
      name: defaultQuery.name,
      lastUpdatedBy: defaultQuery.lastUpdatedBy,
      minCreateTime: defaultQuery.minCreateTime,
      maxCreateTime: defaultQuery.maxCreateTime,
      page: 0,
      size: defaultQuery.size,
    };
    this.setState({ filteringOptions: {} });
    const url = this._getQueryUrl(queryOverrides);
    this.props.history.push(url);
  }

  onDelete() {
    const { delQuantAqsCoverage } = this.state;
    if (delQuantAqsCoverage) {
      quantAqsCoverageService.deleteCoverageDetail(delQuantAqsCoverage.id)
        .then(() => {
          this.setState({
            openModal: false,
          }, () => this._clearAndLoadQuantAqsCoveragePage());
        })
        .catch((error) => {
          this.setState({
            openModal: false,
            quantAqsCoveragePage: error,
          });
        });
    } else {
      this.onCancel();
    }
  }

  onCancel() {
    this.setState({ openModal: false });
  }

  onOpenDeleteModal(delQuantAqsCoverage) {
    this.setState({ openModal: true, delQuantAqsCoverage: delQuantAqsCoverage });
  }

  get query() {
    const defaultQuery = QuantAqsCoverageList.getDefaultQuery();
    const query = queryString.parse(this.props.location.search);
    return Object.assign({}, defaultQuery, query);
  }

  _getQueryUrl(overrides) {
    const nextQuery = Object.assign({}, this.query, overrides);
    return `${this.props.location.pathname}?${queryString.stringify(nextQuery)}`;
  }

  _loadCoveragePage() {
    const query = this.query;
    quantAqsCoverageService.findQuantAqsCoverageByKeywords(query)
      .then((quantAqsCoveragePage) => {
        this.setState({ quantAqsCoveragePage });
      })
      .catch(error => this.setState({ quantAqsCoveragePage: error }));
  }

  _clearAndLoadQuantAqsCoveragePage() {
    this.setState({
      quantAqsCoveragePage: null,
      selectedCoverage: [],
    }, () => this._loadCoveragePage());
  }

  _deleteModal() {
    const { delQuantAqsCoverage, openModal } = this.state;

    if (openModal) {
      return (
        <DeleteModal
          name={delQuantAqsCoverage.name}
          title="Quant AQS Coverage"
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
      console.log(minCreateTime);
    }
    let maxCreateTime = null;
    if (filteringOptions.maxCreateTime) {
      maxCreateTime = new Date(filteringOptions.maxCreateTime);
      console.log(maxCreateTime);
    }

    return (
      <div>

        <div className="card">
          <h2 className="display-6">Filtering Options</h2>
          <div className="flex-container">
            <div className="form-group">
              <label htmlFor="query-name-keyword">Job Name Contains:</label>
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
              <label htmlFor="page-size" className="mr-2">Scope</label>
              <select
                id="aqs-type"
                className="form-control"
                onChange={this.onChangeScope}
                value={filteringOptions.scope}
              >
                <option value="">----</option>
                <option value="SRP">SRP</option>
                <option value="Flow">Flow</option>
                <option value="MRUD">MRUD</option>
                <option value="CEM">CEM</option>
                <option value="Compression">Compression</option>
                <option value="Repo">Repo</option>
                <option value="Risky Bond">Risky Bond</option>
                <option value="PC-specific">PC-specific</option>
                <option value="MKTY">MKTY</option>
                <option value="VaR">VaR</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="query-consumer">Job Consumer :</label>
              <select
                id="consumer"
                className="form-control"
                onChange={this.onChangeConsumer}
                multiple
              >
                <option value="">----</option>
                <option value="FO" selected={filteringOptions.consumer.indexOf('FO') > -1}>FO</option>
                <option value="TR" selected={filteringOptions.consumer.indexOf('TR') > -1}>TR</option>
                <option value="PC" selected={filteringOptions.consumer.indexOf('PC') > -1}>PC</option>
                <option
                  value="Collateral"
                  selected={filteringOptions.consumer.indexOf('Collateral') > -1}
                >Collateral
                </option>
                <option
                  value="BondPrice"
                  selected={filteringOptions.consumer.indexOf('BondPrice') > -1}
                >BondPrice
                </option>
                <option
                  value="Credit_Risks"
                  selected={filteringOptions.consumer.indexOf('Credit_Risks') > -1}
                >Credit_Risks
                </option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="query-manifest">Manifest Contains:</label>
              <input
                id="query-manifest"
                className="form-control"
                value={filteringOptions.manifest}
                onChange={event => this.onChangeProperty('manifest', event)}
              />
            </div>
          </div>
          <div className="flex-container">
            <div className="form-group">
              <label htmlFor="query-curve">Curve Contains:</label>
              <input
                id="query-curve"
                className="form-control"
                value={filteringOptions.curve}
                onChange={event => this.onChangeProperty('curve', event)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="query-pdp">PDP Contains:</label>
              <input
                id="query-pdp"
                className="form-control"
                value={filteringOptions.pdp}
                onChange={event => this.onChangeProperty('pdp', event)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="query-pbm-description">Pbm Desc Contains:</label>
              <input
                id="query-pbm-description"
                className="form-control"
                value={filteringOptions.pbmDescription}
                onChange={event => this.onChangeProperty('pbmDescription', event)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="query-context-name">Context Name Contains:</label>
              <input
                id="query-context-name"
                className="form-control"
                value={filteringOptions.contextName}
                onChange={event => this.onChangeProperty('contextName', event)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="page-size" className="mr-2">AQS</label>
              <select
                id="aqs-type"
                className="form-control"
                onChange={this.onChangeAqs}
                value={filteringOptions.aqs}
              >
                <option value="">---</option>
                <option value="QAQS">QAQS</option>
                <option value="ITAQS">ITAQS</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="query-live-version">Live Version Contains:</label>
              <input
                id="query-live-version"
                className="form-control"
                value={filteringOptions.liveVers}
                onChange={event => this.onChangeProperty('liveVers', event)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="page-size" className="mr-2">Page Size</label>
              <select
                id="page-size"
                className="form-control"
                onChange={this.onChangePageSize}
                value={filteringOptions.size}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={1500}>ALL</option>
              </select>
            </div>
            <div className="form-group">
              <button
                type="button"
                className="btn btn-primary mt-lg-4"
                onClick={this.onApplyFilteringOptions}
              >
                Search
              </button>
              <button
                type="button"
                className="btn btn-light mt-lg-4"
                onClick={this.onResetFilteringOptions}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    const {
      quantAqsCoveragePage,
      // selectedCoverage,
    } = this.state;

    // const {
    //   sort,
    // } = this.query;

    const canWrite = this.props.currentUser.canWrite;
    // const canExecute = this.props.currentUser.canExecute;
    // const ordering = sort.split(',')[1];

    if (quantAqsCoveragePage === null) {
      return <LoadingIndicator />;
    }
    if (quantAqsCoveragePage instanceof Error) {
      return <Alert type="danger" text={String(quantAqsCoveragePage)} />;
    }

    const $filteringOptions = this._renderFilteringOptions();
    const $deleteModal = this._deleteModal();

    const $quantAqsCoverageRows = quantAqsCoveragePage.content.map(quantAqsCoverage => (
      <tr key={`batch-row-${quantAqsCoverage.id}`}>
        <td className="text-nowrap">
          <a
            href={`/frontend/jobs/job/detail/${quantAqsCoverage.jobId}`}
          >{quantAqsCoverage.jobName}
          </a>
        </td>
        <td className="text-nowrap">{quantAqsCoverage.isProd == true ? 'PROD' : 'UAT'}</td>
        <td className="text-nowrap">{quantAqsCoverage.itOwner}</td>
        <td className="text-nowrap">{quantAqsCoverage.liveVersion}</td>
        <td className="text-nowrap">{quantAqsCoverage.riskMajorType}</td>
        <td className="text-nowrap">{quantAqsCoverage.currencyWorkflow}</td>
        <td className="text-nowrap">{quantAqsCoverage.targetWorkflow}</td>
        <td className="text-nowrap">{quantAqsCoverage.atlas}</td>
        <td className="text-nowrap">{quantAqsCoverage.comments}</td>
        <td className="text-nowrap">
          <a href={`/frontend/globalConfig/job-context/detail/${quantAqsCoverage.contextId}`}>
            {quantAqsCoverage.contextName}
          </a>
        </td>
        <td className="text-nowrap">{quantAqsCoverage.problemDescription}</td>
        <td className="text-nowrap">{quantAqsCoverage.problemDescSource}</td>
        <td className="text-nowrap">{quantAqsCoverage.curve}</td>
        <td className="text-nowrap">{quantAqsCoverage.pdp}</td>
        <td className="text-nowrap">{quantAqsCoverage.scope}</td>
        <td className="text-nowrap">{quantAqsCoverage.consumer}</td>
        <td className="text-nowrap">{quantAqsCoverage.manifest}</td>
        <td className="text-nowrap">{quantAqsCoverage.status}</td>
      </tr>
    ));

    // let $sortIcon = null;
    // if (ordering === QuantAqsCoverageList.ASC) {
    //   $sortIcon = <i className="fa fa-fw fa-sort-alpha-asc ml-1" />;
    // } else if (ordering === QuantAqsCoverageList.DESC) {
    //   $sortIcon = <i className="fa fa-fw fa-sort-alpha-desc ml-1" />;
    // }

    let $quantAqsCoverageListTable = null;
    if ($quantAqsCoverageRows.length === 0) {
      $quantAqsCoverageListTable = <Alert type="warning" text="No criteria found." />;
    } else {
      $quantAqsCoverageListTable = (
        <table className="table table-striped mb-2">
          <thead>
            <tr>
              <th>
                <button className="anchor" type="button"> Job Name</button>
              </th>
              <th className="text-nowrap" style={{ width: '2%' }}>PROD/UAT</th>
              <th className="text-nowrap" style={{ width: '2%' }}>It Owner(s)</th>
              <th className="text-nowrap" style={{ width: '2%' }}>Live version</th>
              <th className="text-nowrap" style={{ width: '2%' }}>Risk Major Type</th>
              <th className="text-nowrap" style={{ width: '2%' }}>Currency Workflow</th>
              <th className="text-nowrap" style={{ width: '2%' }}>Target workflow</th>
              <th className="text-nowrap" style={{ width: '2%' }}>Atlas</th>
              <th className="text-nowrap" style={{ width: '2%' }}>Comments</th>
              <th className="text-nowrap" style={{ width: '2%' }}>Scorch Job Context</th>
              <th className="text-nowrap" style={{ width: '2%' }}>Problem description</th>
              <th className="text-nowrap" style={{ width: '2%' }}>Problem description source</th>
              <th className="text-nowrap" style={{ width: '2%' }}>Curve</th>
              <th className="text-nowrap" style={{ width: '2%' }}>PDP</th>
              <th className="text-nowrap" style={{ width: '2%' }}>Scope</th>
              <th className="text-nowrap" style={{ width: '2%' }}>Consumer</th>
              <th className="text-nowrap" style={{ width: '2%' }}>Manifest</th>
              <th className="text-nowrap" style={{ width: '2%' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {$quantAqsCoverageRows}
          </tbody>
        </table>
      );
    }

    return (
      <div>
        <h2 className="display-4">Quant AQS Coverage</h2>
        <div className="container-fluid">
          {$filteringOptions}
        </div>
        <div className="row mb-2">
          <div className="col-9">
            <div className="row mb-2">
              {canWrite && (
                <div className="col-6">
                  {/* <Link to="/create" className="btn btn-primary btn-light-primary"> */}
                  {/*  <i className="fa fa-fw fa-plus" /> Add A New Coverage */}
                  {/* </Link> */}
                </div>
              )}
            </div>
            <div>
              {$quantAqsCoverageListTable}
            </div>
            <Paginator page={quantAqsCoveragePage} onClickPage={this.onClickPage} />
          </div>
        </div>
        {$deleteModal}
      </div>
    );
  }
}

QuantAqsCoverageList.ASC = 'asc';
QuantAqsCoverageList.DESC = 'desc';

QuantAqsCoverageList.propTypes = {
  history: RouterPropTypes.history().isRequired,
  location: RouterPropTypes.location().isRequired,
  currentUser: ScorchPropTypes.currentUser().isRequired,
};

export default withCurrentUser(QuantAqsCoverageList);
