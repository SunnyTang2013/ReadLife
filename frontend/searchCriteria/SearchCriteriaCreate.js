import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

import searchCriteriaService from '../backend/searchCriteriaService';
import RouterPropTypes from '../proptypes/router';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';

import SearchCriteriaDetailForm from './components/SearchCriteriaDetailForm';


class SearchCriteriaCreate extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      searchCriteriaDetail: null,
      isSaving: false,
      saveError: null,
    };
    this.onSave = this.onSave.bind(this);
    this.onCancel = this.onCancel.bind(this);
  }

  componentDidMount() {
    this._loadSearchCriteria();
  }

  onSave(searchCriteria) {
    this.setState({ isSaving: true }, () => {
      searchCriteriaService.createSearchCriteria(searchCriteria)
        .then((searchCriteriaDetail) => {
          this.props.history.replace(`/detail/${searchCriteriaDetail.id}`);
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

  get searchCriteriaId() {
    return this.props.match.params.criteriaId;
  }

  _loadSearchCriteria() {
    if (!this.searchCriteriaId) {
      this.setState({
        searchCriteriaDetail: {
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

    searchCriteriaService.getSearchCriteriaDetail(this.searchCriteriaId)
      .then((fromSearchCriteria) => {
        this.setState({
          searchCriteriaDetail: Object.assign({}, fromSearchCriteria, {
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
          searchCriteriaDetail: error,
          isSaving: false,
          saveError: null,
        });
      });
  }

  render() {
    const { searchCriteriaDetail, isSaving, saveError } = this.state;

    if (searchCriteriaDetail === null) {
      return <LoadingIndicator />;
    }
    if (searchCriteriaDetail instanceof Error) {
      return <ErrorAlert error={searchCriteriaDetail} />;
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
        <SearchCriteriaDetailForm
          searchCriteriaDetail={searchCriteriaDetail}
          onSave={this.onSave}
          onCancel={this.onCancel}
          disabled={isSaving}
        />
      </div>
    );
  }
}

SearchCriteriaCreate.propTypes = {
  history: RouterPropTypes.history().isRequired,
  match: RouterPropTypes.match({ criteriaId: PropTypes.string }).isRequired,
};

export default SearchCriteriaCreate;
