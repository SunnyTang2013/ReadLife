import React, { useState, useCallback, useEffect } from 'react';
import { cloneDeep } from 'lodash';

const JobSelector = ({ originalJobList, runJobList: propRunJobList, loading, onAddJobToRunList }) => {
  const [selectedOriginalJobList, setSelectedOriginalJobList] = useState([]);
  const [runJobList, setRunJobList] = useState(cloneDeep(propRunJobList));
  const [selectedRemoveJobList, setSelectedRemoveJobList] = useState([]);
  const [filterOriginalJob, setFilterOriginalJob] = useState('');
  const [filterRunJob, setFilterRunJob] = useState('');

  useEffect(() => {
    setRunJobList(cloneDeep(propRunJobList));
  }, [propRunJobList]);

  const onAddJobToRunListHandler = useCallback(() => {
    const selectedOriginalJobListClone = cloneDeep(selectedOriginalJobList);
    const runJobListFiltered = cloneDeep(runJobList).filter(job => {
      for (let i = 0; i < selectedOriginalJobListClone.length; i++) {
        if (selectedOriginalJobListClone[i].id === job.id) {
          return false;
        }
      }
      return true;
    });
    const newRunJobList = runJobListFiltered.concat(selectedOriginalJobListClone);

    const newOriginalJobList = originalJobList.filter(job => {
      for (let i = 0; i < selectedOriginalJobListClone.length; i++) {
        const selectedOriginalJob = selectedOriginalJobListClone[i];
        if (selectedOriginalJob.id === job.id) {
          return false;
        }
      }
      return true;
    });

    setRunJobList(newRunJobList);
    setSelectedOriginalJobList([]);
    onAddJobToRunList(newRunJobList, newOriginalJobList);
  }, [selectedOriginalJobList, runJobList, originalJobList, onAddJobToRunList]);

  const onSelectOriginalJobs = useCallback(() => {
    const options = document.querySelector('#original-job-list').options;

    const selectedOriginalJobListNew = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        const optionValue = Number(options[i].value);
        if (!Number.isNaN(optionValue) && optionValue > 0) {
          const addJob = originalJobList.find(job => job.id === optionValue);
          selectedOriginalJobListNew.push(addJob);
        }
      }
    }

    setSelectedOriginalJobList(selectedOriginalJobListNew);
  }, [originalJobList]);

  const onSelectRunJobs = useCallback(() => {
    const runJobOptions = document.querySelector('#run-job-list').options;

    const selectedRemoveJobListNew = [];
    for (let i = 0; i < runJobOptions.length; i++) {
      if (runJobOptions[i].selected) {
        const optionValue = Number(runJobOptions[i].value);
        if (!Number.isNaN(optionValue) && optionValue > 0) {
          const removeJob = runJobList.find(job => job.id === optionValue);
          selectedRemoveJobListNew.push(removeJob);
        }
      }
    }
    setSelectedRemoveJobList(selectedRemoveJobListNew);
  }, [runJobList]);

  const onRemoveJobs = useCallback(() => {
    const newRunJobList = runJobList.filter(runJob => {
      for (let i = 0; i < selectedRemoveJobList.length; i++) {
        const selectedRemoveJob = selectedRemoveJobList[i];
        if (selectedRemoveJob.id === runJob.id) {
          return false;
        }
      }
      return true;
    });

    const newOriginalJobList = cloneDeep(originalJobList).concat(selectedRemoveJobList);
    setRunJobList(newRunJobList);
    setSelectedRemoveJobList([]);
    onAddJobToRunList(newRunJobList, newOriginalJobList);
  }, [runJobList, selectedRemoveJobList, originalJobList, onAddJobToRunList]);

  const onFilterRunJob = useCallback((event) => {
    setFilterRunJob(event.target.value);
  }, []);

  const onFilterOriginalJob = useCallback((event) => {
    setFilterOriginalJob(event.target.value);
  }, []);

  let $originalJobOptions = null;
  if (!loading) {
    let originalFilterJobList = null;
    if (filterOriginalJob) {
      originalFilterJobList = originalJobList.filter(
        job => {
          const lowerJobName = job.name.trim().toLowerCase();
          const lowerFilterOriginalJobName = filterOriginalJob.trim().toLowerCase();
          return lowerJobName.indexOf(lowerFilterOriginalJobName) > -1;
        },
      );
    } else {
      originalFilterJobList = originalJobList;
    }
    $originalJobOptions = originalFilterJobList.map((job, i) =>
      <option value={job.id} key={job.id}>{`${i + 1} : ${job.name}`}</option>
    );
  }

  let runFilterJobList = null;
  if (filterRunJob) {
    runFilterJobList = runJobList.filter(
      job => {
        const lowerJobName = job.name.trim().toLowerCase();
        const lowerFilterRunJobName = filterRunJob.trim().toLowerCase();
        return lowerJobName.indexOf(lowerFilterRunJobName) > -1;
      },
    );
  } else {
    runFilterJobList = runJobList;
  }
  const $runJobList = runFilterJobList.map((job) =>
    <option value={job.id} key={job.id}>{job.name}</option>
  );

  return React.createElement('div', { className: 'card' },
    React.createElement('div', { className: 'card-body' },
      React.createElement('div', { className: 'row' },
        React.createElement('div', { className: 'form-group col-5' },
          React.createElement('label', { htmlFor: 'job-list-selection' },
            'Original Job List',
            loading && <i className="fa fa-fw fa-spinner fa-spin ml-2" />
          ),
          <input type="text" className="form-control multi-search" placeholder="Search ..." id="search-original-job" value={filterOriginalJob} onChange={onFilterOriginalJob} />,
          <select multiple id="original-job-list" className="form-control custom-select multi-select" onChange={onSelectOriginalJobs}>{$originalJobOptions}</select>
        ),

        React.createElement('div', { className: 'form-group col-1 text-center add-job-to-list-btn' },
          React.createElement('div', null,
            React.createElement('button', {
              className: 'btn btn-outline-primary',
              type: 'button',
              onClick: onAddJobToRunListHandler
            },
              'Add ', <i className="fa fa-fw fa-chevron-right" />
            )
          ),
          React.createElement('div', { style: { paddingTop: '10px' } },
            <button className="btn btn-outline-primary" type="button" onClick={onRemoveJobs}>{<i className="fa fa-fw fa-chevron-left" />, ' Del'}</button>
          )
        ),

        React.createElement('div', { className: 'form-group col-5' },
          React.createElement('label', { htmlFor: 'exampleSelect2' },
            'Run Job List',
            React.createElement('span', { className: 'ml-2 text-muted mr-2' },
              'Total ', <strong>{runJobList.length}</strong>, ' Jobs'
            )
          ),
          <input type="text" className="form-control multi-search" placeholder="Search ..." id="search-run-job" value={filterRunJob} onChange={onFilterRunJob} />,
          <select multiple id="run-job-list" className="form-control custom-select multi-select" onChange={onSelectRunJobs}>{$runJobList}</select>
        )

      )
    )
  );
};

export default JobSelector;