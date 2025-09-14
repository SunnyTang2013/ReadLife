import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div>
      <div className="spacer-top"> </div>
      <h2 className="display-4">Tools</h2>
      <div className="row my-4">
        <div className="col-12 col-sm-4 col-md-3 col-xl-2 text-center">
          <Link className="app-link" to="/diff">
            <i className="app-link-icon cyan fa fa-fw fa-binoculars" />
            <span className="app-link-title">Diff Tools</span>
          </Link>
        </div>
        <div className="col-12 col-sm-4 col-md-3 col-xl-2 text-center">
          <Link className="app-link" to="/resubmission-settings">
            <i className="app-link-icon cyan fa fa-fw fa-cogs" />
            <span className="app-link-title">Resubmission Settings</span>
          </Link>
        </div>
        <div className="col-12 col-sm-4 col-md-3 col-xl-2 text-center">
          <Link className="app-link" to="/generate-mask-json">
            <i className="app-link-icon cyan fa fa-fw fa-align-left" />
            <span className="app-link-title">Override Instructions JSON</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
