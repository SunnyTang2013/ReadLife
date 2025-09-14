import React from 'react';

function PriorityRunDoc() {
  return React.createElement('div', null,
    React.createElement('h3', { className: 'h3' }, 'Priority Run Tutorial'),
    React.createElement('section', null,
      React.createElement('h4', { className: 'h4' }, 'Introduction'),
      <p>{'A priority run is used for a scheduler job which have multiple cron-expressions. It is to give a cron-expression higher priority to fire, meanwhile it will not allow other schedules to run(skip the current execution}</p> as they are scheduled at same day and under same scheduler job.',
        React.createElement('br'),
        <strong>Notes: </strong>,
        <em>only make effect when PriorityRun and the other schedule jobs at same day.</em>
      )
    ),
    React.createElement('section', null,
      React.createElement('h4', { className: 'h4' }, 'Examples'),
      React.createElement('table', { className: 'table table-fixed' },
        React.createElement('thead', { className: 'table-primary' },
          React.createElement('tr', null,
            React.createElement('th', { scope: 'col' }, 'Sequence'),
            <th scope="col">Schduler Job</th>,
            <th scope="col">Result</th>
          )
        ),
        React.createElement('tbody', { className: 'table-bordered' },
          React.createElement('tr', null,
            <th>1</th>,
            React.createElement('th', { scope: 'row' },
              'Two expressions:',
              React.createElement('br'),
              '0 50 21 LW * ? ',
              <em>{<u>(Priority Run}</em></u>
              ),
              React.createElement('br'),
              '0 50 21 ? * FRI',
              React.createElement('br')
            ),
            <td>When last Weekday and Firday is same day, only run LW.</td>
          ),
          React.createElement('tr', null,
            <th>2</th>,
            React.createElement('th', { scope: 'row' },
              'Three expressions:',
              React.createElement('br'),
              '0 50 21 LW * ? ',
              <em>{<u>(Priority Run}</em></u>
              ),
              React.createElement('br'),
              '0 50 21 ? * Friday',
              React.createElement('br'),
              '0 50 21 ? * MON-THU'
            ),
            <td>When LW is the same day with others two cron-expressions, it will only run LW</td>
          )
        )
      )
    )
  );
}

export default PriorityRunDoc;
