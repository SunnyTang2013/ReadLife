import React from 'react';

import { toast } from 'react-toastify';
import resubmissionSettingsService from '../backend/resubmissionSettingsService';

import ErrorAlert from '../components/ErrorAlert';
import ResubmissionSettingsForm from './components/ResubmissionSettingsForm';
import LoadingIndicator from '../components/LoadingIndicator';
import RouterPropTypes from '../proptypes/router';


class ResubmissionSettingsEdit extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null,
      isSaving: false,
      saveError: null,
    };
    this.onSave = this.onSave.bind(this);
    this.onCancel = this.onCancel.bind(this);
  }

  componentDidMount() {
    this._loadData();
  }

  onSave(settings) {
    this.setState({ isSaving: true }, () => {
      resubmissionSettingsService.saveSettingsDetail(settings)
        .then(() => {
          toast.success('Resubmission Settings is updated successfully.');
          this.props.history.replace('/resubmission-settings');
        })
        .catch((error) => {
          this.setState({
            isSaving: false,
            saveError: error,
          });
        });
    });
  }

  onCancel() {
    this.props.history.replace('/resubmission-settings');
  }

  _loadData() {
    console.log('Loading resubmission settings ...');
    resubmissionSettingsService.getSettingsDetail().then((resp) => {
      if (resp.status === 'SUCCESS' && resp.data) {
        this.setState({
          data: resp.data.entityResult || {
            maxRetry: 3,
            retryDelayMin: 5,
            enable: 'Y',
          },
          isSaving: false,
          saveError: null,
        });
      }
    })
      .catch((error) => {
        this.setState({
          data: error,
          isSaving: false,
          saveError: null,
        });
      });
  }

  render() {
    const { data, isSaving, saveError } = this.state;

    if (data === null) {
      return <LoadingIndicator />;
    }
    if (data instanceof Error) {
      return (
        <ErrorAlert error={data} />
      );
    }

    return (
      <div>
        <h2 className="display-4">Update Request Resubmission Settings</h2>
        <ErrorAlert error={saveError} />
        <ResubmissionSettingsForm
          data={data}
          onSave={this.onSave}
          disabled={isSaving}
          onCancel={this.onCancel}
        />
      </div>
    );
  }
}

ResubmissionSettingsEdit.propTypes = {
  history: RouterPropTypes.history().isRequired,
};

export default ResubmissionSettingsEdit;
