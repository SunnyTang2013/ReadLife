import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import jobGroupService from '../backend/jobGroupService';
import releaseService from '../backend/releaseService';

import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';
import { withCurrentUser } from '../components/currentUser';
import Paginator from '../components/Paginator';
import JobConfigGroupsBlock from '../components/JobConfigGroupsBlock';

function getDefaultPage() {
  return {
    page: 0,
    size: 25,
  };
}

const JobGroupRelease = ({ currentUser }) => {
  const { jobGroupId } = useParams();
  const [jobGroup, setJobGroup] = useState(null);
  const [configGroupsList, setConfigGroupsList] = useState(null);
  const [configGroupsPage, setConfigGroupsPage] = useState(null);

  const getPage = (pageNumber) => {
    if (!configGroupsList) return null;
    
    const page = {};
    page.totalPages = Math.ceil(configGroupsList.length / getDefaultPage().size);
    page.totalElements = configGroupsList.length;
    page.numberOfElements = getDefaultPage().size;
    page.number = pageNumber;
    page.first = pageNumber === 0;
    page.last = Math.ceil(configGroupsList.length / getDefaultPage().size) === pageNumber;
    page.content = configGroupsList.slice(pageNumber * getDefaultPage().size,
      (pageNumber + 1) * getDefaultPage().size);
    return page;
  };

  const onClickPage = (pageNumber) => {
    setConfigGroupsPage(getPage(pageNumber));
  };

  const onLockAndTagConfigGroups = () => {
    releaseService.addTagToConfigGroups(jobGroupId)
      .then((configGroupsPageData) => {
        setConfigGroupsList(configGroupsPageData.content);
        setConfigGroupsPage(getPage(0));
        toast.success('Add PROD tag to config groups successfully!');
      })
      .catch(error => toast.error(`${error}`));
  };

  const loadJobGroup = () => {
    console.log(`Loading detail of job group #${jobGroupId}...`);
    jobGroupService.getJobGroup(jobGroupId)
      .then(jobGroup => setJobGroup(jobGroup))
      .catch(error => setJobGroup(error));
  };

  useEffect(() => {
    loadJobGroup();
  }, [jobGroupId]);

  if (jobGroup === null) {
    return <LoadingIndicator />;
  }
  if (jobGroup instanceof Error) {
    return <ErrorAlert error={jobGroup} />;
  }

  let configGroupList = null;
  let paginator = null;
  if (configGroupsPage) {
    configGroupList = (
      <section>
        <h3 className="display-6">Configuration Groups</h3>
        <div className="my-2">The following versioned functional configurations are tagged as PROD:</div>
        <JobConfigGroupsBlock categoryType="functional" jobConfigGroups={configGroupsPage.content} />
      </section>
    );
    paginator = <Paginator page={configGroupsPage} onClickPage={onClickPage} />;
  }

  if (!currentUser.canWrite) {
    return (
      <div className="alert alert-danger">
        <i className="fa fa-fw fa-exclamation-triangle mr-1" />
        You do not have the permission to release this job group.
      </div>
    );
  }

  const exportUrl = releaseService.exportUrlForJobGroupBundle(jobGroup.id);
  
  return (
    <div>
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to={`/job-group/job-list/${jobGroup.id}`}>
              {`Job Group #${jobGroup.id}`}
            </Link>
          </li>
          <li className="breadcrumb-item active">Release Job Group</li>
        </ol>
      </nav>
      <h2 className="display-4">{`Release Job Group: ${jobGroup.name}`}</h2>
      <section>
        <ul className="timeline">
          <li>
            <i className="timeline-icon fa fa-fw fa-download text-primary" />
            <div className="timeline-item">
              <h3 className="lighter">
                Step 1: Download job group bundle
              </h3>
              <div className="my-2">
                <i className="fa fa-fw fa-info-circle mr-1" />
                The bundle includes all the jobs in job group {' '}
                <strong>{jobGroup.name}</strong>
                {', as well as related functional config groups. You can later upload the bundle to the destination Scorch server.'}
              </div>
              <div className="my-2">
                <a className="btn btn-primary" href={exportUrl}>
                  <i className="fa fa-fw fa-download" />
                  {' Download job group bundle'}
                </a>
              </div>
            </div>
          </li>
          <li>
            <i className="timeline-icon fa fa-fw fa-tag text-primary" />
            <div className="timeline-item">
              <h3 className="lighter">
                Step 2: Add {' '}
                <code>PROD</code>
                {' tag to config groups'}
              </h3>
              <div className="my-2">
                <i className="fa fa-fw fa-info-circle mr-1" />
                After the bundle has been uploaded to the destination Scorch server successfully, you can now lock all the config groups used in this job group, and add a {' '}
                <code className="mx-1">PROD</code>
                {' tag on them.'}
              </div>
              <div className="my-2">
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={onLockAndTagConfigGroups}
                >
                  <i className="fa fa-fw fa-tag" />
                  {' Lock and tag config groups'}
                </button>
              </div>
            </div>
          </li>
        </ul>
      </section>
      {configGroupList}
      {paginator}
    </div>
  );
};

export default withCurrentUser(JobGroupRelease);