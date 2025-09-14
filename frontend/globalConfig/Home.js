import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return React.createElement('div', null,
    React.createElement('h2', { className: 'display-4' }, 'Global Configurations'),
    React.createElement('div', { className: 'row my-4' },
      React.createElement('div', { className: 'col-12 col-sm-4 col-md-3 col-xl-2 text-center' },
        React.createElement(Link, { className: 'app-link', to: '/job-context/list' },
          <i className="app-link-icon blue fa fa-fw fa-rocket" />,
          React.createElement('span', { className: 'app-link-title' }, 'Job Contexts')
        )
      ),
      React.createElement('div', { className: 'col-12 col-sm-4 col-md-3 col-xl-2 text-center' },
        React.createElement(Link, { className: 'app-link', to: '/execution-system/list' },
          <i className="app-link-icon red fa fa-fw fa-server" />,
          React.createElement('span', { className: 'app-link-title' }, 'Execution Systems')
        )
      ),
      React.createElement('div', { className: 'col-12 col-sm-4 col-md-3 col-xl-2 text-center' },
        React.createElement(Link, { className: 'app-link', to: '/bank-holiday/list' },
          <i className="app-link-icon yellow fa fa-fw fa-yelp" />,
          React.createElement('span', { className: 'app-link-title' }, 'Bank Holiday')
        )
      )
    )
  );
};

export default Home;