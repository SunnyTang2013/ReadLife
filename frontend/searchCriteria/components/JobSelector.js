import React from 'react';
import PropTypes from 'prop-types';
import { cloneDeep } from 'lodash';

import ScorchPropTypes from '../../proptypes/scorch';

export default class JobSelector extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedOriginalJobList: [],
      runJobList: cloneDeep(this.props.runJobList),
      selectedRemoveJobList: [],
      filterOriginalJob: '',
      filterRunJob: '',
    };
    this.onAddJobToRunList = this.onAddJobToRunList.bind(this);
    this.onSelectOriginalJobs = this.onSelectOriginalJobs.bind(this);
    this.onSelectRunJobs = this.onSelectRunJobs.bind(this);
    this.onRemoveJobs = this.onRemoveJobs.bind(this);
    this.onFilterRunJob = this.onFilterRunJob.bind(this);
    this.onFilterOriginalJob = this.onFilterOriginalJob.bind(this);
  }

  onAddJobToRunList() {
    const { originalJobList } = this.props;
    const selectedOriginalJobList = cloneDeep(this.state.selectedOriginalJobList);
    const runJobList = cloneDeep(this.state.runJobList).filter(job => {
      for (let i = 0; i < selectedOriginalJobList.length; i++) {
        if (selectedOriginalJobList[i].id === job.id) {
          return false;
        }
      }
      return true;
    });
    const newRunJobList = runJobList.concat(selectedOriginalJobList);

    const newOriginalJobList = originalJobList.filter(job => {
      for (let i = 0; i < selectedOriginalJobList.length; i++) {
        const selectedOriginalJob = selectedOriginalJobList[i];
        if (selectedOriginalJob.id === job.id) {
          return false;
        }
      }
      return true;
    });

    this.setState({ runJobList: newRunJobList, selectedOriginalJobList: [] },
      () => this.props.onAddJobToRunList(newRunJobList, newOriginalJobList));
  }

  onSelectOriginalJobs() {
    const options = document.querySelector('#original-job-list').options;

    const { originalJobList } = this.props;
    const selectedOriginalJobList = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        const optionValue = Number(options[i].value);
        if (!Number.isNaN(optionValue) && optionValue > 0) {
          const addJob = originalJobList.find(job => job.id === optionValue);
          selectedOriginalJobList.push(addJob);
        }
      }
    }

    this.setState({ selectedOriginalJobList });
  }

  onSelectRunJobs() {
    const runJobOptions = document.querySelector('#run-job-list').options;

    this.setState((prevState) => {
      const { runJobList } = prevState;
      const selectedRemoveJobList = [];
      for (let i = 0; i < runJobOptions.length; i++) {
        if (runJobOptions[i].selected) {
          const optionValue = Number(runJobOptions[i].value);
          if (!Number.isNaN(optionValue) && optionValue > 0) {
            const removeJob = runJobList.find(job => job.id === optionValue);
            selectedRemoveJobList.push(removeJob);
          }
        }
      }
      return { selectedRemoveJobList };
    });
  }

  onRemoveJobs() {
    const { runJobList, selectedRemoveJobList } = this.state;
    const newRunJobList = runJobList.filter(runJob => {
      for (let i = 0; i < selectedRemoveJobList.length; i++) {
        const selectedRemoveJob = selectedRemoveJobList[i];
        if (selectedRemoveJob.id === runJob.id) {
          return false;
        }
      }
      return true;
    });

    const { originalJobList } = this.props;
    const newOriginalJobList = cloneDeep(originalJobList).concat(selectedRemoveJobList);
    this.setState({ runJobList: newRunJobList, selectedRemoveJobList: [] },
      () => this.props.onAddJobToRunList(newRunJobList, newOriginalJobList));
  }

  onFilterRunJob(event) {
    this.setState({
      filterRunJob: event.target.value,
    });
  }

  onFilterOriginalJob(event) {
    this.setState({
      filterOriginalJob: event.target.value,
    });
  }

  render() {
    const { runJobList, filterOriginalJob, filterRunJob } = this.state;
    const { originalJobList, loading } = this.props;

    let $originalJobOptions = null;
    if (!loading) {
      let originalFilterJobList = null;
      if (filterOriginalJob) {
        originalFilterJobList = originalJobList.filter(
          job => {
            const lowerJobName = job.name.trim().toLowerCase();
            const lowerFilterOriginalJobName = filterOriginalJob.trim().toLowerCase();
            return lowerJobName.indexOf(lowerFilterOriginalJobName) > -1;
          },
        );
      } else {
        originalFilterJobList = originalJobList;
      }
      $originalJobOptions = originalFilterJobList.map((job, i) => (
        <option value={job.id} key={job.id}>{i + 1} : {job.name}</option>
      ));
    }

    let runFilterJobList = null;
    if (filterRunJob) {
      runFilterJobList = runJobList.filter(
        job => {
          const lowerJobName = job.name.trim().toLowerCase();
          const lowerFilterRunJobName = filterRunJob.trim().toLowerCase();
          return lowerJobName.indexOf(lowerFilterRunJobName) > -1;
        },
      );
    } else {
      runFilterJobList = runJobList;
    }
    const $runJobList = runFilterJobList.map((job) => (
      <option value={job.id} key={job.id}>{job.name}</option>
    ));


    return (
      <div className="card">
        <div className="card-body">
          <div className="row">
            <div className="form-group col-5">
              <label htmlFor="job-list-selection">
                Original Job List
                {
                  loading && <i className="fa fa-fw fa-spinner fa-spin ml-2" />
                }
              </label>
              <input
                type="text"
                className="form-control multi-search"
                placeholder="Search ..."
                id="search-original-job"
                value={filterOriginalJob}
                onChange={this.onFilterOriginalJob}
              />
              <select
                multiple
                id="original-job-list"
                className="form-control custom-select multi-select"
                onChange={this.onSelectOriginalJobs}
              >
                {$originalJobOptions}
              </select>
            </div>

            <div className="form-group col-1 text-center add-job-to-list-btn">
              <div>
                <button className="btn btn-outline-primary" type="button" onClick={this.onAddJobToRunList}>
                  Add <i className="fa fa-fw fa-chevron-right" />
                </button>
              </div>
              <div style={{ paddingTop: '10px' }}>
                <button className="btn btn-outline-primary" type="button" onClick={this.onRemoveJobs}>
                  <i className="fa fa-fw fa-chevron-left" /> Del
                </button>
              </div>
            </div>

            <div className="form-group col-5">
              <label htmlFor="exampleSelect2">
                Run Job List
                (<span className="ml-2 text-muted mr-2">Total <strong>{runJobList.length}</strong> Jobs</span>)
              </label>
              <input
                type="text"
                className="form-control multi-search"
                placeholder="Search ..."
                id="search-run-job"
                value={filterRunJob}
                onChange={this.onFilterRunJob}
              />
              <select
                multiple
                id="run-job-list"
                className="form-control custom-select multi-select"
                onChange={this.onSelectRunJobs}
              >
                {$runJobList}
              </select>
            </div>

          </div>
        </div>
      </div>
    );
  }
}

JobSelector.propTypes = {
  originalJobList: PropTypes.arrayOf(ScorchPropTypes.jobPlainInfo()).isRequired,
  runJobList: PropTypes.arrayOf(ScorchPropTypes.jobPlainInfo()).isRequired,
  loading: PropTypes.bool.isRequired,
  onAddJobToRunList: PropTypes.func.isRequired,
};
