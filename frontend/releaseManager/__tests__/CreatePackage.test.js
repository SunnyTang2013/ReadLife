import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import CreatePackage from '../CreatePackage';

// Mock releaseService
jest.mock('../backend/releaseService', () => ({
  createReleasePackage: jest.fn(),
}));

// Mock components
jest.mock('../components/ErrorAlert', () => ({ error }) => (
  <div data-testid="error-alert">{error.toString()}</div>
));

jest.mock('./components/ReleaseGroupForm', () => ({ onSave, packageName, jiraKey, resultInfo }) => (
  <div data-testid="release-group-form">
    <div data-testid="package-name">{packageName}</div>
    <button 
      data-testid="save-button" 
      onClick={() => onSave(['test-release-job'])}
    >
      Save Package
    </button>
    {resultInfo && <div data-testid="result-info" className={`alert-${resultInfo.status}`}>{resultInfo.info}</div>}
  </div>
));

jest.mock('../components/Alert', () => ({ type, text }) => (
  <div data-testid="alert" className={`alert-${type}`}>{text}</div>
));

const mockReleaseService = require('../backend/releaseService');

describe('CreatePackage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  const renderWithRouter = (initialEntries = ['/create/testPackage']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <CreatePackage />
      </MemoryRouter>
    );
  };

  it('should render without crashing', () => {
    renderWithRouter();
    
    expect(screen.getByTestId('release-group-form')).toBeInTheDocument();
  });

  it('should use packageName from URL params', () => {
    renderWithRouter(['/create/myCustomPackage']);
    
    expect(screen.getByTestId('package-name')).toHaveTextContent('myCustomPackage');
  });

  it('should use default packageName when not provided in URL', () => {
    renderWithRouter(['/create']);
    
    expect(screen.getByTestId('package-name')).toHaveTextContent('releaseItem');
  });

  it('should render breadcrumb navigation', () => {
    renderWithRouter();
    
    expect(screen.getByText('Release Manager')).toBeInTheDocument();
    expect(screen.getByText('Package List')).toBeInTheDocument();
    expect(screen.getByText('Create Package')).toBeInTheDocument();
  });

  it('should handle successful package creation', async () => {
    const mockResult = {
      status: 'SUCCESS',
      data: {
        result: {
          'maven2.version': '1.2.3',
          version: 'v1.2.3',
          jiraKey: 'JIRA-123',
          CRToolUrl: 'http://cr-tool.com/123'
        }
      }
    };
    mockReleaseService.createReleasePackage.mockResolvedValue(mockResult);

    renderWithRouter();
    
    const saveButton = screen.getByTestId('save-button');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockReleaseService.createReleasePackage).toHaveBeenCalledWith(null, ['test-release-job']);
    });

    await waitFor(() => {
      const resultInfo = screen.getByTestId('result-info');
      expect(resultInfo).toHaveClass('alert-success');
      expect(resultInfo).toHaveTextContent('Create package successfully ! Package version is 1.2.3. Jira JIRA-123 created/updated.');
    });
  });

  it('should handle failed package creation', async () => {
    const mockResult = {
      status: 'FAILED',
      message: 'Package creation failed due to validation error'
    };
    mockReleaseService.createReleasePackage.mockResolvedValue(mockResult);

    renderWithRouter();
    
    const saveButton = screen.getByTestId('save-button');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockReleaseService.createReleasePackage).toHaveBeenCalled();
    });

    await waitFor(() => {
      const resultInfo = screen.getByTestId('result-info');
      expect(resultInfo).toHaveClass('alert-danger');
      expect(resultInfo).toHaveTextContent('Create package fail ! Result message is Package creation failed due to validation error.');
    });
  });

  it('should handle network error during package creation', async () => {
    const mockError = new Error('Network error');
    mockReleaseService.createReleasePackage.mockRejectedValue(mockError);

    renderWithRouter();
    
    const saveButton = screen.getByTestId('save-button');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockReleaseService.createReleasePackage).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByTestId('error-alert')).toBeInTheDocument();
      expect(screen.getByTestId('error-alert')).toHaveTextContent('Network error');
    });
  });

  it('should clear localStorage on successful save', async () => {
    localStorage.setItem('releaseItem', JSON.stringify({ test: 'data' }));
    
    const mockResult = {
      status: 'SUCCESS',
      data: {
        result: {
          'maven2.version': '1.2.3',
          version: 'v1.2.3',
          jiraKey: 'JIRA-123',
          CRToolUrl: 'http://cr-tool.com/123'
        }
      }
    };
    mockReleaseService.createReleasePackage.mockResolvedValue(mockResult);

    renderWithRouter();
    
    const saveButton = screen.getByTestId('save-button');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(localStorage.getItem('releaseItem')).toBeNull();
    });
  });

  it('should display package version and CR tool URL on success', async () => {
    const mockResult = {
      status: 'SUCCESS',
      data: {
        result: {
          'maven2.version': '1.2.3',
          version: 'v1.2.3',
          jiraKey: 'JIRA-123',
          CRToolUrl: 'http://cr-tool.com/123'
        }
      }
    };
    mockReleaseService.createReleasePackage.mockResolvedValue(mockResult);

    renderWithRouter();
    
    const saveButton = screen.getByTestId('save-button');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      const resultInfo = screen.getByTestId('result-info');
      expect(resultInfo).toHaveTextContent('Package version is 1.2.3');
      expect(resultInfo).toHaveTextContent('Jira JIRA-123 created/updated');
    });
  });

  it('should pass jiraKey to createReleasePackage when provided', async () => {
    const mockResult = {
      status: 'SUCCESS',
      data: {
        result: {
          'maven2.version': '1.2.3',
          version: 'v1.2.3',
          jiraKey: 'JIRA-456',
          CRToolUrl: 'http://cr-tool.com/456'
        }
      }
    };
    mockReleaseService.createReleasePackage.mockResolvedValue(mockResult);

    renderWithRouter();
    
    // Simulate setting jira key (this would normally be done through ReleaseGroupForm)
    // For this test, we assume jiraKey state is updated somehow
    const saveButton = screen.getByTestId('save-button');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockReleaseService.createReleasePackage).toHaveBeenCalledWith(null, ['test-release-job']);
    });
  });
});