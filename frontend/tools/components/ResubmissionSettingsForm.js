import React from 'react';
import PropTypes from 'prop-types';
import { cloneDeep } from 'lodash';

import ScorchPropTypes from '../../proptypes/scorch';
import RulesTable from '../../components/RulesTable';


export default class ResubmissionSettingsForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      settings: this.props.data,
    };
    this.onChangeProperty = this.onChangeProperty.bind(this);
    this.onChangeRules = this.onChangeRules.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onCancel = this.onCancel.bind(this);
  }

  onChangeProperty(name, event, isNumber) {
    const value = event.target.value;
    this.setState((prevState) => {
      const settings = cloneDeep(prevState.settings);
      if (isNumber && typeof value === 'string') {
        settings[name] = parseInt(value, 10);
      } else {
        settings[name] = value;
      }
      return { settings };
    });
  }

  onChangeRules(rules) {
    this.setState((prevState) => {
      const settings = Object.assign({}, prevState.settings, { rules });
      return { settings };
    });
  }

  onSave(event) {
    event.preventDefault();

    const settings = cloneDeep(this.state.settings);
    this.props.onSave(settings);
  }

  onCancel() {
    this.props.onCancel();
  }

  render() {
    const { settings } = this.state;
    return (
      <form className="my-2">
        <fieldset disabled={this.props.disabled}>
          <section>
            <h3 className="display-6">Basic Information</h3>
            <div className="row">
              <div className="col">
                <div className="form-group">
                  <label htmlFor="job-config-group-name">Max Retry Times</label>
                  <input
                    id="job-config-group-name"
                    className="form-control"
                    type="number"
                    value={settings.maxRetry || 1}
                    onChange={event => this.onChangeProperty('maxRetry', event, true)}
                  />
                </div>
              </div>
              <div className="col">
                <div className="form-group">
                  <label htmlFor="job-config-group-name">Run Delay Minutes</label>
                  <input
                    id="job-config-group-name"
                    className="form-control"
                    type="number"
                    value={settings.retryDelayMin || 1}
                    onChange={event => this.onChangeProperty('retryDelayMin', event, true)}
                  />
                </div>
              </div>
              <div className="col">
                <div className="form-group">
                  <label htmlFor="job-config-group-category">Enable</label>
                  <select
                    id="job-config-group-category"
                    className="form-control"
                    value={settings.enable || 'Y'}
                    onChange={event => this.onChangeProperty('enable', event)}
                  >
                    <option value="Y">Yes</option>
                    <option value="N">No</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="display-6">Rules</h3>
            <RulesTable
              rules={settings.rules || []}
              onChange={this.onChangeRules}
            />
          </section>

          <div className="form-group">
            <ul className="list-inline">
              <li className="list-inline-item">
                <button className="btn btn-primary" type="button" onClick={event => this.onSave(event)}>
                  Save
                </button>
              </li>
              <li className="list-inline-item">
                <button className="btn btn-secondary" type="button" onClick={this.onCancel}>
                  Cancel
                </button>
              </li>
            </ul>
          </div>

        </fieldset>
      </form>
    );
  }
}

ResubmissionSettingsForm.propTypes = {
  data: ScorchPropTypes.resubmissionSetting().isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

ResubmissionSettingsForm.defaultProps = {
  disabled: false,
};
