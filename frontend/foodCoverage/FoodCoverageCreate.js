import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

import quantAqsCoverageService from '../backend/quantAqsCoverageService';
import RouterPropTypes from '../proptypes/router';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';

import QuantAqsCoverageDetailForm from './components/QuantAqsCoverageDetailForm';


class QuantAqsCoverageCreate extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      quantAqsCoverageDetail: null,
      isSaving: false,
      saveError: null,
    };
    this.onSave = this.onSave.bind(this);
    this.onCancel = this.onCancel.bind(this);
  }

  componentDidMount() {
    this._loadQuantAqsCoverage();
  }

  onSave(quantAqsCoverage) {
    this.setState({ isSaving: true }, () => {
      quantAqsCoverageService.createQuantAqsCoverage(quantAqsCoverage)
        .then((quantAqsCoverageDetail) => {
          this.props.history.replace(`/detail/${quantAqsCoverageDetail.id}`);
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
    this.props.history.push('/list');
  }

  get quantAqsCoverageId() {
    return this.props.match.params.criteriaId;
  }

  _loadQuantAqsCoverage() {
    if (!this.quantAqsCoverageId) {
      this.setState({
        quantAqsCoverageDetail: {
          id: null,
          name: '',
          jobName: '',
          location: '',
          description: '',
          parameters: {
            entries: {},
          },
        },
        isSaving: false,
        saveError: null,
      });
      return;
    }

    quantAqsCoverageService.getQuantAqsCoverageDetail(this.quantAqsCoverageId)
      .then((fromQuantAqsCoverage) => {
        this.setState({
          quantAqsCoverageDetail: Object.assign({}, fromQuantAqsCoverage, {
            id: null,
            name: '',
            lastUpdatedBy: null,
            updateTime: null,
          }),
          isSaving: false,
          saveError: null,
        });
      })
      .catch((error) => {
        this.setState({
          quantAqsCoverageDetail: error,
          isSaving: false,
          saveError: null,
        });
      });
  }

  render() {
    const { quantAqsCoverageDetail, isSaving, saveError } = this.state;

    if (quantAqsCoverageDetail === null) {
      return <LoadingIndicator />;
    }
    if (quantAqsCoverageDetail instanceof Error) {
      return <ErrorAlert error={quantAqsCoverageDetail} />;
    }

    return (
      <div className="container-fluid" style={{ maxWidth: '85%' }}>
        <nav>
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link to="/list">Search Criteria List</Link>
            </li>
            <li className="breadcrumb-item active">New Search Criteria</li>
          </ol>
        </nav>
        <h2 className="display-4">Create a New Search Criteria</h2>
        <ErrorAlert error={saveError} />
        <QuantAqsCoverageDetailForm
          quantAqsCoverageDetail={quantAqsCoverageDetail}
          onSave={this.onSave}
          onCancel={this.onCancel}
          disabled={isSaving}
        />
      </div>
    );
  }
}
QuantAqsCoverageCreate.propTypes = {
  history: RouterPropTypes.history().isRequired,
  match: RouterPropTypes.match({ criteriaId: PropTypes.string }).isRequired,
};
export default QuantAqsCoverageCreate;
