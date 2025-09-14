import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { isEqual } from 'lodash';
import queryString from 'query-string';
import { toast } from 'react-toastify';

import batchService from '../backend/batchService';
import { extractFavouritesFromData, formatTime } from '../utils/utilities';
import Alert from '../components/Alert';
import LoadingIndicator from '../components/LoadingIndicator';
import Paginator from '../components/Paginator';
import { withCurrentUser } from '../components/currentUser';


const BATCH_TYPE = {
  ALL_BATCHES: 'ALL_BATCHES',
  FAVOURITE_BATCHES: 'FAVOURITE_BATCHES',
};

const BatchList = ({ currentUser }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [batchPage, setBatchPage] = useState(null);
  const [favouriteBatches, setFavouriteBatches] = useState([]);
  const [filteringOptions, setFilteringOptions] = useState({});
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [selectedFavouriteBatches, setSelectedFavouriteBatches] = useState([]);

  const ASC = 'asc';
  const DESC = 'desc';

  const getDefaultQuery = useCallback(() => ({
    name: '',
    minCreateTime: '',
    maxCreateTime: '',
    lastUpdatedBy: '',
    sort: 'name,asc',
    page: 0,
    size: 50,
  }), []);

  const query = useMemo(() => {
    const defaultQuery = getDefaultQuery();
    const parsedQuery = queryString.parse(location.search);
    return Object.assign({}, defaultQuery, parsedQuery);
  }, [location.search, getDefaultQuery]);

  const favouritesLocalStorageKey = useMemo(() => {
    const username = currentUser.username;
    return `${username}_FAVOURITE_BATCHES`;
  }, [currentUser.username]);

  const onQuickRunBatch = useCallback((batchId: number) => {
    batchService.submitBatch(batchId)
      .then((batchRequest: any) => {
        toast.success(`Batch has been submitted, status is: ${batchRequest.status}`);
      })
      .catch((error: Error) => {
        toast.error(`Failed to submit batch: ${error}`);
      });
  }, []);

  const onClickPage = useCallback((page: number) => {
    const url = getQueryUrl({ page });
    navigate(url);
  }, [navigate, query]);

  const getQueryUrl = useCallback((overrides: Partial<DefaultQuery>) => {
    const nextQuery = Object.assign({}, query, overrides);
    return `${location.pathname}?${queryString.stringify(nextQuery)}`;
  }, [query, location.pathname]);

  const onRunBatchList = useCallback(() => {
    if (selectedBatches.length < 1) {
      toast.warn('No job selected to run.');
      return;
    }
    batchService.onRunBatchList(selectedBatches);
  }, [selectedBatches]);

  const getSelectedBatchesDependsOnType = useCallback((batchType: string) => {
    return batchType === BATCH_TYPE.ALL_BATCHES
      ? selectedBatches
      : selectedFavouriteBatches;
  }, [selectedBatches, selectedFavouriteBatches]);

  const getBatchPageDependsOnType = useCallback((batchType: string) => {
    return batchType === BATCH_TYPE.ALL_BATCHES
      ? (batchPage as BatchPage)?.content
      : favouriteBatches;
  }, [batchPage, favouriteBatches]);

  const onCheckOrUncheckBatches = useCallback((event: React.ChangeEvent<HTMLButtonElement>, batchType: string) => {
    const batchesCopy = getBatchPageDependsOnType(batchType);
    const selectedBatchesCopy = [...getSelectedBatchesDependsOnType(batchType)];
    
    if (event.target.id === 'SELECT_ALL_BATCHES') {
      batchesCopy?.forEach(batch => {
        if (!selectedBatchesCopy.includes(batch.id)) {
          selectedBatchesCopy.push(batch.id);
        }
      });
    } else if (event.target.id === 'CLEAR') {
      batchesCopy?.forEach(batch => {
        const index = selectedBatchesCopy.indexOf(batch.id);
        if (index > -1) {
          selectedBatchesCopy.splice(index, 1);
        }
      });
    }
    
    if (batchType === BATCH_TYPE.ALL_BATCHES) {
      setSelectedBatches(selectedBatchesCopy);
    } else {
      setSelectedFavouriteBatches(selectedBatchesCopy);
    }
  }, [getBatchPageDependsOnType, getSelectedBatchesDependsOnType]);

  const onCheckOrUncheckBatch = useCallback((batch: BatchSummary, event: React.ChangeEvent<HTMLInputElement>, batchType: string) => {
    const selectedPipelinesCopy = [...getSelectedBatchesDependsOnType(batchType)];
    const index = selectedPipelinesCopy.indexOf(batch.id);
    
    if (event.target.checked && index === -1) {
      selectedPipelinesCopy.push(batch.id);
    } else if (!event.target.checked && index > -1) {
      selectedPipelinesCopy.splice(index, 1);
    }
    
    if (batchType === BATCH_TYPE.ALL_BATCHES) {
      setSelectedBatches(selectedPipelinesCopy);
    } else {
      setSelectedFavouriteBatches(selectedPipelinesCopy);
    }
  }, [getSelectedBatchesDependsOnType]);

  const onChangeNameKeyword = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const name = event.target.value;
    setFilteringOptions(prevState => ({ ...prevState, name }));
  }, []);

  const onChangeUpdateTimeRange = useCallback((name: string, dateTime: Date | null) => {
    setFilteringOptions(prevState => ({
      ...prevState,
      [name]: dateTime ? dateTime.toISOString() : null
    }));
  }, []);

  const onChangeUsername = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const lastUpdatedBy = event.target.value;
    setFilteringOptions(prevState => ({ ...prevState, lastUpdatedBy }));
  }, []);

  const onClickUpdatedByMe = useCallback(() => {
    if (currentUser && currentUser.username) {
      setFilteringOptions(prevState => ({
        ...prevState,
        lastUpdatedBy: currentUser.username
      }));
    }
  }, [currentUser]);

  const onApplyFilteringOptions = useCallback(() => {
    const queryOverrides = Object.assign({}, filteringOptions);
    Object.keys(queryOverrides).forEach((key) => {
      queryOverrides[key as keyof FilteringOptions] = (queryOverrides[key as keyof FilteringOptions] || '').toString().trim();
    });
    queryOverrides.page = 0;
    const url = getQueryUrl(queryOverrides as Partial<DefaultQuery>);
    navigate(url);
  }, [filteringOptions, getQueryUrl, navigate]);

  const onResetFilteringOptions = useCallback(() => {
    const defaultQuery = getDefaultQuery();
    const queryOverrides = {
      name: defaultQuery.name,
      lastUpdatedBy: defaultQuery.lastUpdatedBy,
      minUpdateTime: defaultQuery.minCreateTime,
      maxUpdateTime: defaultQuery.maxCreateTime,
      page: 0,
    };
    setFilteringOptions({});
    const url = getQueryUrl(queryOverrides);
    navigate(url);
  }, [getDefaultQuery, getQueryUrl, navigate]);

  const onToggleFavourite = useCallback((itemId: number, itemAlreadyInFavorites: boolean) => {
    if (itemAlreadyInFavorites) {
      removeFromFavourites(itemId);
    } else {
      addToFavourites(itemId);
    }
  }, []);

  const updateUserFavourite = useCallback(() => {
    const favouritesIds = favouriteBatches.map(batch => batch.id);
    window.localStorage.setItem(favouritesLocalStorageKey, JSON.stringify(favouritesIds));
  }, [favouriteBatches, favouritesLocalStorageKey]);

  const addToFavourites = useCallback((batchId: number) => {
    if (batchPage && !(batchPage instanceof Error)) {
      const chosenPipeline = batchPage.content.find(batch => batch.id === batchId);
      if (chosenPipeline) {
        const updatedFavourites = [...favouriteBatches, chosenPipeline];
        setFavouriteBatches(updatedFavourites);
        // Update localStorage after state is set
        setTimeout(() => updateUserFavourite(), 0);
      }
    }
  }, [batchPage, favouriteBatches, updateUserFavourite]);

  const removeFromFavourites = useCallback((batchId: number) => {
    const index = favouriteBatches.findIndex(batch => batch.id === batchId);
    if (index !== -1) {
      const updatedFavourites = [...favouriteBatches];
      updatedFavourites.splice(index, 1);
      setFavouriteBatches(updatedFavourites);
      // Update localStorage after state is set
      setTimeout(() => updateUserFavourite(), 0);
    }
  }, [favouriteBatches, updateUserFavourite]);

  const itemIsInFavourites = useCallback((batchId: number) => {
    return favouriteBatches.findIndex(batch => batch.id === batchId) !== -1;
  }, [favouriteBatches]);

  const getOneBatchFromApi = useCallback(async (id: number): Promise<BatchSummary | null> => {
    try {
      const batch = await batchService.getBatchDetail(id);
      return batch;
    } catch {
      return null;
    }
  }, []);

  const getBatchesByIdsFromApi = useCallback(async (batchesIds: number[]): Promise<BatchSummary[]> => {
    try {
      const array = await Promise.all(batchesIds.map(id => getOneBatchFromApi(id)));
      return array.filter(item => item !== null) as BatchSummary[];
    } catch {
      return [];
    }
  }, [getOneBatchFromApi]);

  const loadData = useCallback(async () => {
    try {
      const batchPagePromise = batchService.findBatchesByKeywords(query);
      const savedFavouritesIds = window.localStorage.getItem(favouritesLocalStorageKey);
      const savedFavouritesIdsArray = savedFavouritesIds ? JSON.parse(savedFavouritesIds) : [];

      const batchPageResult = await batchPagePromise;
      const allPipelinesList = await getBatchesByIdsFromApi(savedFavouritesIdsArray);
      const favouriteBatchesResult = extractFavouritesFromData(
        allPipelinesList,
        savedFavouritesIdsArray,
      );
      
      setBatchPage(batchPageResult);
      setFavouriteBatches(favouriteBatchesResult);
    } catch (error) {
      setBatchPage(error as Error);
    }
  }, [query, favouritesLocalStorageKey, getBatchesByIdsFromApi]);

  const clearAndLoadBatchPage = useCallback(() => {
    setBatchPage(null);
    setSelectedBatches([]);
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    clearAndLoadBatchPage();
  }, [location.search]);

  const renderFilteringOptions = useCallback(() => {
    const filteringOptionsWithQuery = Object.assign({}, query, filteringOptions);
    let minUpdateTime: Date | null = null;
    if (filteringOptionsWithQuery.minUpdateTime) {
      minUpdateTime = new Date(filteringOptionsWithQuery.minUpdateTime);
    }
    let maxUpdateTime: Date | null = null;
    if (filteringOptionsWithQuery.maxUpdateTime) {
      maxUpdateTime = new Date(filteringOptionsWithQuery.maxUpdateTime);
    }

    return (
      <aside>
        <h2 className="display-6">Filtering Options</h2>
        <div className="card">
          <div className="card-body">
            <div className="form-group">
              <label htmlFor="query-name-keyword">Name Contains:</label>
              <input
                id="query-name-keyword"
                className="form-control"
                value={filteringOptionsWithQuery.name || ''}
                onChange={onChangeNameKeyword}
              />
            </div>
            <div className="form-group">
              <label htmlFor="query-min-create-time">From Time:</label>
              <DatePicker
                id="query-min-create-time"
                className="form-control"
                selected={minUpdateTime}
                onChange={selected => onChangeUpdateTimeRange('minUpdateTime', selected)}
                dateFormat="yyyy-MM-dd HH:mm"
                showTimeSelect={true}
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
                showTimeSelect={true}
                timeFormat="HH:mm"
                timeIntervals={30}
                timeCaption="time"
              />
            </div>
            <div className="form-group">
              <label htmlFor="query-update-username">Last Updated By:</label>
              <input
                id="query-update-username"
                className="form-control"
                value={filteringOptionsWithQuery.lastUpdatedBy || ''}
                onChange={onChangeUsername}
              />
              {currentUser.username && (
                <button
                  className="anchor"
                  type="button"
                  onClick={onClickUpdatedByMe}
                >
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
              <button
                type="button"
                className="btn btn-light"
                onClick={onResetFilteringOptions}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </aside>
    );
  }, [query, filteringOptions, currentUser, onChangeNameKeyword, onChangeUpdateTimeRange, onChangeUsername, onClickUpdatedByMe, onApplyFilteringOptions, onResetFilteringOptions]);

  const renderBatchesRows = useCallback(({
    data, selectedBatches, canWrite, canExecute, batchType,
  }: {
    data: BatchSummary[];
    selectedBatches: number[];
    canWrite: boolean;
    canExecute: boolean;
    batchType: string;
  }) => {
    if (!data || !data.length) {
      return null;
    }
    return data.map(batch => {
      const batchAlreadyInFavourites = itemIsInFavourites(batch.id);
      const toggleFavouriteButtonClassName = `btn ${batchAlreadyInFavourites ? 'btn' : 'btn-outline'}-primary`;
      return (
        <tr key={`batch-row-${batch.id}`}>
          <td>
            <input
              type="checkbox"
              checked={selectedBatches.indexOf(batch.id) > -1}
              onChange={event => onCheckOrUncheckBatch(batch, event, batchType)}
            />
          </td>
          <td>
            <Link to={`/detail/${batch.id}`}>{batch.name}</Link>
          </td>
          <td className="text-nowrap">{batch.lastUpdatedBy}</td>
          <td className="text-nowrap">{formatTime(batch.updateTime) || 'N/A'}</td>
          <td className="text-nowrap">
            <div className="btn-group btn-group-xs" role="group">
              <button
                className={toggleFavouriteButtonClassName}
                type="button"
                title={`${batchAlreadyInFavourites ? 'Remove from' : 'Add to'} favourites`}
                onClick={() => onToggleFavourite(batch.id, batchAlreadyInFavourites)}
              >
                <i className="fa fa-fw fa-star" />
              </button>
              {canWrite && (
                <Link
                  to={`/update/${batch.id}`}
                  className="btn btn-outline-primary"
                  title="Configure"
                >
                  <i className="fa fa-fw fa-pencil" />
                </Link>
              )}
              {canExecute && (
                <button
                  className="btn btn-outline-primary"
                  type="button"
                  title="Quick Run"
                  onClick={() => onQuickRunBatch(batch.id)}
                >
                  <i className="fa fa-fw fa-forward" />
                </button>
              )}
            </div>
            {!canWrite && !canExecute && <span className="text-muted">--</span>}
          </td>
        </tr>
      );
    });
  }, [itemIsInFavourites, onCheckOrUncheckBatch, onToggleFavourite, onQuickRunBatch]);

  const renderBatchesTable = useCallback(({ children, canExecute, sortIcon, batchType }: {
    children: React.ReactNode;
    canExecute: boolean;
    sortIcon: React.ReactNode;
    batchType: string;
  }) => {
    return (
      <table className="table table-striped mb-2">
        <thead>
          <tr>
            <th style={{ width: '7%' }}>
              <div className="btn-group">
                <button
                  data-toggle="dropdown"
                  className="btn btn-primary dropdown-toggle"
                  type="button"
                  id="dropdown-menu"
                >
                  ACTIONS
                </button>
                <div className="dropdown-menu">
                  <button
                    id="SELECT_ALL_BATCHES"
                    className="dropdown-item"
                    type="button"
                    onClick={(event: any) => onCheckOrUncheckBatches(event, batchType)}
                  >
                    Select All
                  </button>
                  <button
                    id="CLEAR"
                    className="dropdown-item"
                    type="button"
                    onClick={(event: any) => onCheckOrUncheckBatches(event, batchType)}
                  >
                    Clear
                  </button>
                  {canExecute && (
                    <button
                      id="RUN_BATCHES"
                      className="dropdown-item"
                      type="button"
                      title="Run selected Jobs"
                      onClick={onRunBatchList}
                    >
                      Run Batches
                    </button>
                  )}
                </div>
              </div>
            </th>
            <th>
              <button
                className="anchor"
                type="button"
                onClick={() => {}} // TODO: implement onToggleNameOrdering
              >
                Name {sortIcon}
              </button>
            </th>
            <th className="text-nowrap" style={{ width: '10%' }}>Last Updated By</th>
            <th className="text-nowrap" style={{ width: '10%' }}>Update Time</th>
            <th className="text-nowrap" style={{ width: '10%' }}>Actions</th>
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    );
  }, [onCheckOrUncheckBatches, onRunBatchList]);

  if (batchPage === null) {
    return <LoadingIndicator />;
  }
  if (batchPage instanceof Error) {
    return <Alert type="danger" text={String(batchPage)} />;
  }

  const { sort } = query;
  const canWrite = currentUser.canWrite;
  const canExecute = currentUser.canExecute;
  const ordering = (sort as string).split(',')[1];

  let sortIcon: React.ReactNode = null;
  if (ordering === ASC) {
    sortIcon = <i className="fa fa-fw fa-sort-alpha-asc ml-1" />;
  } else if (ordering === DESC) {
    sortIcon = <i className="fa fa-fw fa-sort-alpha-desc ml-1" />;
  }

  const filteringOptionsComponent = renderFilteringOptions();

  const favouriteBatchesRows = renderBatchesRows({
    data: favouriteBatches,
    selectedBatches: selectedFavouriteBatches,
    canExecute: canExecute,
    canWrite: canWrite,
    batchType: BATCH_TYPE.FAVOURITE_BATCHES,
  });

  const batchRows = renderBatchesRows({
    data: batchPage.content,
    selectedBatches: selectedBatches,
    canExecute: canExecute,
    canWrite: canWrite,
    batchType: BATCH_TYPE.ALL_BATCHES,
  });

  const batchListTable = batchRows ? renderBatchesTable({
    children: batchRows,
    sortIcon: sortIcon,
    canExecute: canExecute,
    batchType: BATCH_TYPE.ALL_BATCHES,
  }) : <Alert type="warning" text="No batches found." />;

  const favouriteBatchesListTable = favouriteBatchesRows ? renderBatchesTable({
    children: favouriteBatchesRows,
    sortIcon: sortIcon,
    canExecute: canExecute,
    batchType: BATCH_TYPE.FAVOURITE_BATCHES,
  }) : <Alert type="warning" text="No batches found." />;

  return (
    <div>
      <h2 className="display-4">Batches</h2>
      <div className="row">
        <div className="col-9 no-gutters">
          <div className="col-12 mt-3">
            <h2 className="display-6">Favourites</h2>
            {favouriteBatchesListTable}
          </div>
          <div className="col-12 mt-5">
            <h2 className="display-6">All batches</h2>
            {canWrite && (
              <div className="text-right my-4">
                <Link to="/create" className="btn btn-primary btn-light-primary">
                  <i className="fa fa-fw fa-plus" /> Add a new batch
                </Link>
              </div>
            )}
            {batchListTable}
            <Paginator page={batchPage} onClickPage={onClickPage} />
          </div>
        </div>
        <div className="col-3">{filteringOptionsComponent}</div>
      </div>
    </div>
  );
};

export default withCurrentUser(BatchList);