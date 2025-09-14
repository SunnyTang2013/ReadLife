import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import { isEqual } from 'lodash';
import queryString from 'query-string';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';

import pipelineService from '../backend/pipelineService';
import ErrorAlert from '../components/ErrorAlert';
import LoadingIndicator from '../components/LoadingIndicator';
import Paginator from '../components/Paginator';
import Alert from '../components/Alert';

import pipelineRequestService from '../backend/pipelineRequestService';
import { extractFavouritesFromData, formatTime } from '../utils/utilities';

const PIPELINE_TYPE = {
  ALL_PIPELINES: 'ALL_PIPELINES',
  FAVOURITE_PIPELINES: 'FAVOURITE_PIPELINES',
};

function getDefaultQuery() {
  return {
    name: '',
    containBatch: '',
    lastUpdatedBy: '',
    minUpdateTime: '',
    maxUpdateTime: '',
    sort: 'name,asc',
    page: 0,
    size: 50,
  };
}

function onQuickRunPipeline(pipelineId) {
  pipelineRequestService.submitPipeline(pipelineId)
    .then((pipelineRequest) => {
      toast.success(`Pipeline has been submitted, status is: ${pipelineRequest.status}`);
    })
    .catch((error) => {
      toast.error(`Failed to submit pipeline: ${error}`);
    });
}

const PipelineList = () => {
  const currentUser = { username: 'admin', canWrite: true, canExecute: true }; // Mock currentUser
  const [pipelinePage, setPipelinePage] = useState(null);
  const [favouritePipelines, setFavouritePipelines] = useState([]);
  const [filteringOptions, setFilteringOptions] = useState({});
  const [selectedPipelines, setSelectedPipelines] = useState([]);
  const [selectedFavouritesPipelines, setSelectedFavouritesPipelines] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();

  const query = React.useMemo(() => {
    const defaultQuery = getDefaultQuery();
    const searchQuery = queryString.parse(location.search);
    return Object.assign({}, defaultQuery, searchQuery);
  }, [location.search]);

  const favouritesLocalStorageKey = React.useMemo(() => {
    const { username } = currentUser;
    return `${username}_FAVOURITE_PIPELINES`;
  }, [currentUser]);

  useEffect(() => {
    _loadData();
  }, []);

  useEffect(() => {
    _clearAndLoadPipelineList();
  }, [location.search]);

  function onClickPage(page) {
    const url = _getQueryUrl({ page });
    navigate(url);
  }

  function onCheckOrUncheckPipelineList(event, pipelineType) {
    const pipelineCopy = _getPipelinePageDependsOnType(pipelineType);
    const selectedPipelineCopy = _getSelectedPipelinesDependsOnType(pipelineType);
    if (event.target.id === 'SELECT_ALL_PIPELINES') {
      pipelineCopy.map(batch => {
        if (!selectedPipelineCopy.includes(batch.id)) {
          selectedPipelineCopy.push(batch.id);
        }
        return selectedPipelineCopy;
      });
    } else if (event.target.id === 'CLEAR') {
      pipelineCopy.map(batch => {
        const index = selectedPipelineCopy.indexOf(batch.id);
        if (index > -1) {
          selectedPipelineCopy.splice(index, 1);
        }
        return selectedPipelineCopy;
      });
    }
    if (pipelineType === PIPELINE_TYPE.ALL_PIPELINES) {
      setSelectedPipelines([...selectedPipelineCopy]);
    } else {
      setSelectedFavouritesPipelines([...selectedPipelineCopy]);
    }
  }

  function onCheckOrUncheckPipeline(pipeline, event, pipelineType) {
    const selectedPipelinesCopy = _getSelectedPipelinesDependsOnType(pipelineType);
    const index = selectedPipelinesCopy.indexOf(pipeline.id);
    if (event.target.checked && index === -1) {
      selectedPipelinesCopy.push(pipeline.id);
    } else if (!event.target.checked && index > -1) {
      selectedPipelinesCopy.splice(index, 1);
    }
    if (pipelineType === PIPELINE_TYPE.ALL_PIPELINES) {
      setSelectedPipelines([...selectedPipelinesCopy]);
    } else {
      setSelectedFavouritesPipelines([...selectedPipelinesCopy]);
    }
  }

  function onChangeNameKeyword(event) {
    const name = event.target.value;
    setFilteringOptions(prevOptions => ({
      ...prevOptions,
      name
    }));
  }

  function onChangeBatchContains(batchSummary) {
    if (batchSummary) {
      const containBatch = batchSummary.id;
      setFilteringOptions(prevOptions => ({
        ...prevOptions,
        containBatch
      }));
    } else {
      setFilteringOptions(prevOptions => ({
        ...prevOptions,
        containBatch: ''
      }));
    }
  }

  function onChangeUpdateTimeRange(name, dateTime) {
    setFilteringOptions(prevOptions => {
      const newOptions = { ...prevOptions };
      if (!dateTime) {
        newOptions[name] = null;
      } else {
        newOptions[name] = dateTime.toISOString();
      }
      return newOptions;
    });
  }

  function onChangeUsername(event) {
    const lastUpdatedBy = event.target.value;
    setFilteringOptions(prevOptions => ({
      ...prevOptions,
      lastUpdatedBy
    }));
  }

  function onClickUpdatedByMe() {
    if (currentUser && currentUser.username) {
      setFilteringOptions(prevOptions => ({
        ...prevOptions,
        lastUpdatedBy: currentUser.username
      }));
    }
  }

  function onApplyFilteringOptions() {
    const queryOverrides = Object.assign({}, filteringOptions);
    Object.keys(queryOverrides).forEach((key) => {
      if (key !== 'containBatch') {
        queryOverrides[key] = (queryOverrides[key] || '').trim();
      }
    });
    queryOverrides.page = 0; // Need to reset page number to 0.
    const url = _getQueryUrl(queryOverrides);
    navigate(url);
  }

  function onResetFilteringOptions() {
    const defaultQuery = getDefaultQuery();
    const queryOverrides = {
      name: defaultQuery.name,
      lastUpdatedBy: defaultQuery.lastUpdatedBy,
      containBatch: defaultQuery.containBatch,
      minUpdateTime: defaultQuery.minUpdateTime,
      maxUpdateTime: defaultQuery.maxUpdateTime,
      page: 0,
    };
    setFilteringOptions({});
    const url = _getQueryUrl(queryOverrides);
    navigate(url);
  }

  function onRunPipelineList(pipelineType) {
    const pipelineToRun = _getSelectedPipelinesDependsOnType(pipelineType);
    if (pipelineToRun.length < 1) {
      toast.warn('No Pipeline Selected To Run.');
      return;
    }
    pipelineService.onRunPipelineList(pipelineToRun);
  }

  function onToggleFavourite(pipelineId, pipelineAlreadyInFavorites) {
    if (pipelineAlreadyInFavorites) {
      removeFromFavourites(pipelineId);
    } else {
      addToFavourites(pipelineId);
    }
  }

  function updateUserFavouritePipelines() {
    const favouritesIds = favouritePipelines.map(pipeline => pipeline.id);
    window.localStorage.setItem(favouritesLocalStorageKey, JSON.stringify(favouritesIds));
  }

  function addToFavourites(pipelineId) {
    const chosenPipeline = pipelinePage.content.find(pipeline => pipeline.id === pipelineId);
    if (chosenPipeline) {
      setFavouritePipelines(prevFavourites => {
        const newFavourites = [...prevFavourites, chosenPipeline];
        return newFavourites;
      });
    }
  }

  function removeFromFavourites(pipelineId) {
    setFavouritePipelines(prevFavourites => {
      const newFavourites = prevFavourites.filter(pipeline => pipeline.id !== pipelineId);
      return newFavourites;
    });
  }

  function pipelineIsInFavourites(pipelineId) {
    return favouritePipelines.findIndex(pipeline => pipeline.id === pipelineId) !== -1;
  }

  function _getQueryUrl(overrides) {
    const nextQuery = Object.assign({}, query, overrides);
    return `${location.pathname}?${queryString.stringify(nextQuery)}`;
  }

  function _getSelectedPipelinesDependsOnType(pipelineType) {
    return pipelineType === PIPELINE_TYPE.ALL_PIPELINES
      ? selectedPipelines
      : selectedFavouritesPipelines;
  }

  function _getPipelinePageDependsOnType(pipelineType) {
    return pipelineType === PIPELINE_TYPE.ALL_PIPELINES
      ? pipelinePage.content
      : favouritePipelines;
  }

  async function _getOnePipelineFromApi(id) {
    try {
      const pipeline = await pipelineService.getPipelineDetail(id);
      return pipeline;
    } catch {
      return null;
    }
  }

  async function _getPipelinesByIdsFromApi(pipelinesIds) {
    try {
      const array = await Promise.all(pipelinesIds.map(id => _getOnePipelineFromApi(id)));
      return array.filter(item => item !== null);
    } catch {
      return [];
    }
  }

  async function _loadData() {
    const pipelineListPromise = pipelineService.getPipelineList(query);
    const savedFavouritesIds = window.localStorage.getItem(favouritesLocalStorageKey);
    const savedFavouritesIdsArray = savedFavouritesIds ? JSON.parse(savedFavouritesIds) : [];
    try {
      const pipelinePage = await pipelineListPromise;
      const allPipelinesList = await _getPipelinesByIdsFromApi(savedFavouritesIdsArray);
      const favouritePipelines = extractFavouritesFromData(
        allPipelinesList,
        savedFavouritesIdsArray,
      );
      setPipelinePage(pipelinePage);
      setFavouritePipelines(favouritePipelines);
    } catch (error) {
      setPipelinePage(error);
    }
  }

  function _clearAndLoadPipelineList() {
    setPipelinePage(null);
    setSelectedPipelines([]);
    _loadData();
  }

  // Update favourites in localStorage whenever favouritePipelines changes
  useEffect(() => {
    if (favouritePipelines.length > 0) {
      updateUserFavouritePipelines();
    }
  }, [favouritePipelines, favouritesLocalStorageKey]);

  function _renderFilteringOptions() {
    const filterOptions = Object.assign({}, query, filteringOptions);
    let minUpdateTime = null;
    if (filterOptions.minUpdateTime) {
      minUpdateTime = new Date(filterOptions.minUpdateTime);
    }
    let maxUpdateTime = null;
    if (filterOptions.maxUpdateTime) {
      maxUpdateTime = new Date(filterOptions.maxUpdateTime);
    }

    return (
      <aside>
        <h2 className="display-6">Filtering Options</h2>
        <div className="card">
          <div className="card-body">
            <div className="form-group">
              <label htmlFor="query-name-keyword">Name Contains:</label>
              <input id="query-name-keyword" className="form-control" value={filterOptions.name} onChange={onChangeNameKeyword} />
            </div>
            <div className="form-group">
              <label htmlFor="query-min-create-time">From Time:</label>
              <DatePicker 
                id="query-min-create-time" 
                className="form-control" 
                selected={minUpdateTime} 
                onChange={selected => onChangeUpdateTimeRange('minUpdateTime', selected)} 
                dateFormat="yyyy-MM-dd HH:mm" 
                showTimeSelect 
                timeFormat="HH:mm" 
                timeIntervals={30} 
                timeCaption="time" 
              />
            </div>
            <div className="form-group">
              <label htmlFor="query-max-create-time">Till Time:</label>
              <DatePicker 
                id="query-max-create-time" 
                className="form-control" 
                selected={maxUpdateTime} 
                onChange={selected => onChangeUpdateTimeRange('maxUpdateTime', selected)} 
                dateFormat="yyyy-MM-dd HH:mm" 
                showTimeSelect 
                timeFormat="HH:mm" 
                timeIntervals={30} 
                timeCaption="time" 
              />
            </div>
            <div className="form-group">
              <label htmlFor="query-update-username">Last Updated By:</label>
              <input id="query-update-username" className="form-control" value={filterOptions.lastUpdatedBy} onChange={onChangeUsername} />
              {currentUser.username && (
                <button className="anchor" type="button" onClick={onClickUpdatedByMe}>
                  Updated by me
                </button>
              )}
            </div>
            <div className="form-group">
              <button
                type="button"
                className="btn btn-primary mr-2"
                onClick={onApplyFilteringOptions}
              >
                Search
              </button>
              <button type="button" className="btn btn-light" onClick={onResetFilteringOptions}>
                Reset
              </button>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  function _renderPipelineTableRows({
    data, selectedPipelines, canWrite, canExecute, pipelineType,
  }) {
    if (!data || !data.length) {
      return null;
    }

    return data.map((pipeline) => {
      const pipelineAlreadyInFavourites = pipelineIsInFavourites((pipeline.id));
      const toggleFavouriteButtonClassName = `btn ${pipelineAlreadyInFavourites ? 'btn' : 'btn-outline'}-primary`;
      return React.createElement('tr', { key: `batch-row-${pipeline.id}` },
        React.createElement('td', null,
          React.createElement('input', {
            type: 'checkbox',
            checked: selectedPipelines.indexOf(pipeline.id) > -1,
            onChange: event => onCheckOrUncheckPipeline(pipeline, event, pipelineType)
          })
        ),
        React.createElement('td', null,
          React.createElement(Link, { to: `/detail/${pipeline.id}` }, pipeline.name)
        ),
        <td className="text-nowrap">{pipeline.lastUpdatedBy}</td>,
        <td className="text-nowrap">{formatTime(pipeline.updateTime) || 'N/A'}</td>,
        React.createElement('td', { className: 'text-nowrap' },
          React.createElement('div', { className: 'btn-group btn-group-xs', role: 'group' },
            React.createElement('button', {
              className: toggleFavouriteButtonClassName,
              type: 'button',
              title: `${pipelineAlreadyInFavourites ? 'Remove from' : 'Add to'} favourites`,
              onClick: () => onToggleFavourite(pipeline.id, pipelineAlreadyInFavourites)
            },
              <i className="fa fa-fw fa-star" />
            ),
            canWrite && React.createElement(Link, {
              to: `/update/${pipeline.id}`,
              className: 'btn btn-outline-primary',
              title: 'Configure'
            },
              <i className="fa fa-fw fa-pencil" />
            ),
            canExecute && React.createElement(Link, {
              to: `/pipeline/customized-run/${pipeline.id}`,
              className: 'btn btn-outline-primary',
              title: 'Customized Run'
            },
              <i className="fa fa-fw fa-play" />
            ),
            canExecute && <button className="btn btn-outline-primary" type="button" title="Quick Run" onClick={() => onQuickRunPipeline(pipeline.id)}>{<i className="fa fa-fw fa-forward" />}</button>
          ),
          !canWrite && !canExecute &&
            <span className="text-muted">--</span>
        )
      );
    });
  }

  function _renderPipelineTable({ children, canExecute, $sortIcon, pipelineType }) {
    return React.createElement('table', { className: 'table table-striped mb-2' },
      React.createElement('thead', null,
        React.createElement('tr', null,
          React.createElement('th', { style: { width: '7%' } },
            React.createElement('div', { className: 'btn-group' },
              React.createElement('button', {
                'data-toggle': 'dropdown',
                className: 'btn btn-primary dropdown-toggle',
                type: 'button',
                id: 'dropdown-menu'
              }, 'ACTIONS'),
              React.createElement('div', { className: 'dropdown-menu' },
                React.createElement('button', {
                  id: 'SELECT_ALL_PIPELINES',
                  className: 'dropdown-item',
                  type: 'button',
                  onClick: (event) => onCheckOrUncheckPipelineList(event, pipelineType)
                }, 'Select All'),
                <button id="CLEAR" className="dropdown-item" type="button" onClick={(event) => onCheckOrUncheckPipelineList(event, pipelineType)}>Clear</button>,
                canExecute && <button id="RUN_PIPELINE_LIST" className="dropdown-item" type="button" title="Run Selected Pipeline List" onClick={onRunPipelineList}>Run Pipeline List</button>
              )
            )
          ),
          React.createElement('th', null,
            React.createElement('button', {
              className: 'anchor',
              type: 'button',
              onClick: () => {} // onToggleNameOrdering - needs implementation
            }, 'Name ', $sortIcon)
          ),
          React.createElement('th', { className: 'text-nowrap', style: { width: '10%' } }, 'Last Updated By'),
          React.createElement('th', { className: 'text-nowrap', style: { width: '10%' } }, 'Update Time'),
          React.createElement('th', { className: 'text-nowrap', style: { width: '10%' } }, 'Actions')
        )
      ),
      <tbody>{children}</tbody>
    );
  }

  const canWrite = currentUser.canWrite;
  const canExecute = currentUser.canExecute;

  if (pipelinePage === null) {
    return <LoadingIndicator />;
  }
  
  if (pipelinePage instanceof Error) {
    return <ErrorAlert error={pipelinePage} />;
  }

  const $filteringOptions = _renderFilteringOptions();

  const { sort } = query;
  const ordering = sort.split(',')[1];

  let $sortIcon = null;
  if (ordering === 'asc') {
    $sortIcon = <i className="fa fa-fw fa-sort-alpha-asc ml-1" />;
  } else if (ordering === 'desc') {
    $sortIcon = <i className="fa fa-fw fa-sort-alpha-desc ml-1" />;
  }

  const $pipelineRows = _renderPipelineTableRows({
    data: pipelinePage.content,
    selectedPipelines: selectedPipelines,
    canWrite: canWrite,
    canExecute: canExecute,
    pipelineType: PIPELINE_TYPE.ALL_PIPELINES,
  });

  const $favouritePipelineRows = _renderPipelineTableRows({
    data: favouritePipelines,
    selectedPipelines: selectedFavouritesPipelines,
    canWrite: canWrite,
    canExecute: canExecute,
    pipelineType: PIPELINE_TYPE.FAVOURITE_PIPELINES,
  });

  const $favourPipelineListTable = $favouritePipelineRows
    ? _renderPipelineTable({
        children: $favouritePipelineRows,
        canExecute: canExecute,
        $sortIcon: $sortIcon,
        pipelineType: PIPELINE_TYPE.FAVOURITE_PIPELINES
      })
    : <Alert type="warning" text="No pipelines found." />;

  const $pipelineListTable = $pipelineRows
    ? _renderPipelineTable({
        children: $pipelineRows,
        canExecute: canExecute,
        $sortIcon: $sortIcon,
        pipelineType: PIPELINE_TYPE.ALL_PIPELINES
      })
    : <Alert type="warning" text="No pipelines found." />;

  return React.createElement('div', null,
    React.createElement('h2', { className: 'display-4' }, 'Pipelines'),
    React.createElement('div', { className: 'row' },
      React.createElement('div', { className: 'col-9  no-gutters' },
        React.createElement('div', { className: 'col-12 mt-3' },
          React.createElement('h2', { className: 'display-6' }, 'Favourites'),
          $favourPipelineListTable
        ),
        React.createElement('div', { className: 'col-12 mt-5' },
          React.createElement('h2', { className: 'display-6' }, 'All pipelines'),
          canWrite && React.createElement('div', { className: 'text-right my-4' },
            React.createElement(Link, {
              to: '/create',
              className: 'btn btn-primary btn-light-primary'
            },
              <i className="fa fa-fw fa-plus" />, ' Add a new pipeline'
            )
          ),
          $pipelineListTable,
          <Paginator page={pipelinePage} onClickPage={onClickPage} />
        )
      ),
      <div className="col-3">{$filteringOptions}</div>
    )
  );
};

export default PipelineList;