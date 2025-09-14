import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BatchDetailForm from '../BatchDetailForm';

// Mock backend services
jest.mock('../../../backend/globalConfig', () => ({
  getJobConfigGroupCategories: jest.fn(),
  getConfigGroupsByCategory: jest.fn(),
}));

jest.mock('../../../backend/job', () => ({
  searchJobs: jest.fn(),
}));

// Mock components
jest.mock('../../../components/ParametersTable', () => ({ parameters, onChange }) => (
  <div data-testid="parameters-table" onClick={() => onChange && onChange({ entries: {} })}>
    Parameters: {Object.keys(parameters.entries).length}
  </div>
));

jest.mock('../../../components/ValuesTable', () => ({ values, onChange }) => (
  <div data-testid="values-table" onClick={() => onChange && onChange([])}>
    Values: {values.length}
  </div>
));

jest.mock('../JobSelector', () => ({ originalJobList, runJobList, onAddJobToRunList }) => (
  <div data-testid="job-selector">
    <div data-testid="original-jobs">Original: {originalJobList.length}</div>
    <div data-testid="run-jobs">Run: {runJobList.length}</div>
    <button data-testid="add-job" onClick={() => onAddJobToRunList([{ id: 1, name: 'Test Job' }])}>
      Add Job
    </button>
  </div>
));

jest.mock('../OriginalDefinitionBlock', () => ({ input, onChangeType, onChangeCategory, onChangeOriginalId }) => (
  <div data-testid="original-definition-block">
    <select data-testid="type-select" onChange={(e) => onChangeType(e.target.value)}>
      <option value="STATIC">Static</option>
      <option value="HIERARCHY">Hierarchy</option>
      <option value="LABEL">Label</option>
    </select>
    <input data-testid="category-input" onChange={(e) => onChangeCategory(e.target.value)} />
    <input data-testid="original-id-input" onChange={(e) => onChangeOriginalId(e.target.value)} />
  </div>
));

const mockGlobalConfig = require('../../../backend/globalConfig');
const mockJob = require('../../../backend/job');

describe('BatchDetailForm', () => {
  const defaultBatchDetail = {
    id: null,
    name: '',
    description: '',
    batchType: 'STATIC',
    batchTypeName: '',
    entity: '',
    containInJobName: '',
    notContainInJobName: '',
    jobPlainInfos: [],
    overriddenParameters: { entries: {} },
    filterParameters: { entries: {} },
    rodParameters: { entries: {} },
    adGroups: [],
  };

  const defaultProps = {
    batchDetail: defaultBatchDetail,
    onSave: jest.fn(),
    onCancel: jest.fn(),
    disabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGlobalConfig.getJobConfigGroupCategories.mockResolvedValue([]);
    mockGlobalConfig.getConfigGroupsByCategory.mockResolvedValue([]);
    mockJob.searchJobs.mockResolvedValue([]);
  });

  it('should render without crashing', async () => {
    render(<BatchDetailForm {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('original-definition-block')).toBeInTheDocument();
    });
  });

  it('should display batch name input', () => {
    render(<BatchDetailForm {...defaultProps} />);
    
    const nameInput = screen.getByLabelText(/Batch Name/);
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveValue('');
  });

  it('should display batch description textarea', () => {
    render(<BatchDetailForm {...defaultProps} />);
    
    const descriptionInput = screen.getByLabelText(/Description/);
    expect(descriptionInput).toBeInTheDocument();
  });

  it('should handle name input changes', () => {
    render(<BatchDetailForm {...defaultProps} />);
    
    const nameInput = screen.getByLabelText(/Batch Name/);
    fireEvent.change(nameInput, { target: { value: 'Test Batch' } });
    
    expect(nameInput).toHaveValue('Test Batch');
  });

  it('should handle description input changes', () => {
    render(<BatchDetailForm {...defaultProps} />);
    
    const descriptionInput = screen.getByLabelText(/Description/);
    fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });
    
    expect(descriptionInput).toHaveValue('Test Description');
  });

  it('should display job selector for static batch type', async () => {
    const propsWithStaticType = {
      ...defaultProps,
      batchDetail: { ...defaultBatchDetail, batchType: 'STATIC' },
    };
    
    render(<BatchDetailForm {...propsWithStaticType} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('job-selector')).toBeInTheDocument();
    });
  });

  it('should display original definition block for non-static batch types', async () => {
    const propsWithHierarchyType = {
      ...defaultProps,
      batchDetail: { ...defaultBatchDetail, batchType: 'HIERARCHY' },
    };
    
    render(<BatchDetailForm {...propsWithHierarchyType} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('original-definition-block')).toBeInTheDocument();
    });
  });

  it('should handle batch type changes', async () => {
    render(<BatchDetailForm {...defaultProps} />);
    
    await waitFor(() => {
      const typeSelect = screen.getByTestId('type-select');
      fireEvent.change(typeSelect, { target: { value: 'HIERARCHY' } });
    });
    
    // Should trigger internal state update
    expect(mockGlobalConfig.getJobConfigGroupCategories).toHaveBeenCalled();
  });

  it('should display parameters tables', () => {
    render(<BatchDetailForm {...defaultProps} />);
    
    const parametersTables = screen.getAllByTestId('parameters-table');
    expect(parametersTables).toHaveLength(3); // Override, Filter, Rod parameters
  });

  it('should display values table for AD groups', () => {
    render(<BatchDetailForm {...defaultProps} />);
    
    const valuesTable = screen.getByTestId('values-table');
    expect(valuesTable).toBeInTheDocument();
  });

  it('should handle save button click', () => {
    const onSave = jest.fn();
    const props = { ...defaultProps, onSave };
    
    render(<BatchDetailForm {...props} />);
    
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    
    expect(onSave).toHaveBeenCalled();
  });

  it('should handle cancel button click', () => {
    const onCancel = jest.fn();
    const props = { ...defaultProps, onCancel };
    
    render(<BatchDetailForm {...props} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(onCancel).toHaveBeenCalled();
  });

  it('should disable form when disabled prop is true', () => {
    const props = { ...defaultProps, disabled: true };
    
    render(<BatchDetailForm {...props} />);
    
    const saveButton = screen.getByText('Save');
    expect(saveButton).toBeDisabled();
    
    const nameInput = screen.getByLabelText(/Batch Name/);
    expect(nameInput).toBeDisabled();
  });

  it('should handle entity filter changes', () => {
    render(<BatchDetailForm {...defaultProps} />);
    
    const entityInput = screen.getByLabelText(/Entity/);
    fireEvent.change(entityInput, { target: { value: 'TEST_ENTITY' } });
    
    expect(entityInput).toHaveValue('TEST_ENTITY');
  });

  it('should handle job name filters', () => {
    render(<BatchDetailForm {...defaultProps} />);
    
    const containInput = screen.getByLabelText(/Contain In Job Name/);
    const notContainInput = screen.getByLabelText(/Not Contain In Job Name/);
    
    fireEvent.change(containInput, { target: { value: 'INCLUDE_ME' } });
    fireEvent.change(notContainInput, { target: { value: 'EXCLUDE_ME' } });
    
    expect(containInput).toHaveValue('INCLUDE_ME');
    expect(notContainInput).toHaveValue('EXCLUDE_ME');
  });

  it('should populate form with existing batch details', () => {
    const existingBatch = {
      ...defaultBatchDetail,
      name: 'Existing Batch',
      description: 'Existing Description',
      entity: 'EXISTING_ENTITY',
      containInJobName: 'EXISTING_CONTAIN',
      notContainInJobName: 'EXISTING_NOT_CONTAIN',
    };
    
    const props = { ...defaultProps, batchDetail: existingBatch };
    
    render(<BatchDetailForm {...props} />);
    
    expect(screen.getByDisplayValue('Existing Batch')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing Description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('EXISTING_ENTITY')).toBeInTheDocument();
    expect(screen.getByDisplayValue('EXISTING_CONTAIN')).toBeInTheDocument();
    expect(screen.getByDisplayValue('EXISTING_NOT_CONTAIN')).toBeInTheDocument();
  });
});