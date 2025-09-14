import React from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';
import { isEqual } from 'lodash';

import RouterPropTypes from '../proptypes/router';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';

import quantAqsCoverageService from '../backend/quantAqsCoverageService';
import QuantAqsCoverageDetailForm from './components/QuantAqsCoverageDetailForm';


class QuantAqsCoverageDetailUpdate extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      quantAqsCoverage: null,
      isSaving: false,
      saveError: null,
    };
    this.onSave = this.onSave.bind(this);
    this.onCancel = this.onCancel.bind(this);
  }

  componentDidMount() {
    this._loadQuantAqsCoverage();
  }

  componentDidUpdate(prevProps) {
    if (!isEqual(prevProps.match.params, this.props.match.params)) {
      this._loadQuantAqsCoverage();
    }
  }

  onSave(quantAqsCoverage) {
    this.setState({ isSaving: true }, () => {
      quantAqsCoverageService.updateCriteria(quantAqsCoverage)
        .then(() => {
          toast.success('Coverage is updated successfully.');
          this.props.history.replace(`/detail/${quantAqsCoverage.id}`);
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
    this.props.history.replace(`/detail/${this.quantAqsCoverageId}`);
  }

  get quantAqsCoverageId() {
    return this.props.match.params.criteriaId;
  }

  _loadQuantAqsCoverage() {
    quantAqsCoverageService.getQuantAqsCoverageDetail(this.quantAqsCoverageId)
      .then((quantAqsCoverage) => {
        this.setState({
          quantAqsCoverage: quantAqsCoverage,
          isSaving: false,
          saveError: null,
        });
      })
      .catch((error) => {
        this.setState({
          quantAqsCoverage: error,
          isSaving: false,
          saveError: null,
        });
      });
  }

  render() {
    const { quantAqsCoverage, isSaving, saveError } = this.state;

    if (quantAqsCoverage === null) {
      return <LoadingIndicator />;
    }
    if (quantAqsCoverage instanceof Error) {
      return <ErrorAlert error={quantAqsCoverage} />;
    }

    return (
      <div className="container-fluid" style={{ maxWidth: '85%' }}>
        <nav>
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link to="/list">Search Criteria List</Link>
            </li>
            <li className="breadcrumb-item active">{quantAqsCoverage.name}</li>
          </ol>
        </nav>
        <h2 className="display-4">Update: {quantAqsCoverage.name}</h2>
        <ErrorAlert error={saveError} />
        <QuantAqsCoverageDetailForm
          quantAqsCoverageDetail={quantAqsCoverage}
          onSave={this.onSave}
          onCancel={this.onCancel}
          disabled={isSaving}
        />
      </div>
    );
  }
}
QuantAqsCoverageDetailUpdate.propTypes = {
  history: RouterPropTypes.history().isRequired,
  match: RouterPropTypes.match({ criteriaId: PropTypes.string.isRequired }).isRequired,
};

export default QuantAqsCoverageDetailUpdate;
