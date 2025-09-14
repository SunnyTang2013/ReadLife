import React from 'react';

function CronDoc() {
  return React.createElement('div', null,
    React.createElement('h3', { className: 'mb-2' }, 'Cron Expression Tutorial'),
    React.createElement('section', null,
      <h4>Format</h4>,
      React.createElement('p', null,
        'A cron expression is a string comprised of ',
        <em>6</em>,
        ' or ',
        <em>7</em>,
        ' fields separated by white space. Fields can contain any of the allowed values, along with various combinations of the allowed special characters for that field. The fields are as follows:'
      ),
      React.createElement('table', { className: 'table table-fixed' },
        React.createElement('thead', { className: 'table-primary' },
          React.createElement('tr', null,
            React.createElement('th', { scope: 'col' }, 'Field Name'),
            <th scope="col">Mandatory</th>,
            <th scope="col">Allowed Values</th>,
            <th scope="col">Allowed Special Characters</th>
          )
        ),
        React.createElement('tbody', { className: 'table-borderless' },
          React.createElement('tr', null,
            React.createElement('th', { scope: 'row' }, 'Seconds'),
            <td>YES</td>,
            <td>0-59</td>,
            <td>@, - * /</td>
          ),
          React.createElement('tr', null,
            React.createElement('th', { scope: 'row' }, 'Minutes'),
            <td>YES</td>,
            <td>0-59</td>,
            <td>, - * /</td>
          ),
          React.createElement('tr', null,
            React.createElement('th', { scope: 'row' }, 'Hours'),
            <td>YES</td>,
            <td>0-23</td>,
            <td>, - * /</td>
          ),
          React.createElement('tr', null,
            React.createElement('th', { scope: 'row' }, 'Day of month'),
            <td>YES</td>,
            <td>1-31</td>,
            <td>, - * ? / L W</td>
          ),
          React.createElement('tr', null,
            React.createElement('th', { scope: 'row' }, 'Month'),
            <td>YES</td>,
            <td>1-12 or JAN-DEC</td>,
            <td>, - * /</td>
          ),
          React.createElement('tr', null,
            React.createElement('th', { scope: 'row' }, 'Day of week'),
            <td>YES</td>,
            <td>1-7 or SUN-SAT</td>,
            <td>, - * ? / L #</td>
          ),
          React.createElement('tr', null,
            React.createElement('th', { scope: 'row' }, 'Year'),
            <td>NO</td>,
            <td>empty, 1970-2099</td>,
            <td>, - * /</td>
          )
        )
      ),
      <p>{'So cron expressions can be as simple as this:',
        <strong> * * * * ? *</strong>}</p>,
      <p>{'or more complex, like this: ',
        <strong>0/5 14,18,3-39,52 * ? JAN,MAR,SEP MON-FRI 2002-2010</strong>}</p>
    ),
    React.createElement('section', null,
      <h4>Special characters</h4>,
      React.createElement('p', null,
        <strong>*</strong>,
        ' (',
        <em>"all values"</em>,
        ') - used to select all values within a field. For example, "',
        <strong>*</strong>,
        '" in the minute field means "',
        <em>every minute</em>,
        '".'
      ),
      <p>{<strong>?</strong>,
        '("',
        <em>no specific value</em>,
        '"}</p> - useful when you need to specify something in one of the two fields in which the character is allowed, but not the other. For example, if I want my trigger to fire on a particular day of the month (say, the 10th), but don\'t care what day of the week that happens to be, I would put "',
        <em>10</em>,
        '" in the day-of-month field, and "',
        <strong>?</strong>,
        '" in the day-of-week field. See the examples below for clarification.'
      )
    ),
    React.createElement('section', null,
      <h4>Examples</h4>,
      React.createElement('table', { className: 'table table-fixed' },
        React.createElement('thead', { className: 'table-primary' },
          React.createElement('tr', null,
            React.createElement('th', { scope: 'col' }, 'Expression'),
            <th scope="col">Meaning</th>
          )
        ),
        React.createElement('tbody', { className: 'table-borderless' },
          React.createElement('tr', null,
            React.createElement('th', { scope: 'row' }, '0 0 12 * * ?'),
            <td>Fire at 12pm (noon) every day</td>
          ),
          React.createElement('tr', null,
            React.createElement('th', { scope: 'row' }, '0 15 10 ? * *'),
            <td>Fire at 10:15am every day</td>
          ),
          React.createElement('tr', null,
            React.createElement('th', { scope: 'row' }, '0 15 10 * * ?'),
            <td>Fire at 10:15am every day</td>
          ),
          React.createElement('tr', null,
            React.createElement('th', { scope: 'row' }, '0 15 10 * * ? *'),
            <td>Fire at 10:15am every day</td>
          ),
          React.createElement('tr', null,
            React.createElement('th', { scope: 'row' }, '0 15 10 * * ? 2020'),
            <td>Fire at 10:15am every day during the year 2020</td>
          )
        )
      )
    ),
    React.createElement('section', null,
      React.createElement('h4', { className: 'text-warning' }, 'Notes'),
      <p>{'Support for specifying both a day-of-week and a day-of-month value is not complete (you must currently use the \'?\' character in one of these fields}</p>.'
      ),
      <p>Be careful when setting fire times between the hours of the morning when "daylight savings" changes occur in your locale (for US locales, this would typically be the hour before and after 2:00 AM - because the time shift can cause a skip or a repeat depending on whether the time moves back or jumps forward.</p>
    )
  );
}

export default CronDoc;
