import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { toast } from 'react-toastify';
import ReleaseCreate from '../ReleaseCreate';
import releaseService from '../../backend/releaseService';

// Mock the backend service
jest.mock('../../backend/releaseService');

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock ErrorAlert component
jest.mock('../../components/ErrorAlert', () => {
  return function MockErrorAlert({ error }) {
    if (!error) return null;
    return <div 'data-testid'="error-alert">{`Error: ${error.message}`}</div>;
  };
});

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('ReleaseCreate Component', () => {
  const mockJobGroupBundle = {
    name: 'Test Bundle',
    version: '1.0.0',
    configGroups: [
      {
        name: 'Test Config Group',
        category: 'test',
        parameters: {
          entries: {
            'param1': 'value1',
            'param2': 'value2'
          }
        }
      }
    ],
    jobs: [
      {
        name: 'Test Job',
        type: 'BATCH',
        context: {
          naturalKey: 'test-context'
        },
        configGroups: ['Test Config Group']
      }
    ]
  };

  const mockVerificationResult = {
    errors: [],
    warnings: ['Warning: This is a test warning']
  };

  const mockReleaseResult = {
    id: 123,
    name: 'Test Release'
  };

  beforeEach(() => {
    // Reset mocks before each test
    releaseService.verifyJobGroupBundle.mockClear();
    releaseService.releaseJobGroupBundle.mockClear();
    toast.success.mockClear();
    toast.error.mockClear();
    toast.warn.mockClear();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderWithRouter = (component) => {
    return render(
      <BrowserRouter>{component}</BrowserRouter>
    );
  };

  test('renders release create form', () => {
    renderWithRouter(<ReleaseCreate />);
    
    expect(screen.getByText('Release a job group')).toBeInTheDocument();
    expect(screen.getByText('Specify a unique release name')).toBeInTheDocument();
    expect(screen.getByText('Choose the job group bundle JSON file to release')).toBeInTheDocument();
  });

  test('updates release name input', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ReleaseCreate />);
    
    const releaseNameInput = screen.getByDisplayValue('');
    await user.type(releaseNameInput, 'Test Release');
    
    expect(releaseNameInput.value).toBe('Test Release');
  });

  test('handles file upload and displays job group bundle', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ReleaseCreate />);
    
    // First set release name
    const releaseNameInput = screen.getByDisplayValue('');
    await user.type(releaseNameInput, 'Test Release');
    
    const file = new File([JSON.stringify(mockJobGroupBundle)], 'test.json', {
      type: 'application/json',
    });
    
    const fileInput = screen.getByAccept('.json');
    await user.upload(fileInput, file);
    
    // Wait for file processing
    await waitFor(() => {
      expect(screen.getByText('Loaded job group')).toBeInTheDocument();
      expect(screen.getByText('Test Bundle')).toBeInTheDocument();
      expect(screen.getByText('1 Config Groups')).toBeInTheDocument();
      expect(screen.getByText('1 Jobs')).toBeInTheDocument();
    });
  });

  test('handles invalid JSON file', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ReleaseCreate />);
    
    // First set release name
    const releaseNameInput = screen.getByDisplayValue('');
    await user.type(releaseNameInput, 'Test Release');
    
    const file = new File(['invalid json'], 'test.json', {
      type: 'application/json',
    });
    
    const fileInput = screen.getByAccept('.json');
    await user.upload(fileInput, file);
    
    await waitFor(() => {
      expect(screen.getByTestId('error-alert')).toBeInTheDocument();
    });
  });

  test('verify and release button calls verification service', async () => {
    const user = userEvent.setup();
    releaseService.verifyJobGroupBundle.mockResolvedValue(mockVerificationResult);
    
    renderWithRouter(<ReleaseCreate />);
    
    // Set release name
    const releaseNameInput = screen.getByDisplayValue('');
    await user.type(releaseNameInput, 'Test Release');
    
    // Upload a file
    const file = new File([JSON.stringify(mockJobGroupBundle)], 'test.json', {
      type: 'application/json',
    });
    
    const fileInput = screen.getByAccept('.json');
    await user.upload(fileInput, file);
    
    // Wait for bundle to be loaded
    await waitFor(() => {
      expect(screen.getByText('Loaded job group')).toBeInTheDocument();
    });
    
    const verifyButton = screen.getByText('Yes, I am sure. Verify and release this job group.');
    await user.click(verifyButton);
    
    await waitFor(() => {
      expect(releaseService.verifyJobGroupBundle).toHaveBeenCalledWith(
        'Test Release',
        mockJobGroupBundle
      );
    });
  });

  test('displays verification warnings', async () => {
    const user = userEvent.setup();
    releaseService.verifyJobGroupBundle.mockResolvedValue(mockVerificationResult);
    
    renderWithRouter(<ReleaseCreate />);
    
    // Set release name and upload file
    const releaseNameInput = screen.getByDisplayValue('');
    await user.type(releaseNameInput, 'Test Release');
    
    const file = new File([JSON.stringify(mockJobGroupBundle)], 'test.json', {
      type: 'application/json',
    });
    
    const fileInput = screen.getByAccept('.json');
    await user.upload(fileInput, file);
    
    await waitFor(() => {
      expect(screen.getByText('Loaded job group')).toBeInTheDocument();
    });
    
    const verifyButton = screen.getByText('Yes, I am sure. Verify and release this job group.');
    await user.click(verifyButton);
    
    await waitFor(() => {
      expect(screen.getByText('Warning: This is a test warning')).toBeInTheDocument();
      expect(screen.getByText('Verification of job group bundle with warnings.')).toBeInTheDocument();
    });
  });

  test('confirms release after verification with warnings', async () => {
    const user = userEvent.setup();
    releaseService.verifyJobGroupBundle.mockResolvedValue(mockVerificationResult);
    releaseService.releaseJobGroupBundle.mockResolvedValue(mockReleaseResult);
    
    renderWithRouter(<ReleaseCreate />);
    
    // Set release name and upload file
    const releaseNameInput = screen.getByDisplayValue('');
    await user.type(releaseNameInput, 'Test Release');
    
    const file = new File([JSON.stringify(mockJobGroupBundle)], 'test.json', {
      type: 'application/json',
    });
    
    const fileInput = screen.getByAccept('.json');
    await user.upload(fileInput, file);
    
    await waitFor(() => {
      expect(screen.getByText('Loaded job group')).toBeInTheDocument();
    });
    
    const verifyButton = screen.getByText('Yes, I am sure. Verify and release this job group.');
    await user.click(verifyButton);
    
    // Wait for verification to complete and show warnings
    await waitFor(() => {
      expect(screen.getByText('Yes, I am sure. Confirm the release.')).toBeInTheDocument();
    });
    
    const confirmButton = screen.getByText('Yes, I am sure. Confirm the release.');
    await user.click(confirmButton);
    
    await waitFor(() => {
      expect(releaseService.releaseJobGroupBundle).toHaveBeenCalledWith(
        'Test Release',
        mockJobGroupBundle
      );
      expect(toast.success).toHaveBeenCalledWith('Released job group (Release #123) successfully!');
      expect(mockNavigate).toHaveBeenCalledWith('/detail/123');
    });
  });

  test('restart button resets form', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ReleaseCreate />);
    
    // Set release name
    const releaseNameInput = screen.getByDisplayValue('');
    await user.type(releaseNameInput, 'Test Release');
    
    // Upload file
    const file = new File([JSON.stringify(mockJobGroupBundle)], 'test.json', {
      type: 'application/json',
    });
    
    const fileInput = screen.getByAccept('.json');
    await user.upload(fileInput, file);
    
    await waitFor(() => {
      expect(screen.getByText('Loaded job group')).toBeInTheDocument();
    });
    
    // Click restart
    const restartButton = screen.getByText('Restart');
    await user.click(restartButton);
    
    // Form should be reset - check that bundle is no longer displayed
    expect(screen.queryByText('Loaded job group')).not.toBeInTheDocument();
    expect(screen.getByText('Specify a unique release name')).toBeInTheDocument();
  });

  test('handles verification errors', async () => {
    const user = userEvent.setup();
    const mockVerificationErrors = {
      errors: ['Error: Invalid configuration'],
      warnings: []
    };
    releaseService.verifyJobGroupBundle.mockResolvedValue(mockVerificationErrors);
    
    renderWithRouter(<ReleaseCreate />);
    
    // Set release name and upload file
    const releaseNameInput = screen.getByDisplayValue('');
    await user.type(releaseNameInput, 'Test Release');
    
    const file = new File([JSON.stringify(mockJobGroupBundle)], 'test.json', {
      type: 'application/json',
    });
    
    const fileInput = screen.getByAccept('.json');
    await user.upload(fileInput, file);
    
    await waitFor(() => {
      expect(screen.getByText('Loaded job group')).toBeInTheDocument();
    });
    
    const verifyButton = screen.getByText('Yes, I am sure. Verify and release this job group.');
    await user.click(verifyButton);
    
    await waitFor(() => {
      expect(screen.getByText('Verification of job group bundle failed.')).toBeInTheDocument();
      expect(screen.getByText('Error: Invalid configuration')).toBeInTheDocument();
      expect(screen.getByText('Please fix the errors and restart.')).toBeInTheDocument();
    });
  });

  test('file input is disabled when release name is empty', () => {
    renderWithRouter(<ReleaseCreate />);
    
    const fileInput = screen.getByAccept('.json');
    expect(fileInput).toBeDisabled();
  });

  test('file input is enabled when release name is provided', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ReleaseCreate />);
    
    const releaseNameInput = screen.getByDisplayValue('');
    await user.type(releaseNameInput, 'Test Release');
    
    const fileInput = screen.getByAccept('.json');
    expect(fileInput).not.toBeDisabled();
  });

  test('handles successful release without verification warnings', async () => {
    const user = userEvent.setup();
    const mockVerificationSuccess = {
      errors: [],
      warnings: []
    };
    releaseService.verifyJobGroupBundle.mockResolvedValue(mockVerificationSuccess);
    releaseService.releaseJobGroupBundle.mockResolvedValue(mockReleaseResult);
    
    renderWithRouter(<ReleaseCreate />);
    
    // Set release name and upload file
    const releaseNameInput = screen.getByDisplayValue('');
    await user.type(releaseNameInput, 'Test Release');
    
    const file = new File([JSON.stringify(mockJobGroupBundle)], 'test.json', {
      type: 'application/json',
    });
    
    const fileInput = screen.getByAccept('.json');
    await user.upload(fileInput, file);
    
    await waitFor(() => {
      expect(screen.getByText('Loaded job group')).toBeInTheDocument();
    });
    
    const verifyButton = screen.getByText('Yes, I am sure. Verify and release this job group.');
    await user.click(verifyButton);
    
    // Should proceed directly to release without showing warnings
    await waitFor(() => {
      expect(releaseService.verifyJobGroupBundle).toHaveBeenCalledWith(
        'Test Release',
        mockJobGroupBundle
      );
      expect(releaseService.releaseJobGroupBundle).toHaveBeenCalledWith(
        'Test Release',
        mockJobGroupBundle
      );
      expect(toast.success).toHaveBeenCalledWith('Released job group (Release #123) successfully!');
      expect(mockNavigate).toHaveBeenCalledWith('/detail/123');
    });
  });
});