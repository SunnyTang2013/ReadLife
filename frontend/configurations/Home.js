import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div>
      <h2 className="display-4">Configurations</h2>
      <div className="row my-4">
        <div className="col-12 col-sm-4 col-md-3 col-xl-2 text-center">
          <Link className="app-link" to="/job-config-group/list">
            <i className="app-link-icon green fa fa-fw fa-cogs" />
            <span className="app-link-title">Job Config Groups</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
