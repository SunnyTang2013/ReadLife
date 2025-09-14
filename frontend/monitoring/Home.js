import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div>
      <h2 className="display-4">Monitoring</h2>
      <section>
        <div className="alert alert-primary">
          There should be a global dashboard...
        </div>
      </section>
      <div className="row my-4">
        <div className="col-12 col-sm-4 col-md-3 col-xl-2 text-center">
          <Link className="app-link" to="/pipeline-request/list">
            <i className="app-link-icon teal fa fa-fw fa-plug" />
            <span className="app-link-title">Pipeline Requests</span>
          </Link>
        </div>
        <div className="col-12 col-sm-4 col-md-3 col-xl-2 text-center">
          <Link className="app-link" to="/batch-request/list">
            <i className="app-link-icon green fa fa-fw fa-tasks" />
            <span className="app-link-title">Batch Requests</span>
          </Link>
        </div>
        <div className="col-12 col-sm-4 col-md-3 col-xl-2 text-center">
          <Link className="app-link" to="/job-request/list">
            <i className="app-link-icon blue fa fa-fw fa-rocket" />
            <span className="app-link-title">Job Requests</span>
          </Link>
        </div>
      </div>
      <div className="row my-4">
        <div className="col-12 col-sm-4 col-md-3 col-xl-2 text-center">
          <Link className="app-link" to="/execution-system-view">
            <i className="app-link-icon blue fa fa-fw fa-server" />
            <span className="app-link-title">Execution System View</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
