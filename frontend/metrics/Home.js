import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return React.createElement('div', null,
    <div className="spacer-top" />,
    React.createElement('div', { className: 'shadow p-3 mb-5 bg-white rounded' },
      React.createElement('h2', { className: 'display-4' }, 'Metrics'),
      React.createElement('div', { className: 'row my-4' },
        React.createElement('div', { className: 'col-12 col-sm-4 col-md-3 col-xl-2 text-center' },
          React.createElement(Link, { className: 'app-link', to: '/Metric' },
            <i className="app-link-icon cyan fa fa-fw fa-bank" />,
            React.createElement('span', { className: 'app-link-title' }, 'Phoenix Metrics')
          )
        ),
        React.createElement('div', { className: 'col-12 col-sm-4 col-md-3 col-xl-2 text-center' },
          React.createElement(Link, { className: 'app-link', to: '/MetricTradeError' },
            <i className="app-link-icon cyan fa fa-fw fa-check-square" />,
            React.createElement('span', { className: 'app-link-title' }, 'Trade Errors Metrics')
          )
        ),
        React.createElement('div', { className: 'col-12 col-sm-4 col-md-3 col-xl-2 text-center' },
          React.createElement(Link, { className: 'app-link', to: '/MetricBubble' },
            <i className="app-link-icon cyan fa fa-fw fa-bullseye" />,
            React.createElement('span', { className: 'app-link-title' }, 'Bubbles Metrics')
          )
        ),
        React.createElement('div', { className: 'col-12 col-sm-4 col-md-3 col-xl-2 text-center' },
          React.createElement(Link, { className: 'app-link', to: '/MetricQtf' },
            <i className="app-link-icon cyan fa fa-fw fa-bar-chart-o" />,
            React.createElement('span', { className: 'app-link-title' }, 'Pipelines Metrics')
          )
        ),
        React.createElement('div', { className: 'col-12 col-sm-4 col-md-3 col-xl-2 text-center' },
          React.createElement(Link, { className: 'app-link', to: '/MetricRerun' },
            <i className="app-link-icon cyan fa fa-fw fa-wrench" />,
            React.createElement('span', { className: 'app-link-title' }, 'Reruns')
          )
        ),
        React.createElement('div', { className: 'col-12 col-sm-4 col-md-3 col-xl-2 text-center' },
          React.createElement(Link, { className: 'app-link', to: '/QtfHandover' },
            <i className="app-link-icon cyan fa fa-fw fa-envelope" />,
            React.createElement('span', { className: 'app-link-title' }, 'QtfHandover')
          )
        )
      )
    ),
    React.createElement('div', { className: 'shadow p-3 mb-5 bg-white rounded' },
      React.createElement('h2', { className: 'display-4' }, 'External Metrics'),
      React.createElement('div', { className: 'flex-container' },
        React.createElement('div', { className: 'col-12 col-sm-4 col-md-3 col-xl-2 text-center' },
          React.createElement('a', {
            target: '_blank',
            rel: 'noopener noreferrer',
            href: 'https://lookerstudio.google.com/reporting/6f063e03-c862-4119-868a-2b546d3600ef'
          },
            <i className="fa fa-table externalLink" />,
            <span>Preempted Report (UAT)</span>
          )
        ),
        React.createElement('div', { className: 'col-12 col-sm-4 col-md-3 col-xl-2 text-center' },
          React.createElement('a', {
            target: '_blank',
            rel: 'noopener noreferrer',
            href: 'https://lookerstudio.google.com/reporting/ea53193d-e100-4205-b6d5-22aa6d76c9d9'
          },
            React.createElement('i', { className: 'fa cyan fa-table externalLink', style: { color: 'green' } }),
            <span>Rerun Report (UAT)</span>
          )
        )
      )
    )
  );
}