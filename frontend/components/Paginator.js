import React from 'react';
import PropTypes from 'prop-types';

import ScorchPropTypes from '../proptypes/scorch';


export default function Paginator({ page, onClickPage }) {
  if (!page) {
    // Do not return null to suppress warning:
    // Primitive value returned from constructor will be lost when called with new.
    return <div />;
  }

  const $info = (
    <div className="text-muted">
      Total {page.totalPages} pages and {page.totalElements} items
      / Showing {page.numberOfElements} items per page
    </div>
  );

  let $pageLinksContainer = null;
  // Show page links only if there are multiple pages.
  if (!page.first || !page.last) {
    const minPageNumber = Math.max(0, page.number - 5);
    const maxPageNumber = Math.min(page.totalPages - 1, page.number + 5);
    const pageNumbers = [];
    for (let i = minPageNumber; i <= maxPageNumber; i++) {
      pageNumbers.push(i);
    }

    const $pageLinks = pageNumbers.map((pageNumber) => {
      const buttonClassName = (pageNumber === page.number ? 'btn btn-primary' : 'btn btn-outline-primary');
      return (
        <button
          key={`page-${pageNumber}`}
          className={buttonClassName}
          type="button"
          onClick={() => onClickPage(pageNumber)}
        >
          {pageNumber}
        </button>
      );
    });

    $pageLinksContainer = (
      <div className="mb-2 btn-toolbar justify-content-center" role="toolbar">
        <div className="btn-group mr-2" role="group">
          <button className="btn btn-outline-primary" type="button" onClick={() => onClickPage(0)}>
            &lt;&lt; First
          </button>
        </div>
        <div className="btn-group" role="group">
          {$pageLinks}
        </div>
        <div className="btn-group ml-2" role="group">
          <button className="btn btn-outline-primary" type="button" onClick={() => onClickPage(page.totalPages - 1)}>
            Last &gt;&gt;
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 text-center">
      {$pageLinksContainer}
      {$info}
    </div>
  );
}

Paginator.propTypes = {
  page: ScorchPropTypes.page(),
  onClickPage: PropTypes.func.isRequired,
};

Paginator.defaultProps = {
  page: null,
};
