import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BatchSubmitted from '../BatchSubmitted';

// Mock monitoring backend
jest.mock('../../backend/monitoring', () => ({
  getBatchRequest: jest.fn(),
}));

// Mock components
jest.mock('../../components/ErrorAlert', () => ({ error }) => (
  <div data-testid="error-alert">{error.toString()}</div>
));

jest.mock('../../components/LoadingIndicator', () => ({ text }) => (
  <div data-testid="loading-indicator">{text}</div>
));

jest.mock('../../components/RequestStatusBadge', () => ({ status }) => (
  <div data-testid="status-badge">{status}</div>
));

const mockMonitoring = require('../../backend/monitoring');

describe('BatchSubmitted', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithRouter = (component, initialEntries = ['/batch-request-submitted/123']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        {component}
      </MemoryRouter>
    );
  };

  it('should render loading indicator initially', () => {
    mockMonitoring.getBatchRequest.mockImplementation(() => new Promise(() => {}));
    
    renderWithRouter(<BatchSubmitted />);
    
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    expect(screen.getByText('Loading batch request...')).toBeInTheDocument();
  });

  it('should render error alert on API failure', async () => {
    const errorMessage = 'Failed to load batch request';
    mockMonitoring.getBatchRequest.mockRejectedValue(new Error(errorMessage));
    
    renderWithRouter(<BatchSubmitted />);
    
    await waitFor(() => {
      expect(screen.getByTestId('error-alert')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should render batch submission details on success', async () => {
    const mockBatchRequest = {
      id: '123',
      batchId: 456,
      status: 'PENDING',
    };
    
    mockMonitoring.getBatchRequest.mockResolvedValue(mockBatchRequest);
    
    renderWithRouter(<BatchSubmitted />);
    
    await waitFor(() => {
      expect(screen.getByText('Batch Submitted')).toBeInTheDocument();
      expect(screen.getByText(/Batch has been submitted with status:/)).toBeInTheDocument();
      expect(screen.getByTestId('status-badge')).toHaveTextContent('PENDING');
    });
  });

  it('should render correct navigation links', async () => {
    const mockBatchRequest = {
      id: '123',
      batchId: 456,
      status: 'SUCCESS',
    };
    
    mockMonitoring.getBatchRequest.mockResolvedValue(mockBatchRequest);
    
    renderWithRouter(<BatchSubmitted />);
    
    await waitFor(() => {
      const returnLink = screen.getByText('Return To Batch #456');
      expect(returnLink).toBeInTheDocument();
      expect(returnLink.closest('a')).toHaveAttribute('href', '/detail/456');
      
      const detailLink = screen.getByText('View Batch Request Detail');
      expect(detailLink).toBeInTheDocument();
      expect(detailLink).toHaveAttribute('href', '/frontend/monitoring/batch-request/detail/123');
    });
  });

  it('should render breadcrumb navigation', async () => {
    const mockBatchRequest = {
      id: '123',
      batchId: 456,
      status: 'SUCCESS',
    };
    
    mockMonitoring.getBatchRequest.mockResolvedValue(mockBatchRequest);
    
    renderWithRouter(<BatchSubmitted />);
    
    await waitFor(() => {
      const breadcrumbLink = screen.getByText('Batch #456');
      expect(breadcrumbLink).toBeInTheDocument();
      expect(breadcrumbLink.closest('a')).toHaveAttribute('href', '/detail/456');
      
      expect(screen.getByText('Batch Submitted')).toBeInTheDocument();
    });
  });

  it('should call API with correct batch request ID from URL params', () => {
    const batchRequestId = '789';
    mockMonitoring.getBatchRequest.mockImplementation(() => new Promise(() => {}));
    
    renderWithRouter(<BatchSubmitted />, [`/batch-request-submitted/${batchRequestId}`]);
    
    expect(mockMonitoring.getBatchRequest).toHaveBeenCalledWith(batchRequestId);
  });

  it('should display success status correctly', async () => {
    const mockBatchRequest = {
      id: '123',
      batchId: 456,
      status: 'SUCCESS',
    };
    
    mockMonitoring.getBatchRequest.mockResolvedValue(mockBatchRequest);
    
    renderWithRouter(<BatchSubmitted />);
    
    await waitFor(() => {
      expect(screen.getByTestId('status-badge')).toHaveTextContent('SUCCESS');
      expect(screen.getByText(/Batch has been submitted with status:/)).toBeInTheDocument();
    });
  });

  it('should display failure status correctly', async () => {
    const mockBatchRequest = {
      id: '123',
      batchId: 456,
      status: 'FAILURE',
    };
    
    mockMonitoring.getBatchRequest.mockResolvedValue(mockBatchRequest);
    
    renderWithRouter(<BatchSubmitted />);
    
    await waitFor(() => {
      expect(screen.getByTestId('status-badge')).toHaveTextContent('FAILURE');
    });
  });
});