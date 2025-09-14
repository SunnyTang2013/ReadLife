import React from 'react';
import PropTypes from 'prop-types';

import ErrorAlert from '../../components/ErrorAlert';
import StaticModal from '../../components/StaticModal';
import { getAssignmentGroupFromLocalStorage } from '../../utils/utilities';


export default class AssignmentGroupChooseModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isModalOpen: true,
      assignmentGroupOnScorchRequest: 'GDM',
      error: null,
    };
    this.onClose = this.onClose.bind(this);
    this.onGdm = this.onGdm.bind(this);
    this.onMkty = this.onMkty.bind(this);
  }

  componentDidMount() {
    this._groupCheck();
  }

  onClose() {
    const { assignmentGroupOnScorchRequest } = this.state;
    if (!assignmentGroupOnScorchRequest || assignmentGroupOnScorchRequest === '') {
      localStorage.setItem('assignmentGroupOnScorchRequest', 'GDM');
    } else {
      localStorage.setItem('assignmentGroupOnScorchRequest', assignmentGroupOnScorchRequest);
    }
    this.setState({ isModalOpen: false }, () => this.props.onClose(false));
  }

  onGdm() {
    this.setState({ assignmentGroupOnScorchRequest: 'GDM' });
  }

  onMkty() {
    this.setState({ assignmentGroupOnScorchRequest: 'MKTY' });
  }

  _groupCheck() {
    let assignmentGroupOnScorchRequest = getAssignmentGroupFromLocalStorage();
    if (assignmentGroupOnScorchRequest !== 'MKTY') {
      assignmentGroupOnScorchRequest = 'GDM';
    }
    this.setState({ assignmentGroupOnScorchRequest });
  }


  render() {
    const {
      isModalOpen,
      assignmentGroupOnScorchRequest,
      error,
    } = this.state;

    const badge = (
      <span className="badge badge-success ml-2">
        <i className="fa fa-check-circle-o fa-2x" />
      </span>
    );


    const $content = (
      <div>
        <button 
          type="button"
          className="btn btn-lg btn-primary position-relative mr-2"
          onClick={this.onGdm}
        >
          GDM
          {assignmentGroupOnScorchRequest === 'GDM' && badge}
        </button>
        <button 
          type="button" 
          className="btn btn-lg btn-primary position-relative mr-2" 
          onClick={this.onMkty}
        >
          MKTY
          {assignmentGroupOnScorchRequest === 'MKTY' && badge}
        </button>
      </div>
    );

    return (
      <StaticModal isOpen={isModalOpen}>
        <h2 className="lighter">Choose Your Monitoring Group</h2>
        <ErrorAlert error={error} />
        {$content}
        <hr />
        <p>
          You can choose it at anytime in <strong>Filtering Options</strong>.
        </p>
        <div className="form-group pull-right">
          <button 
            className="btn btn-default"
            type="button"
            onClick={this.onClose}
          >
            Done
          </button>
        </div>
      </StaticModal>
    );
  }
}


AssignmentGroupChooseModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};
