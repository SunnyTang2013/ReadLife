import React from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';
import { isEqual } from 'lodash';

import RouterPropTypes from '../proptypes/router';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';

import searchCriteriaService from '../backend/searchCriteriaService';
import SearchCriteriaDetailForm from './components/SearchCriteriaDetailForm';


class SearchCriteriaDetailUpdate extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      searchCriteria: null,
      isSaving: false,
      saveError: null,
    };
    this.onSave = this.onSave.bind(this);
    this.onCancel = this.onCancel.bind(this);
  }

  componentDidMount() {
    this._loadSearchCriteria();
  }

  componentDidUpdate(prevProps) {
    if (!isEqual(prevProps.match.params, this.props.match.params)) {
      this._loadSearchCriteria();
    }
  }

  onSave(searchCriteria) {
    this.setState({ isSaving: true }, () => {
      searchCriteriaService.updateCriteria(searchCriteria)
        .then(() => {
          toast.success('Criteria is updated successfully.');
          this.props.history.replace(`/detail/${searchCriteria.id}`);
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
    this.props.history.replace(`/detail/${this.searchCriteriaId}`);
  }

  get searchCriteriaId() {
    return this.props.match.params.criteriaId;
  }

  _loadSearchCriteria() {
    searchCriteriaService.getSearchCriteriaDetail(this.searchCriteriaId)
      .then((searchCriteria) => {
        this.setState({
          searchCriteria: searchCriteria,
          isSaving: false,
          saveError: null,
        });
      })
      .catch((error) => {
        this.setState({
          searchCriteria: error,
          isSaving: false,
          saveError: null,
        });
      });
  }

  render() {
    const { searchCriteria, isSaving, saveError } = this.state;

    if (searchCriteria === null) {
      return <LoadingIndicator />;
    }
    if (searchCriteria instanceof Error) {
      return <ErrorAlert error={searchCriteria} />;
    }

    return (
      <div className="container-fluid" style={{ maxWidth: '85%' }}>
        <nav>
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link to="/list">Search Criteria List</Link>
            </li>
            <li className="breadcrumb-item active">{searchCriteria.name}</li>
          </ol>
        </nav>
        <h2 className="display-4">Update: {searchCriteria.name}</h2>
        <ErrorAlert error={saveError} />
        <SearchCriteriaDetailForm
          searchCriteriaDetail={searchCriteria}
          onSave={this.onSave}
          onCancel={this.onCancel}
          disabled={isSaving}
        />
      </div>
    );
  }
}


SearchCriteriaDetailUpdate.propTypes = {
  history: RouterPropTypes.history().isRequired,
  match: RouterPropTypes.match({ criteriaId: PropTypes.string.isRequired }).isRequired,
};

export default SearchCriteriaDetailUpdate;
