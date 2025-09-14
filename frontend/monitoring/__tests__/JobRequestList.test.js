import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import JobRequestList from '../JobRequestList';
import monitoring from '../../backend/monitoring';

// Mock the backend service
jest.mock('../../backend/monitoring');

// Mock child components
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

jest.mock('../components/JobRequestPage', () => {
  return function MockJobRequestPage(props) {
    return <div data-testid="job-request-page">Job Request Page</div>;
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

describe('JobRequestList Component', () => {
  const mockJobRequestPage = {
    content: [
      {
        id: 1,
        name: 'Test Job 1',
        status: 'SUCCESS'
      },
      {
        id: 2,
        name: 'Test Job 2', 
        status: 'RUNNING'
      }
    ],
    totalElements: 2,
    totalPages: 1
  };

  const mockJobRequestStats = {
    SUCCESS: 1,
    RUNNING: 1,
    PENDING: 0,
    FAILED: 0
  };

  beforeEach(() => {
    monitoring.getJobRequestList.mockClear();
    monitoring.getJobRequestStats.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    
    monitoring.getJobRequestList.mockResolvedValue(mockJobRequestPage);
    monitoring.getJobRequestStats.mockResolvedValue(mockJobRequestStats);
    localStorageMock.getItem.mockReturnValue('GDM');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderWithRouter = (component) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  test('displays loading indicator initially', () => {
    renderWithRouter(<JobRequestList />);
    
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  test('loads data on mount', async () => {
    renderWithRouter(<JobRequestList />);
    
    await waitFor(() => {
      expect(monitoring.getJobRequestList).toHaveBeenCalledTimes(1);
      expect(monitoring.getJobRequestStats).toHaveBeenCalledTimes(1);
    });
  });

  test('displays content after data loads', async () => {
    renderWithRouter(<JobRequestList />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('Job Requests')).toBeInTheDocument();
  });

  test('handles API errors gracefully', async () => {
    const mockError = new Error('API Error');
    monitoring.getJobRequestList.mockRejectedValue(mockError);
    
    renderWithRouter(<JobRequestList />);
    
    await waitFor(() => {
      expect(screen.getByTestId('error-alert')).toBeInTheDocument();
      expect(screen.getByText('Error: API Error')).toBeInTheDocument();
    });
  });

  test('renders filtering options', async () => {
    renderWithRouter(<JobRequestList />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('Filtering Options')).toBeInTheDocument();
    expect(screen.getByLabelText('Job Name Contains:')).toBeInTheDocument();
    expect(screen.getByLabelText('Status :')).toBeInTheDocument();
  });

  test('filtering form inputs work correctly', async () => {
    const user = userEvent.setup();
    renderWithRouter(<JobRequestList />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });
    
    const nameInput = screen.getByLabelText('Job Name Contains:');
    await user.type(nameInput, 'test job');
    expect(nameInput.value).toBe('test job');
    
    const statusSelect = screen.getByLabelText('Status :');
    await user.selectOptions(statusSelect, 'SUCCESS');
    expect(statusSelect.value).toBe('SUCCESS');
  });

  test('apply filter button works', async () => {
    const user = userEvent.setup();
    renderWithRouter(<JobRequestList />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });
    
    const applyButton = screen.getByText('Apply');
    await user.click(applyButton);
    
    expect(applyButton).toBeInTheDocument();
  });

  test('reset filter button works', async () => {
    const user = userEvent.setup();
    renderWithRouter(<JobRequestList />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });
    
    const resetButton = screen.getByText('Reset');
    await user.click(resetButton);
    
    expect(resetButton).toBeInTheDocument();
  });

  test('renders job request page component when data is available', async () => {
    renderWithRouter(<JobRequestList />);
    
    await waitFor(() => {
      expect(screen.getByTestId('job-request-page')).toBeInTheDocument();
    });
  });

  test('handles assignment group from localStorage', async () => {
    localStorageMock.getItem.mockReturnValue('MKTY');
    
    renderWithRouter(<JobRequestList />);
    
    await waitFor(() => {
      expect(monitoring.getJobRequestList).toHaveBeenCalledWith(
        expect.objectContaining({
          assignmentGroup: 'MKTY'
        })
      );
    });
  });

  test('uses default assignment group when localStorage is empty', async () => {
    localStorageMock.getItem.mockReturnValue('');
    
    renderWithRouter(<JobRequestList />);
    
    await waitFor(() => {
      expect(monitoring.getJobRequestList).toHaveBeenCalledWith(
        expect.objectContaining({
          assignmentGroup: 'GDM'
        })
      );
    });
  });
});