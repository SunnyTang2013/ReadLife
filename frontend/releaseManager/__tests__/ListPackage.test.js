import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import ListPackage from '../ListPackage';

// Mock releaseService
jest.mock('../backend/releaseService', () => ({
  listPackage: jest.fn(),
}));

// Mock utilities
jest.mock('../utils/utilities', () => ({
  formatTimeByFormatStr: jest.fn((date, format) => {
    if (format === 'YYYYMMDD') {
      return '20231201';
    }
    return 'formatted-date';
  }),
}));

// Mock components
jest.mock('../components/ErrorAlert', () => ({ error }) => (
  <div data-testid="error-alert">{error.toString()}</div>
));

jest.mock('../components/LoadingIndicator', () => () => (
  <div data-testid="loading-indicator">Loading...</div>
));

// Mock DatePicker
jest.mock('react-datepicker', () => ({ selected, onChange }) => (
  <input 
    data-testid="date-picker" 
    value={selected ? selected.toISOString().split('T')[0] : ''}
    onChange={(e) => onChange(new Date(e.target.value))}
  />
));

const mockReleaseService = require('../backend/releaseService');

describe('ListPackage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  const renderWithRouter = () => {
    return render(
      <MemoryRouter>
        <ListPackage />
      </MemoryRouter>
    );
  };

  it('should render without crashing', () => {
    renderWithRouter();
    
    expect(screen.getByText('Release Manager')).toBeInTheDocument();
    expect(screen.getByText('Package List')).toBeInTheDocument();
  });

  it('should set sessionStorage refresh flag on mount', () => {
    renderWithRouter();
    
    expect(window.sessionStorage.setItem).toHaveBeenCalledWith('refresh', 'true');
  });

  it('should render date picker', () => {
    renderWithRouter();
    
    expect(screen.getByTestId('date-picker')).toBeInTheDocument();
  });

  it('should render version input field', () => {
    renderWithRouter();
    
    const versionInput = screen.getByPlaceholderText('Version');
    expect(versionInput).toBeInTheDocument();
  });

  it('should render refresh button', () => {
    renderWithRouter();
    
    const refreshButton = screen.getByText('Refresh');
    expect(refreshButton).toBeInTheDocument();
  });

  it('should load data successfully', async () => {
    const mockPackageList = [
      { name: 'package1', version: '1.0.0', createTime: '2023-12-01' },
      { name: 'package2', version: '2.0.0', createTime: '2023-12-01' }
    ];
    
    mockReleaseService.listPackage.mockResolvedValue({
      status: 'SUCCESS',
      data: { packageList: mockPackageList }
    });

    renderWithRouter();
    
    await waitFor(() => {
      expect(mockReleaseService.listPackage).toHaveBeenCalledWith('20231201');
    });

    await waitFor(() => {
      expect(screen.getByText('package1')).toBeInTheDocument();
      expect(screen.getByText('package2')).toBeInTheDocument();
    });
  });

  it('should display loading indicator while fetching data', async () => {
    mockReleaseService.listPackage.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithRouter();
    
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  it('should handle API error', async () => {
    mockReleaseService.listPackage.mockResolvedValue({
      status: 'FAILED',
      message: 'API Error'
    });

    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.getByText('Fail to get package list !')).toBeInTheDocument();
    });
  });

  it('should handle network error', async () => {
    const mockError = new Error('Network error');
    mockReleaseService.listPackage.mockRejectedValue(mockError);

    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.getByTestId('error-alert')).toBeInTheDocument();
      expect(screen.getByTestId('error-alert')).toHaveTextContent('Network error');
    });
  });

  it('should update date when date picker changes', async () => {
    mockReleaseService.listPackage.mockResolvedValue({
      status: 'SUCCESS',
      data: { packageList: [] }
    });

    renderWithRouter();
    
    const datePicker = screen.getByTestId('date-picker');
    fireEvent.change(datePicker, { target: { value: '2023-12-15' } });
    
    // Should trigger a new API call with the new date
    await waitFor(() => {
      expect(mockReleaseService.listPackage).toHaveBeenCalledTimes(2); // Initial + after date change
    });
  });

  it('should handle version input changes', () => {
    renderWithRouter();
    
    const versionInput = screen.getByPlaceholderText('Version');
    fireEvent.change(versionInput, { target: { value: '1.2.3' } });
    
    expect(versionInput.value).toBe('1.2.3');
  });

  it('should refresh data when refresh button is clicked', async () => {
    mockReleaseService.listPackage.mockResolvedValue({
      status: 'SUCCESS',
      data: { packageList: [] }
    });

    renderWithRouter();
    
    // Clear the initial call
    jest.clearAllMocks();
    
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    await waitFor(() => {
      expect(mockReleaseService.listPackage).toHaveBeenCalledWith('20231201');
    });
  });

  it('should not call API when createDate is null', async () => {
    renderWithRouter();
    
    // Clear the initial call
    jest.clearAllMocks();
    
    // Simulate null createDate by changing to empty value
    const datePicker = screen.getByTestId('date-picker');
    fireEvent.change(datePicker, { target: { value: '' } });
    
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    // Should not call API when date is invalid
    expect(mockReleaseService.listPackage).not.toHaveBeenCalled();
  });

  it('should render package table when packages are loaded', async () => {
    const mockPackageList = [
      { 
        name: 'test-package', 
        version: '1.0.0', 
        createTime: '2023-12-01T10:00:00Z',
        status: 'SUCCESS' 
      }
    ];
    
    mockReleaseService.listPackage.mockResolvedValue({
      status: 'SUCCESS',
      data: { packageList: mockPackageList }
    });

    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.getByText('Package Name')).toBeInTheDocument();
      expect(screen.getByText('Version')).toBeInTheDocument();
      expect(screen.getByText('Create Time')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('test-package')).toBeInTheDocument();
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
    });
  });

  it('should display empty state when no packages are found', async () => {
    mockReleaseService.listPackage.mockResolvedValue({
      status: 'SUCCESS',
      data: { packageList: [] }
    });

    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.getByText('No packages found for the selected date.')).toBeInTheDocument();
    });
  });
});