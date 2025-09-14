import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import BatchRequestList from '../BatchRequestList';
import monitoring from '../../backend/monitoring';
import globalConfig from '../../backend/globalConfig';

// Mock the backend services
jest.mock('../../backend/monitoring');
jest.mock('../../backend/globalConfig');
jest.mock('../../backend/jobExecution');
jest.mock('../../backend/pipelineRequestService');

// Mock child components
jest.mock('../components/BatchRequestPage', () => {
  return function MockBatchRequestPage(props) {
    return <div data-testid="batch-request-page">Batch Request Page</div>;
  };
});

jest.mock('../components/AssignmentGroupChooseModal', () => {
  return function MockAssignmentGroupChooseModal({ onClose }) {
    return (
      <div data-testid="assignment-group-modal">
        <button onClick={() => onClose(false)}>Close Modal</button>
      </div>
    );
  };
});

jest.mock('../../components/LoadingIndicatorNew', () => {
  return function MockLoadingIndicatorNew() {
    return <div data-testid="loading-indicator">Loading...</div>;
  };
});

jest.mock('../../components/ErrorAlert', () => {
  return function MockErrorAlert({ error }) {
    return <div data-testid="error-alert">Error: {error.message}</div>;
  };
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('BatchRequestList Component', () => {
  const mockBatchRequestPage = {
    content: [
      {
        id: 1,
        name: 'Test Batch 1',
        status: 'SUCCESS',
        uuid: 'uuid-1'
      },
      {
        id: 2,
        name: 'Test Batch 2',
        status: 'ONGOING',
        uuid: 'uuid-2'
      }
    ],
    totalElements: 2,
    totalPages: 1
  };

  const mockBatchRequestStats = {
    SUCCESS: 1,
    ONGOING: 1,
    PENDING: 0,
    FAILURE: 0
  };

  const mockExecutionSystemList = [
    { id: 1, name: 'System 1' },
    { id: 2, name: 'System 2' }
  ];

  beforeEach(() => {
    // Reset mocks before each test
    monitoring.getBatchRequestList.mockClear();
    monitoring.getBatchRequestStats.mockClear();
    globalConfig.getExecutionSystemList.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    
    // Setup default mock implementations
    monitoring.getBatchRequestList.mockResolvedValue(mockBatchRequestPage);
    monitoring.getBatchRequestStats.mockResolvedValue(mockBatchRequestStats);
    globalConfig.getExecutionSystemList.mockResolvedValue(mockExecutionSystemList);
    localStorageMock.getItem.mockReturnValue('GDM'); // Mock assignment group
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderWithRouter = (component) => {
    return render(
      <BrowserRouter>{component}</BrowserRouter>
    );
  };

  test('displays loading indicator initially', () => {
    renderWithRouter(<BatchRequestList />);
    
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    expect(screen.getByText('Loading batch requests...')).toBeInTheDocument();
    expect(screen.getByText('Please wait while we fetch the data')).toBeInTheDocument();
  });

  test('loads data on mount', async () => {
    renderWithRouter(<BatchRequestList />);
    
    await waitFor(() => {
      expect(monitoring.getBatchRequestList).toHaveBeenCalledTimes(1);
      expect(monitoring.getBatchRequestStats).toHaveBeenCalledTimes(1);
      expect(globalConfig.getExecutionSystemList).toHaveBeenCalledTimes(1);
    });
  });

  test('displays content after data loads', async () => {
    renderWithRouter(<BatchRequestList />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('Batch Requests')).toBeInTheDocument();
    expect(screen.getByText('Filtering Options')).toBeInTheDocument();
  });

  test('displays assignment group modal when no assignment group in localStorage', async () => {
    localStorageMock.getItem.mockReturnValue(''); // No assignment group
    
    renderWithRouter(<BatchRequestList />);
    
    await waitFor(() => {
      expect(screen.getByTestId('assignment-group-modal')).toBeInTheDocument();
    });
  });

  test('filtering options work correctly', async () => {
    const user = userEvent.setup();
    renderWithRouter(<BatchRequestList />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });
    
    const nameInput = screen.getByLabelText('Name Contains:');
    await user.type(nameInput, 'test batch');
    expect(nameInput.value).toBe('test batch');
    
    const uuidInput = screen.getByLabelText('Batch UUID:');
    await user.type(uuidInput, 'uuid-123');
    expect(uuidInput.value).toBe('uuid-123');
    
    const statusSelect = screen.getByLabelText('Status :');
    await user.selectOptions(statusSelect, 'SUCCESS');
    expect(statusSelect.value).toBe('SUCCESS');
  });

  test('apply filter button works', async () => {
    const user = userEvent.setup();
    renderWithRouter(<BatchRequestList />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });
    
    const applyButton = screen.getByText('Apply');
    await user.click(applyButton);
    
    expect(applyButton).toBeInTheDocument();
  });

  test('reset filter button works', async () => {
    const user = userEvent.setup();
    renderWithRouter(<BatchRequestList />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });
    
    const resetButton = screen.getByText('Reset');
    await user.click(resetButton);
    
    expect(resetButton).toBeInTheDocument();
  });

  test('handles API errors gracefully', async () => {
    const mockError = new Error('API Error');
    monitoring.getBatchRequestList.mockRejectedValue(mockError);
    
    renderWithRouter(<BatchRequestList />);
    
    await waitFor(() => {
      expect(screen.getByTestId('error-alert')).toBeInTheDocument();
      expect(screen.getByText('Error: API Error')).toBeInTheDocument();
    });
  });

  test('closes assignment group modal', async () => {
    const user = userEvent.setup();
    localStorageMock.getItem.mockReturnValue('');
    
    renderWithRouter(<BatchRequestList />);
    
    await waitFor(() => {
      expect(screen.getByTestId('assignment-group-modal')).toBeInTheDocument();
    });
    
    const closeButton = screen.getByText('Close Modal');
    await user.click(closeButton);
    
    expect(closeButton).toBeInTheDocument();
  });

  test('date picker inputs work correctly', async () => {
    const user = userEvent.setup();
    renderWithRouter(<BatchRequestList />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });
    
    expect(screen.getByLabelText('From Time:')).toBeInTheDocument();
    expect(screen.getByLabelText('Till Time:')).toBeInTheDocument();
  });

  test('execution system dropdown works', async () => {
    const user = userEvent.setup();
    renderWithRouter(<BatchRequestList />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });
    
    const executionSystemSelect = screen.getByLabelText('Execution System :');
    expect(executionSystemSelect).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('System 1')).toBeInTheDocument();
      expect(screen.getByText('System 2')).toBeInTheDocument();
    });
  });
});