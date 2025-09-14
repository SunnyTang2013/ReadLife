import React from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import { cloneDeep } from 'lodash';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import CreatableSelect from 'react-select/creatable';
import jobExecution from '../../backend/jobExecution';

function SComparatorOptions() {
  return PropTypes.shape({
    outputTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
    dbs: PropTypes.arrayOf(PropTypes.string).isRequired,
    cobDate: PropTypes.string.isRequired,
    nextDate: PropTypes.string.isRequired,
    sourceApps: PropTypes.arrayOf(PropTypes.string).isRequired,
    destApps: PropTypes.arrayOf(PropTypes.string).isRequired,
    caracApp: PropTypes.string.isRequired,
    tolerance: PropTypes.number.isRequired,
    expressionCcy: PropTypes.string.isRequired,
    measures: PropTypes.arrayOf(PropTypes.string).isRequired,
    locations: PropTypes.arrayOf(PropTypes.string).isRequired,
    cvids: PropTypes.arrayOf(PropTypes.string).isRequired,
  });
}

export default class RunSComparatorModal extends React.Component {
  static getDefaultOptions(input) {
    return {
      db: input.dbs.length > 0 ? input.dbs[0] : '',
      cobDate: new Date(input.cobDate),
      nextDate: new Date(input.nextDate),
      caracApp: input.caracApp,
      tolerance: input.tolerance,
      expressionCcy: input.expressionCcy,
      outputType: input.outputTypes.length > 0 ? input.outputTypes[0] : '',
      sourceApp: input.sourceApps.length > 0 ? input.sourceApps[0] : '',
      destApp: input.destApps.length > 0 ? input.destApps[0] : '',
      measures: [], // don't set any measure by default
      cvids: input.cvids,
      locations: input.locations,
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      options: RunSComparatorModal.getDefaultOptions(this.props.input),
      isModalOpen: true,
      isSubmitting: false,
    };
    this.onClose = this.onClose.bind(this);
    this.onCompare = this.onCompare.bind(this);
    this.onChangeDatabase = this.onChangeDatabase.bind(this);
    this.onChangeCOBDate = this.onChangeCOBDate.bind(this);
    this.onChangeNextDate = this.onChangeNextDate.bind(this);
    this.onChangeCaracApp = this.onChangeCaracApp.bind(this);
    this.onChangeToleranceLevel = this.onChangeToleranceLevel.bind(this);
    this.onChangeExpressionCCY = this.onChangeExpressionCCY.bind(this);
    this.onChangeReportType = this.onChangeReportType.bind(this);
    this.onChangeSourceApp = this.onChangeSourceApp.bind(this);
    this.onChangeDestinationApp = this.onChangeDestinationApp.bind(this);
    this.onChangeMeasures = this.onChangeMeasures.bind(this);
    this.onChangeCurveIds = this.onChangeCurveIds.bind(this);
    this.onChangeLocation = this.onChangeLocation.bind(this);
  }

  onClose() {
    this.setState({ isModalOpen: false }, () => this.props.onClose());
  }

  onCompare() {
    const options = cloneDeep(this.state.options);
    const min = 60 * 1000;
    const cobTimeStamp = options.cobDate.getTime() - options.cobDate.getTimezoneOffset() * min;
    const nextTimeStamp = options.nextDate.getTime() - options.nextDate.getTimezoneOffset() * min;
    options.cobDate = new Date(cobTimeStamp).toISOString();
    options.nextDate = new Date(nextTimeStamp).toISOString();
    options.sourceApp = options.sourceApp.map(sourceApp => sourceApp.value);
    options.destApp = options.destApp.map(destApp => destApp.value);
    jobExecution.runSComparatorAsJobRequest(options).then(jobRequest => {
      this.setState({ isModalOpen: false, isSubmitting: true }, () => this.props.onComplete());
      window.location.href = `/frontend/monitoring/job-request/detail/${jobRequest.id}`;
    }).catch(error => {
      toast.error(`fail to run SComparator as a job: ${error}`);
      this.setState({ isModalOpen: false }, () => this.props.onClose());
    });
  }

  onChangeDatabase(event) {
    const db = event.target.value;
    this.setState((prevState) => {
      const options = prevState.options;
      options.db = db;
      return { options };
    });
  }

  onChangeCOBDate(cobDate) {
    this.setState((prevState) => {
      const options = prevState.options;
      options.cobDate = cobDate;
      return { options };
    });
  }

  onChangeNextDate(nextDate) {
    this.setState((prevState) => {
      const options = prevState.options;
      options.nextDate = nextDate;
      return { options };
    });
  }

  onChangeCaracApp(event) {
    const caracApp = event.target.value;
    this.setState((prevState) => {
      const options = prevState.options;
      options.caracApp = caracApp;
      return { options };
    });
  }

  onChangeToleranceLevel(event) {
    const tolerance = event.target.value;
    this.setState((prevState) => {
      const options = prevState.options;
      options.tolerance = tolerance;
      return { options };
    });
  }

  onChangeExpressionCCY(event) {
    const expressionCcy = event.target.value;
    this.setState((prevState) => {
      const options = prevState.options;
      options.expressionCcy = expressionCcy;
      return { options };
    });
  }

  onChangeReportType(event) {
    const outputType = event.target.value;
    this.setState((prevState) => {
      const options = prevState.options;
      options.outputType = outputType;
      return { options };
    });
  }

  onChangeSourceApp(value) {
    this.setState((prevState) => {
      const options = prevState.options;
      options.sourceApp = value;
      return { options };
    });
  }

  onChangeDestinationApp(value) {
    this.setState((prevState) => {
      const options = prevState.options;
      options.destApp = value;
      return { options };
    });
  }

  onChangeMeasures(event) {
    const measures = [];
    Array.from(event.target.selectedOptions, option => measures.push(option.value));
    this.setState((prevState) => {
      const options = prevState.options;
      options.measures = measures;
      return { options };
    });
  }

  onChangeCurveIds(event) {
    const cvids = [];
    Array.from(event.target.selectedOptions, option => cvids.push(option.value));
    this.setState((prevState) => {
      const options = prevState.options;
      options.cvids = cvids;
      return { options };
    });
  }

  onChangeLocation(event) {
    const locations = [];
    Array.from(event.target.selectedOptions, option => locations.push(option.value));
    this.setState((prevState) => {
      const options = prevState.options;
      options.locations = locations;
      return { options };
    });
  }

  render() {
    const { options, isModalOpen, isSubmitting } = this.state;
    const { input } = this.props;
    const $dbs = input.dbs.map(db => (
      <option key={db} value={db}>
        {db}
      </option>
    ));
    const $reportTypes = input.outputTypes.map(reportType => (
      <option key={reportType} value={reportType}>
        {reportType}
      </option>
    ));
    const sourceApps = input.sourceApps.map(sourceApp => (
      { value: sourceApp, label: sourceApp }
    ));
    const destApps = input.destApps.map(destApp => (
      { value: destApp, label: destApp }
    ));
    const $measures = input.measures.sort().map(measure => (
      <option key={measure} value={measure}>
        {measure}
      </option>
    ));
    const $locations = input.locations.map(location => (
      <option key={location} value={location}>
        {location}
      </option>
    ));
    const $cvids = input.cvids.map(curveId => (
      <option key={curveId} value={curveId}>
        {curveId}
      </option>
    ));

    if (!isModalOpen) {
      return <div style={{ display: 'none' }} />;
    }

    return (
      <div className="overlayStyle">
        <div className="modal show modalStyle" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-body">
                <h2 className="lighter">Run SComparator</h2>
                <div className="card">
                  <form className="card-body">
                    <div className="row">
                      <div className="col-4">
                        <label htmlFor="SComparator-Database">Database</label>
                      </div>
                      <div className="col-8">
                        <div className="form-group">
                          <select
                            id="SComparator-Database"
                            className="form-control"
                            value={options.db}
                            onChange={event => this.onChangeDatabase(event)}
                          >
                            {$dbs}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-4">
                        <label htmlFor="SComparator-COBDate">COB Date</label>
                      </div>
                      <div className="col-8">
                        <div className="form-group">
                          <DatePicker
                            id="SComparator-COBDate"
                            className="form-control"
                            selected={options.cobDate}
                            onChange={selected => this.onChangeCOBDate(selected)}
                            dateFormat="yyyy-MM-dd"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-4">
                        <label htmlFor="SComparator-NextDate">Next Date</label>
                      </div>
                      <div className="col-8">
                        <div className="form-group">
                          <DatePicker
                            id="SComparator-NextDate"
                            className="form-control"
                            selected={options.nextDate}
                            onChange={selected => this.onChangeNextDate(selected)}
                            dateFormat="yyyy-MM-dd"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-4">
                        <label htmlFor="SComparator-CaracsApp">Caracs Application</label>
                      </div>
                      <div className="col-8">
                        <div className="form-group">
                          <input
                            id="SComparator-CaracsApp"
                            className="form-control"
                            type="text"
                            value={options.caracApp}
                            onChange={event => this.onChangeCaracApp(event)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-4">
                        <label htmlFor="SComparator-Tolerance">Tolerance Level</label>
                      </div>
                      <div className="col-8">
                        <div className="form-group">
                          <input
                            id="SComparator-Tolerance"
                            className="form-control"
                            type="number"
                            value={options.tolerance}
                            onChange={event => this.onChangeToleranceLevel(event)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-4">
                        <label htmlFor="SComparator-ExpressionCCY">Expression CCY</label>
                      </div>
                      <div className="col-8">
                        <div className="form-group">
                          <input
                            id="SComparator-ExpressionCCY"
                            className="form-control"
                            type="text"
                            value={options.expressionCcy}
                            onChange={event => this.onChangeExpressionCCY(event)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-4">
                        <label htmlFor="SComparator-ReportType">Report Type</label>
                      </div>
                      <div className="col-8">
                        <div className="form-group">
                          <select
                            id="SComparator-ReportType"
                            className="form-control"
                            value={options.outputTypes}
                            onChange={event => this.onChangeReportType(event)}
                          >
                            {$reportTypes}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-4">
                        <label htmlFor="SComparator-SourceApp">Source App</label>
                      </div>
                      <div className="col-8">
                        <div className="form-group">
                          <CreatableSelect
                            isMulti
                            id="SComparator-SourceApp"
                            defaultValue={options[0]}
                            isClearable
                            isSearchable
                            value={options.sourceApp}
                            onChange={value => this.onChangeSourceApp(value)}
                            options={sourceApps}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-4">
                        <label htmlFor="SComparator-DestinationApp">Destination App</label>
                      </div>
                      <div className="col-8">
                        <div className="form-group">
                          <CreatableSelect
                            isMulti
                            id="SComparator-DestinationApp"
                            defaultValue={options[0]}
                            isClearable
                            isSearchable
                            value={options.destApp}
                            onChange={value => this.onChangeDestinationApp(value)}
                            options={destApps}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-4">
                        <div className="form-group">
                          <label htmlFor="SComparator-Measures">Measures</label>
                          <select
                            multiple
                            id="SComparator-Measures"
                            className="form-control"
                            value={options.measures}
                            onChange={event => this.onChangeMeasures(event)}
                          >
                            {$measures}
                          </select>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="form-group">
                          <label htmlFor="SComparator-CurveIds">Curve ID</label>
                          <select
                            multiple
                            id="SComparator-CurveIds"
                            className="form-control"
                            value={options.cvids}
                            onChange={event => this.onChangeCurveIds(event)}
                          >
                            {$cvids}
                          </select>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="form-group">
                          <label htmlFor="SComparator-Location">Location</label>
                          <select
                            multiple
                            id="SComparator-Location"
                            className="form-control"
                            value={options.locations}
                            onChange={event => this.onChangeLocation(event)}
                          >
                            {$locations}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="form-group">
                      <button className="btn btn-primary mr-2" type="button" disabled={isSubmitting} onClick={this.onCompare}>
                        { isSubmitting && <i className="fa fa-spin fa-spinner mr-1" /> } Compare
                      </button>
                      <button className="btn btn-secondary" type="button" onClick={this.onClose}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

RunSComparatorModal.propTypes = {
  input: SComparatorOptions().isRequired,
  onClose: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
};
