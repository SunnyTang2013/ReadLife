import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BatchCreate from '../BatchCreate';

// Mock batch service
jest.mock('../../backend/batchService', () => ({
  createBatch: jest.fn(),
  getBatchDetail: jest.fn(),
}));

// Mock components
jest.mock('../../components/ErrorAlert', () => ({ error }) => (
  <div data-testid="error-alert">{error.toString()}</div>
));

jest.mock('../../components/LoadingIndicator', () => () => (
  <div data-testid="loading-indicator">Loading...</div>
));

jest.mock('../components/BatchDetailForm', () => ({ batchDetail, onSave, onCancel, disabled }) => (
  <div data-testid="batch-detail-form">
    <button data-testid="save-button" onClick={() => onSave({ name: 'Test Batch', id: 123 })} disabled={disabled}>
      Save
    </button>
    <button data-testid="cancel-button" onClick={onCancel}>
      Cancel
    </button>
    <div data-testid="batch-detail">
      {batchDetail ? JSON.stringify(batchDetail) : 'No batch detail'}
    </div>
  </div>
));

const mockBatchService = require('../../backend/batchService');

describe('BatchCreate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithRouter = (initialEntries = ['/create']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <BatchCreate />
      </MemoryRouter>
    );
  };

  it('should render loading indicator initially', () => {
    mockBatchService.getBatchDetail.mockImplementation(() => new Promise(() => {}));
    
    renderWithRouter();
    
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  it('should render batch detail form after loading', async () => {
    const mockBatchDetail = {
      id: null,
      name: '',
      description: '',
      batchType: 'STATIC',
      jobPlainInfos: [],
    };
    
    mockBatchService.getBatchDetail.mockResolvedValue(mockBatchDetail);
    
    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.getByTestId('batch-detail-form')).toBeInTheDocument();
      expect(screen.getByTestId('save-button')).toBeInTheDocument();
      expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
    });
  });

  it('should handle batch creation successfully', async () => {
    const mockBatchDetail = {
      id: null,
      name: '',
      description: '',
      batchType: 'STATIC',
      jobPlainInfos: [],
    };
    
    const createdBatch = { id: 123, name: 'Test Batch' };
    
    mockBatchService.getBatchDetail.mockResolvedValue(mockBatchDetail);
    mockBatchService.createBatch.mockResolvedValue(createdBatch);
    
    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.getByTestId('batch-detail-form')).toBeInTheDocument();
    });
    
    const saveButton = screen.getByTestId('save-button');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockBatchService.createBatch).toHaveBeenCalledWith({ name: 'Test Batch', id: 123 });
    });
  });

  it('should display error alert on batch creation failure', async () => {
    const mockBatchDetail = {
      id: null,
      name: '',
      description: '',
      batchType: 'STATIC',
      jobPlainInfos: [],
    };
    
    const errorMessage = 'Failed to create batch';
    
    mockBatchService.getBatchDetail.mockResolvedValue(mockBatchDetail);
    mockBatchService.createBatch.mockRejectedValue(new Error(errorMessage));
    
    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.getByTestId('batch-detail-form')).toBeInTheDocument();
    });
    
    const saveButton = screen.getByTestId('save-button');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('error-alert')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should disable form during save operation', async () => {
    const mockBatchDetail = {
      id: null,
      name: '',
      description: '',
      batchType: 'STATIC',
      jobPlainInfos: [],
    };
    
    mockBatchService.getBatchDetail.mockResolvedValue(mockBatchDetail);
    mockBatchService.createBatch.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.getByTestId('batch-detail-form')).toBeInTheDocument();
    });
    
    const saveButton = screen.getByTestId('save-button');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(saveButton).toBeDisabled();
    });
  });

  it('should handle copy from existing batch', async () => {
    const fromBatchId = '456';
    const mockExistingBatch = {
      id: 456,
      name: 'Existing Batch',
      description: 'Copy me',
      batchType: 'HIERARCHY',
      jobPlainInfos: [{ id: 1, name: 'Job 1' }],
    };
    
    mockBatchService.getBatchDetail.mockResolvedValue(mockExistingBatch);
    
    renderWithRouter([`/copy/${fromBatchId}`]);
    
    await waitFor(() => {
      expect(mockBatchService.getBatchDetail).toHaveBeenCalledWith(parseInt(fromBatchId));
      expect(screen.getByTestId('batch-detail-form')).toBeInTheDocument();
    });
  });

  it('should render breadcrumb navigation correctly', async () => {
    const mockBatchDetail = {
      id: null,
      name: '',
      description: '',
      batchType: 'STATIC',
      jobPlainInfos: [],
    };
    
    mockBatchService.getBatchDetail.mockResolvedValue(mockBatchDetail);
    
    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.getByText('Batch List')).toBeInTheDocument();
      expect(screen.getByText('Create Batch')).toBeInTheDocument();
    });
  });

  it('should render correct page title for create mode', async () => {
    const mockBatchDetail = {
      id: null,
      name: '',
      description: '',
      batchType: 'STATIC',
      jobPlainInfos: [],
    };
    
    mockBatchService.getBatchDetail.mockResolvedValue(mockBatchDetail);
    
    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.getByText('Create Batch')).toBeInTheDocument();
    });
  });

  it('should render correct page title for copy mode', async () => {
    const fromBatchId = '456';
    const mockExistingBatch = {
      id: 456,
      name: 'Existing Batch',
      description: 'Copy me',
      batchType: 'HIERARCHY',
      jobPlainInfos: [],
    };
    
    mockBatchService.getBatchDetail.mockResolvedValue(mockExistingBatch);
    
    renderWithRouter([`/copy/${fromBatchId}`]);
    
    await waitFor(() => {
      expect(screen.getByText('Clone Batch')).toBeInTheDocument();
    });
  });
});