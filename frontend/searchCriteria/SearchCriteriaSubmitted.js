import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

import monitoring from '../backend/monitoring';
import RouterPropTypes from '../proptypes/router';
import RemoteObject from '../utils/RemoteObject';

import Alert from '../components/Alert';
import LoadingIndicator from '../components/LoadingIndicator';
import RequestStatusBadge from '../components/RequestStatusBadge';


class SearchCriteriaSubmitted extends React.Component {
  constructor(props) {
    super(props);
    this.batRequestId = props.match.params.batRequestId;
    this.state = {
      batchRequest: RemoteObject.notLoaded(),
    };
  }

  componentDidMount() {
    this._loadBatchRequest();
  }

  _loadBatchRequest() {
    monitoring.getBatchRequest(this.batRequestId)
      .then((data) => {
        this.setState({
          batchRequest: RemoteObject.loaded(data),
        });
      })
      .catch((error) => {
        this.setState({
          batchRequest: RemoteObject.failed(error),
        });
      });
  }

  render() {
    const { batchRequest } = this.state;
    if (batchRequest.isNotLoaded()) {
      return <LoadingIndicator text="Loading batch request..." />;
    }
    if (batchRequest.isFailed()) {
      return <Alert type="danger" text={batchRequest.error} />;
    }

    return (
      <div>
        <nav>
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link to={`/detail/${batchRequest.data.batchId}`}>Batch #{batchRequest.data.batchId}</Link>
            </li>
            <li className="breadcrumb-item active">Batch Submitted</li>
          </ol>
        </nav>
        <h2 className="display-4">Batch Submitted</h2>
        <div className="alert alert-primary">
          <i className="fa fa-fw fa-info-circle mr-1" />
          Batch has been submitted with status:
          <span className="ml-2">
            <RequestStatusBadge status={batchRequest.data.status} />
          </span>
        </div>
        <section>
          <Link to={`/detail/${batchRequest.data.batchId}`} className="btn btn-primary mr-2">
            Return To Batch #{batchRequest.data.batchId}
          </Link>
          <a
            className="btn btn-secondary"
            href={`/frontend/monitoring/batch-request/detail/${batchRequest.data.id}`}
          >
            View Batch Request Detail
          </a>
        </section>
      </div>
    );
  }
}


SearchCriteriaSubmitted.propTypes = {
  match: RouterPropTypes.match({ batRequestId: PropTypes.string.isRequired }).isRequired,
};

export default SearchCriteriaSubmitted;
