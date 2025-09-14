import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactEcharts from 'echarts-for-react';
import { isEqual, isNull } from 'lodash';
import Select from 'react-select';
import jsPDF from 'jsPDF';
import queryString from 'query-string';

import metrics from '../backend/metrics';
import metricsTools from './metricsTools';
import './style.css';
import MetricFooterDetails from './metricFooterDetails';
import LoadingIndicator from '../components/LoadingIndicator';
import ErrorAlert from '../components/ErrorAlert';

function getDefaultQuery() {
  return {
    testType: 'PANDORA',
    pandoraBuildKey: '',
  };
}

const Metric = () => {
  const [testType, setTestType] = useState('PANDORA');
  const [pandoraBuildKey, setPandoraBuildKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState('');
  const [selectedMetric, setSelectedMetric] = useState('totalTime');
  const [jobNamesList, setJobNamesList] = useState([]);
  const [globalMessages, setGlobalMessages] = useState([]);
  const [distinctPandoraVersions, setDistinctPandoraVersions] = useState([]);
  const [metricsDetail, setMetricsDetail] = useState([]);
  const [totByJobLog, setTotByJobLog] = useState(false);
  const [totByTaskLog, setTotByTaskLog] = useState(false);
  const [thresholdActiveStatus, setThresholdActiveStatus] = useState(false);
  const [thresholdMode, setThresholdMode] = useState(false);
  const [dropDownMenuFlag, setDropDownMenuFlag] = useState([]);
  const [selectedStateAction, setSelectedStateAction] = useState('ALL');
  const [selectedStateJobAction, setSelectedStateJobAction] = useState('ALL');
  const [selectedStateJobsListCumul, setSelectedStateJobsListCumul] = useState('ALL');
  const [pdfInProgress, setPdfInProgress] = useState(false);
  const [filteringOptions, setFilteringOptions] = useState({
    testType: 'PANDORA',
    pandoraBuildKey: '',
  });

  const navigate = useNavigate();
  const location = useLocation();

  // Mock current user
  const currentUser = { username: 'admin', canWrite: true, canExecute: true };

  // Static action lists
  const staticGCPActions = 'AtlasRun,AtlasIntrospect,AtlasJoin,Atlas_TradesJoiner,Split';
  const staticITActions = 'CppCheck,FetchTrades,FetchTradesFromFolder,FetchTradesFromGoldenEye,FetchTradesFromXDS,FetchVersionizedTradesFromXDS,FileReader,FileWriter,JavaCheck,ReadTradecacheQuery,rodsCombinedTradeQueryAction,TradeCacheIdQueryAction,TradeCacheTradeOnlyFetchAction,UncompressContent,XdsCheck';
  const staticIntrospectionActions = 'AdjustDates1,Atlas_VaR_Introspect,AtlasIntrospect,AtlasIntrospectRrao,BSM_IntrospectMarketDataLabels,FetchIncRollMarketData,FetchScenarios,FetchTimeStep,Introspect,Introspection,IntrospectMarketData,IntrospectMarketDataWithDependencies,IntrospectMarketDataWithDependenciesAndTimeSeries,IntrospectMarketDataWithDependenciesOnly,LoadDealFiltersFromXDS,LoadFxRates4BackdatedAdj,LoadFxRates4PnL,LoadHierarchy4PnL,LoadPreProcessingDataFromDataSource,Pandora_Introspect,ResolveXDSPathList,ScenarioIntrospect,VaR_Introspect';
  const staticComputationActions = 'AdjustInstructionDates,Atlas_Process_Goldeneye_Trades,Atlas_TradesJoiner,Atlas_VaR_Join,Atlas_VaR_PreComputation,Atlas_VaR_Run,AtlasAggregateLegs,AtlasInterface_Build,AtlasInterface_Execute,AtlasInterface_Fetch,AtlasInterface_Join,AtlasJoin,AtlasProcessPbmDesc,AtlasRun,BSM_BuildInstruction,BSM_CalculateCashFlows,BSM_CalculateCS01,BSM_CalculatePV,BuildInstruction,BuildOmrcMarketData,BuildPnLInstructionForBonds,BuildQML,BuildRoleList,BuildTradeQuery,CalcPnL4Adjustments,CalcPnL4BackdatedAdj,CalcPnL4CancTrades,CalcPnL4MatTrades,CalcPnL4OpenBonds,CalcPnL4OpenTrades,CalcPnLMvmts,CalculateBondQuotationRisk,CalculateCashFlows,CalculateCashFlowsAnalyticsUsingTOM,CalculateCashFlowsUsingTOM,CalculateCMTSpreadRisk,CalculateConvertibilityRatesDelta,CalculateCorrelationRisk,CalculateCRM,CalculateCRMUsingTOM,CalculateCrossGamma,CalculateCS01,CalculateCS01UsingTOM,CalculateDelta,CalculateDeltaUsingTOM,CalculateDeltaWithIndexTerm,CalculateDiscountCurve,CalculateEvents,CalculateFixingDV01,CalculateFixingDV01UsingTOM,CalculateForwardCurve,CalculateFraSpdsMatrix,CalculateFXDelta,CalculateFXVega,CalculateFXVolga,CalculateGamma,CalculateGaussianVega,CalculateIncRoll,CalculateInflationConvexity,CalculateInflationDelta,CalculateInflationDeltaUsingTOM,CalculateInflationSeasonality,CalculateInflationSmile,CalculateInflationVega,CalculateLocalCorrelationRisk,CalculateMMMFactors,CalculateMonoCcyBasisSwapRisk,CalculatePnLLadder,CalculatePnLLadderUsingTOM,CalculatePV,CalculatePVAnalytics,CalculatePVAnalyticsRWA,CalculatePVAnalyticsUsingTOM,CalculatePvOMRC,CalculatePVUsingTOM,CalculateRepoSpreadDV01,CalculateRepoSpreadDV01UsingTOM,CalculateSensitivityFixing,CalculateSmile,CalculateTradeCharacteristics,CalculateTradesInPandoraFormat,CalculateVanna,CalculateVaR,CalculateVaRDoubleSplit,CalculateVega,CalculateXccySwapSpreadRisk,CalculateXccySwapSpreadRiskUsingTOM,CalculateZCRiskMask,CalculateZCRiskMaskUsingTOM,CalcXccySwapSpreadRisk,CheckBondDealSettings,CheckTrade,CrossCombineFlowsTradeAndVaRScenaPackage,CSV2XMLConversion,CustomizeMarketData,Dist_CreateTasks,Dist_CreateTasksWithCustomMarketData,Dist_Join,Dist_JoinCorrelationRisk,Dist_JoinCRM,Dist_JoinCS01,Dist_JoinDelta,Dist_JoinDiscountCurve,Dist_JoinForwardCurve,Dist_JoinFXDelta,Dist_JoinGamma,Dist_JoinGaussianVega,Dist_JoinLocalCorrelationRisk,Dist_JoinMonoCcyBasisSwapRisk,Dist_JoinPnLLadder,Dist_JoinRepoSpreadDV01,Dist_JoinSensitivityFixing,Dist_JoinSmile,Dist_JoinVega,Dist_JoinXccySwapSpreadRisk,Dist_JoinZCRiskMask,Dist_Run,DummyAdjustmentStateMachine,DummyBackdatedAdjStateMachine,DummyStateMachine,Execute,ExecuteSimul,ExecuteSimulPassThrough,ExtractMurexTradeInfo,FactoriseProducts,FetchTradesFromLocalFolder,FetchTradesPassThrough,FileReaderConversion,FilterBondDealSettingsLabels,FilterDeals,FilterDuplicates_OnMarketData,FilterDuplicates_OnMarketDataLabels,FilterDuplicates_OnRoleMapping,IntrospectMarketDataLabels4PnL,IntrospectMarketDataLabelsLight,IntrospectMarketDataLabelsUsingTOM,IntrospectMarketDataLabelsWithStatics,Join,LoadTradeContent,LoadTradeDetails,MakeVaRScenarioPackages,MakeVaRScenarios,MarketDataForVersionizedCache,MarketLevel,MaskIdentificator,MergeMurexTradeInfo,MockTradesConsumer,OmrcLoadInputFiles,OmrcMarketDataOverride,PackBonds,Pandora_FetchJoiner,Pandora_Join,Pandora_PostJoin,Pandora_PostRun,Pandora_PreComputation,Pandora_ProcessPbmDesc,Pandora_Run,Pandora_Split,Pandora_TradesJoiner,PrepareProductsFactorisation,Process_Goldeneye_Trades,ProcessPbmDesc,ProcessTradesForPandoraSplit,ProcessTradesForSpirit,ReadMurexTradePRN,ReadSimuDataPaths,ReadVaRFiles,RejectTrade,ResultSinkTransformer,RodsTransformTrade,RodsTransformTradeNoId,Run,ScenarioData,ScenarioJoin,ScenarioRun,ScenarioRunBase,Simul_CSVFormatter,SimulError_CSVFormatter,Split,SplitBaseline,SplitScenarios,SurfaceRun,TradeInfo,TradesJoiner,TradeSourceTransformer,TradesRolesMarketDataPassThrough,VaR_CSVFormatter,VaR_Join,VaR_PreComputation,VaR_Run,VaR_Split,VaRErrors_CSVFormatter,Vectorise4BackdatedAdj,VectorisedPnLMvmts';

  // Internal state for selections
  let selectedAction = 'ALL';
  let selectedJobAction = 'ALL';
  let selectedJobsListCumul = 'ALL';
  let thresholdValue = 0;
  let reportLooser = '';
  let reportGainer = '';
  let allJobsOrder = '';

  const query = useCallback(() => {
    const searchQuery = queryString.parse(location.search);
    return Object.assign({}, getDefaultQuery(), filteringOptions, searchQuery);
  }, [location.search, filteringOptions]);

  const getQueryUrl = useCallback((overrides) => {
    const nextQuery = Object.assign({}, query(), overrides);
    return `${location.pathname}?${queryString.stringify(nextQuery)}`;
  }, [query, location.pathname]);

  useEffect(() => {
    const filterOptions = query();
    if (filterOptions.pandoraBuildKey && filterOptions.testType) {
      setLoading(true);
      setMetricsDetail([]);
      setFilteringOptions(filterOptions);
      loadMetricsById(filterOptions.pandoraBuildKey, filterOptions.testType);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.keyCode === 13 && e.target.id && e.target.id.indexOf('query-p') !== -1) {
        onApplyFilteringOptions();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const loadMetricsById = useCallback(async (id, testTypeValue) => {
    try {
      const data = await metrics.getMetricsById(id, testTypeValue);
      setMetricsDetail(data.metricLinesList);
      setDistinctPandoraVersions(data.distinctPandoraVersions);
      setJobNamesList(data.distinctJobs);
      analyseGlobalStatus(data.metricLinesList);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load metrics:', error);
      setMetricsDetail(error);
      setLoading(false);
    }
  }, []);

  const analyseGlobalStatus = useCallback((metricsLines) => {
    const tempListJobs = metricsLines.map(item => item.jobname);
    const distinctJobs = tempListJobs.filter((item, idx) => (tempListJobs.indexOf(item) === idx));
    const tempListActions = metricsLines.map(item => JSON.parse(item.actionDetails).name);
    const distinctActions = tempListActions.filter((item, idx) => ((tempListActions.indexOf(item) === idx)));

    // Simplified analysis - you would implement full analysis here
    const globalMessage = ['Analysis completed'];
    setGlobalMessages(globalMessage);
  }, []);

  const onChangePandoraBuildKey = useCallback((event) => {
    const value = event.target.value;
    setFilteringOptions(prevState => ({
      ...prevState,
      pandoraBuildKey: value
    }));
  }, []);

  const onChangeTestType = useCallback((event) => {
    const value = event.target.value;
    setFilteringOptions(prevState => ({
      ...prevState,
      testType: value
    }));
  }, []);

  const onApplyFilteringOptions = useCallback(() => {
    const queryOverrides = Object.assign({}, filteringOptions);
    const url = getQueryUrl(queryOverrides);
    navigate(url);
  }, [filteringOptions, getQueryUrl, navigate]);

  const onResetFilteringOptions = useCallback(() => {
    setFilteringOptions({});
    const queryOverrides = {
      pandoraBuildKey: '',
      testType: 'PANDORA',
    };
    const url = getQueryUrl(queryOverrides);
    navigate(url);
  }, [getQueryUrl, navigate]);

  const onSelectJob = useCallback((option) => {
    setSelectedJob(option.value);
  }, []);

  const onSelectMetric = useCallback((event) => {
    setSelectedMetric(event.target.value);
  }, []);

  const onChangeTotByJobLog = useCallback((event) => {
    setTotByJobLog(event.target.checked);
  }, []);

  const onChangeTotByTaskLog = useCallback((event) => {
    setTotByTaskLog(event.target.checked);
  }, []);

  const onThresholdActivation = useCallback((event) => {
    setThresholdActiveStatus(event.target.checked);
  }, []);

  const onThresholdValueChange = useCallback((event) => {
    thresholdValue = event.target.value;
  }, []);

  const onMenuCollapse = useCallback((menuName) => {
    setDropDownMenuFlag(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  }, []);

  const onExportToPdf = useCallback(async () => {
    setPdfInProgress(true);
    try {
      // Simplified PDF export - you would implement full export here
      console.log('Exporting to PDF...');
      setTimeout(() => {
        setPdfInProgress(false);
      }, 2000);
    } catch (e) {
      console.error('Failed to export:', e);
      setPdfInProgress(false);
    }
  }, []);

  const renderFilteringOptions = () => {
    const filterOptions = Object.assign({}, query(), filteringOptions);

    return (
      <aside>
        <h2 className="display-6">Filtering Options</h2>
        <div className="card">
          <div className="card-body">
            <div className="form-group">
              <label htmlFor="query-p-build-key">Pandora Build Key:</label>
              <input 
                id="query-p-build-key" 
                className="form-control" 
                value={filterOptions.pandoraBuildKey || ''} 
                onChange={onChangePandoraBuildKey} 
              />
            </div>
            <div className="form-group">
              <label htmlFor="query-test-type">Test Type:</label>
              <select
                id="query-test-type"
                className="form-control"
                value={filterOptions.testType || 'PANDORA'}
                onChange={onChangeTestType}
              >
                <option value="PANDORA">PANDORA</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>
            <div className="form-group">
              <button
                type="button"
                className="btn btn-primary mr-2"
                onClick={onApplyFilteringOptions}
              >
                Apply
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
  };

  const renderCharts = (metricsLines) => {
    if (!metricsLines || metricsLines.length === 0) {
      return <div>{<h2>No metrics data available</h2>}</div>;
    }

    // Simplified chart rendering - you would implement full chart logic here
    return (
      <div>
        <h2>Metrics Charts</h2>
        <div className="alert alert-info">
          {`Found ${metricsLines.length} metric entries`}
        </div>
      </div>
    );
  };

  if ((metricsDetail.length === 0) && (loading === true)) {
    return <LoadingIndicator text="Loading ..." />;
  }

  if (metricsDetail instanceof Error) {
    return <ErrorAlert error={metricsDetail} />;
  }

  const filteringOptionsElement = renderFilteringOptions();
  let charts = <h2>We will show Metrics here</h2>;

  // Speed up so we start generating chart only once all available
  if (!loading) {
    charts = renderCharts(metricsDetail);
  }

  const angleFooterDetail = dropDownMenuFlag.collapseFooter
    ? 'fa-angle-down' : 'fa-angle-right';

  return (
    <div>
      {filteringOptionsElement}
      <div>
        <div>{charts}</div>
        <ol className="breadcrumb">
          <a
            className="btn btn-link"
            data-toggle="collapse"
            href="#collapseFooter"
            role="button"
            id="btn-technicals"
            aria-expanded="false"
            aria-controls="collapseFooter"
            style={{ fontSize: '2rem' }}
            onClick={() => onMenuCollapse('collapseFooter')}
          >
            <i className={`fa fa-fw ${angleFooterDetail}`} />
            {' Technicals informations'}
          </a>
        </ol>
        <div className="shadow collapse p-3 mb-5 bg-white rounded" id="collapseFooter">
          <MetricFooterDetails 
            globalMessages={globalMessages} 
            allJobsOrder={allJobsOrder} 
            distinctPandoraVersions={distinctPandoraVersions} 
            metricsDetail={metricsDetail} 
          />
        </div>
        <div className="flex-container">
          <button
            type="button"
            className="btn btn-primary mt-lg-4"
            onClick={onExportToPdf}
          >
            Export To Pdf
          </button>
          {pdfInProgress === true ? (
            <div className="my-2 py-2 text-muted text-lg-1">
              <i className="fa fa-fw fa-spinner fa-spin mr-1" />
              {' Please Wait For PDF Report ...'}
            </div>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
};

export default Metric;