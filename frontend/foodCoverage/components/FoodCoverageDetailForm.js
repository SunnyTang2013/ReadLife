import React from 'react';
import PropTypes from 'prop-types';
import { cloneDeep } from 'lodash';

import ScorchPropTypes from '../../proptypes/scorch';
import ParametersTable from '../../components/ParametersTable';
import { getLocationRegionList } from '../../utils/constants';
import LoadingIndicator from '../../components/LoadingIndicator';
import JobListTable from './JobListTable';
import Paginator from '../../components/Paginator';
import { convertParametersToString } from '../utils';
import quantAqsCoverageService from '../../backend/quantAqsCoverageService';

export default class QuantAqsCoverageDetailForm extends React.Component {
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
    this.state = {
      input: cloneDeep(props.quantAqsCoverageDetail),
      openJobListPanel: false,
      jobPage: null,
      loadingJobs: false,
    };
    this.onChangeProperty = this.onChangeProperty.bind(this);
    this.onChangeParameters = this.onChangeParameters.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.onRunSearch = this.onRunSearch.bind(this);
    this.onClickPage = this.onClickPage.bind(this);
  }

  onChangeProperty(name, event) {
    const value = event.target.value;
    this.setState((prevState) => {
      const input = cloneDeep(prevState.input);
      input[name] = value;
      return { input };
    });
  }

  onChangeParameters(parameters) {
    this.setState((prevState) => {
      const input = Object.assign({}, prevState.input, { parameters });
      return { input };
    });
  }

  onSave(event) {
    event.preventDefault();
    const { input } = this.state;
    if (!input.name) {
      return;
    }
    this.props.onSave(input);
  }

  onCancel() {
    this.props.onCancel();
  }

  onRunSearch() {
    const { input } = this.state;
    if (input) {
      this.setState({ loadingJobs: true, openJobListPanel: true }, () => {
        const defaultQuery = QuantAqsCoverageDetailForm.getDefaultQuery();
        const jobContent = convertParametersToString(input.parameters);
        const overrideQuery = {
          jobName: input.jobName,
          jobContent: jobContent,
          location: input.location,
        };
        const query = Object.assign({}, defaultQuery, overrideQuery);
        quantAqsCoverageService.listJobs(query)
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
      quantAqsCoverageService.listJobs(nextQuery)
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

  render() {
    const { input, jobPage, loadingJobs, openJobListPanel } = this.state;
    const { disabled } = this.props;

    let criteriaColStyle = 'col-lg-12';
    if (openJobListPanel) {
      criteriaColStyle = 'col-lg-7';
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

    const $locationOptions = getLocationRegionList().map(([location, region]) => (
      <option key={`location-${location}`} value={location}>
        {region} / {location}
      </option>
    ));

    return (
      <div className="row">
        <div className={criteriaColStyle}>
          <div className="card">
            <div className="card-body">
              <form className="my-2">
                <fieldset disabled={disabled}>
                  <section>
                    <h3 className="display-6">Basic Information</h3>
                    <div className="form-group">
                      <label htmlFor="search-criteria-name">Name</label>
                      <input
                        id="search-criteria-name"
                        className="form-control"
                        type="text"
                        value={input.name || ''}
                        onChange={event => this.onChangeProperty('name', event)}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="search-criteria-description">Description</label>
                      <input
                        id="search-criteria-description"
                        className="form-control"
                        type="text"
                        value={input.description || ''}
                        onChange={event => this.onChangeProperty('description', event)}
                      />
                    </div>
                  </section>

                  <h3 className="display-6">Definition</h3>
                  <hr />

                  <section>
                    <div className="row">
                      <div className="col-8">
                        <div className="form-group">
                          <label htmlFor="job-name">Job Name Contains</label>
                          <input
                            id="job-name"
                            className="form-control"
                            type="text"
                            value={input.jobName || ''}
                            onChange={event => this.onChangeProperty('jobName', event)}
                          />
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="form-group">
                          <label htmlFor="location">Location</label>
                          <select
                            id="location"
                            className="form-control"
                            value={input.location || ''}
                            onChange={event => this.onChangeProperty('location', event)}
                          >
                            <option value="">----</option>
                            {$locationOptions}
                          </select>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="display-6">Parameters</h3>
                    <ParametersTable
                      parameters={input.parameters}
                      onChange={this.onChangeParameters}
                    />
                  </section>

                  <div className="form-group">
                    <ul className="list-inline">
                      <li className="list-inline-item">
                        <button className="btn btn-primary" type="button" onClick={this.onSave}>
                          Save
                        </button>
                      </li>
                      <li className="list-inline-item">
                        <button className="btn btn-secondary" type="button" onClick={this.onCancel}>
                          Cancel
                        </button>
                      </li>
                      <li className="list-inline-item">
                        <button className="btn btn-outline-primary" type="button" onClick={this.onRunSearch}>
                          Try It Out
                        </button>
                      </li>
                    </ul>
                  </div>

                </fieldset>
              </form>
            </div>
          </div>
        </div>
        {
          openJobListPanel && (
            <div className="col-lg-5">
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
    );
  }
}

QuantAqsCoverageDetailForm.propTypes = {
  quantAqsCoverageDetail: ScorchPropTypes.quantAqsCoverage().isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

QuantAqsCoverageDetailForm.defaultProps = {
  disabled: false,
};
