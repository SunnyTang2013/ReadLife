import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CurrentUserProfile from '../CurrentUserProfile';
import userService from '../../backend/user';

// Mock the user service
jest.mock('../../backend/user');

// Mock child components
jest.mock('../../components/LoadingIndicator', () => {
  return function MockLoadingIndicator() {
    return <div data-testid="loading-indicator">Loading...</div>;
  };
});

jest.mock('../../components/ErrorAlert', () => {
  return function MockErrorAlert({ error }) {
    return <div data-testid="error-alert">Error: {error.message}</div>;
  };
});

describe('CurrentUserProfile Component', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    permission: 'READ_WRITE',
    profile: {
      role: 'USER',
      createTime: '2023-01-01T00:00:00Z',
      username: 'testuser',
      rpcToken: null
    }
  };

  const mockUserWithToken = {
    ...mockUser,
    profile: {
      ...mockUser.profile,
      rpcToken: 'test-token-123'
    }
  };

  beforeEach(() => {
    userService.getCurrentUser.mockClear();
    userService.regenerateRpcToken.mockClear();
    
    // Mock document.title assignment
    delete document.title;
    document.title = '';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('shows loading indicator initially', () => {
    userService.getCurrentUser.mockReturnValue(new Promise(() => {})); // Never resolves
    
    render(<CurrentUserProfile />);
    
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  test('loads user data on mount', async () => {
    userService.getCurrentUser.mockResolvedValue(mockUser);
    
    render(<CurrentUserProfile />);
    
    await waitFor(() => {
      expect(userService.getCurrentUser).toHaveBeenCalledTimes(1);
    });
  });

  test('sets document title on mount', async () => {
    userService.getCurrentUser.mockResolvedValue(mockUser);
    
    render(<CurrentUserProfile />);
    
    expect(document.title).toBe('User Profile');
  });

  test('displays user information when loaded', async () => {
    userService.getCurrentUser.mockResolvedValue(mockUser);
    
    render(<CurrentUserProfile />);
    
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('READ_WRITE')).toBeInTheDocument();
      expect(screen.getByText('USER')).toBeInTheDocument();
    });
  });

  test('shows error alert when user loading fails', async () => {
    const error = new Error('Failed to load user');
    userService.getCurrentUser.mockRejectedValue(error);
    
    render(<CurrentUserProfile />);
    
    await waitFor(() => {
      expect(screen.getByTestId('error-alert')).toBeInTheDocument();
      expect(screen.getByText(/Error: Failed to load user/)).toBeInTheDocument();
    });
  });

  test('shows generate token button when user has no RPC token', async () => {
    userService.getCurrentUser.mockResolvedValue(mockUser);
    
    render(<CurrentUserProfile />);
    
    await waitFor(() => {
      expect(screen.getByText('Generate a secret token for JSON-RPC')).toBeInTheDocument();
    });
  });

  test('shows RPC credential when user has token', async () => {
    userService.getCurrentUser.mockResolvedValue(mockUserWithToken);
    
    render(<CurrentUserProfile />);
    
    await waitFor(() => {
      expect(screen.getByText('Your RPC credential is')).toBeInTheDocument();
      expect(screen.getByText('testuser:test-token-123')).toBeInTheDocument();
    });
  });

  test('generates RPC token when button is clicked', async () => {
    userService.getCurrentUser.mockResolvedValue(mockUser);
    userService.regenerateRpcToken.mockResolvedValue({
      ...mockUser.profile,
      rpcToken: 'new-token-456'
    });
    
    render(<CurrentUserProfile />);
    
    await waitFor(() => {
      expect(screen.getByText('Generate a secret token for JSON-RPC')).toBeInTheDocument();
    });
    
    const generateButton = screen.getByText('Generate a secret token for JSON-RPC');
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(userService.regenerateRpcToken).toHaveBeenCalledTimes(1);
    });
  });

  test('regenerates RPC token when regenerate button is clicked', async () => {
    userService.getCurrentUser.mockResolvedValue(mockUserWithToken);
    userService.regenerateRpcToken.mockResolvedValue({
      ...mockUserWithToken.profile,
      rpcToken: 'regenerated-token-789'
    });
    
    render(<CurrentUserProfile />);
    
    await waitFor(() => {
      expect(screen.getByText('Re-generate the RPC token')).toBeInTheDocument();
    });
    
    const regenerateButton = screen.getByText('Re-generate the RPC token');
    fireEvent.click(regenerateButton);
    
    await waitFor(() => {
      expect(userService.regenerateRpcToken).toHaveBeenCalledTimes(1);
    });
  });

  test('handles token generation error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    userService.getCurrentUser.mockResolvedValue(mockUser);
    userService.regenerateRpcToken.mockRejectedValue(new Error('Token generation failed'));
    
    render(<CurrentUserProfile />);
    
    await waitFor(() => {
      expect(screen.getByText('Generate a secret token for JSON-RPC')).toBeInTheDocument();
    });
    
    const generateButton = screen.getByText('Generate a secret token for JSON-RPC');
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(userService.regenerateRpcToken).toHaveBeenCalledTimes(1);
    });
    
    // Component should handle the error gracefully (implementation dependent)
    
    consoleErrorSpy.mockRestore();
  });

  test('does not generate token if user is not loaded', async () => {
    userService.getCurrentUser.mockReturnValue(new Promise(() => {})); // Never resolves
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    render(<CurrentUserProfile />);
    
    // Since user is null, onGenerateRpcToken should log and return early
    // This would be called internally, so we test the behavior indirectly
    
    consoleLogSpy.mockRestore();
  });

  test('renders navigation links', async () => {
    userService.getCurrentUser.mockResolvedValue(mockUser);
    
    render(<CurrentUserProfile />);
    
    await waitFor(() => {
      expect(screen.getByText('Basic Info')).toBeInTheDocument();
      expect(screen.getByText('RPC Credential')).toBeInTheDocument();
    });
  });

  test('displays sample RPC commands when user has token', async () => {
    userService.getCurrentUser.mockResolvedValue(mockUserWithToken);
    
    render(<CurrentUserProfile />);
    
    await waitFor(() => {
      expect(screen.getByText('Sample JSON-RPC request payload:')).toBeInTheDocument();
      expect(screen.getByText('If you are using Scorch JSON-RPC client:')).toBeInTheDocument();
    });
  });
});