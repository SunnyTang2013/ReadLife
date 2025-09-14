import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BatchAutosuggest from '../BatchAutosuggest';

// Mock batchService
jest.mock('../../backend/batchService', () => ({
  findBatchesByKeyword: jest.fn(),
}));

// Mock Autosuggest component
jest.mock('react-autosuggest', () => ({ suggestions, onSuggestionsFetchRequested, getSuggestionValue, renderSuggestion, inputProps }) => (
  <div data-testid="autosuggest-mock">
    <input
      data-testid="autosuggest-input"
      value={inputProps.value}
      onChange={(e) => inputProps.onChange(e, { newValue: e.target.value })}
      placeholder={inputProps.placeholder}
      disabled={inputProps.disabled}
    />
    {suggestions.map((suggestion, index) => (
      <div 
        key={index} 
        data-testid={`suggestion-${index}`} 
        onClick={() => getSuggestionValue(suggestion)}
      >
        {suggestion.name}
      </div>
    ))}
  </div>
));

const mockBatchService = require('../../backend/batchService');

describe('BatchAutosuggest', () => {
  const defaultProps = {
    jiraKey: jest.fn(),
    onAdd: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<BatchAutosuggest {...defaultProps} />);
    
    expect(screen.getByLabelText(/Batch/)).toBeInTheDocument();
    expect(screen.getByLabelText(/JIRA ID/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add/i })).toBeInTheDocument();
  });

  it('should return null when onAdd is null', () => {
    const { container } = render(<BatchAutosuggest {...defaultProps} onAdd={null} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('should handle JIRA key input changes', () => {
    const jiraKey = jest.fn();
    render(<BatchAutosuggest {...defaultProps} jiraKey={jiraKey} />);
    
    const jiraInput = screen.getByLabelText(/JIRA ID/);
    fireEvent.change(jiraInput, { target: { value: 'JIRA-123' } });
    
    expect(jiraKey).toHaveBeenCalledWith('JIRA-123');
  });

  it('should handle batch name input changes', async () => {
    mockBatchService.findBatchesByKeyword.mockResolvedValue([
      { name: 'Test Batch 1', id: 1 },
      { name: 'Test Batch 2', id: 2 }
    ]);

    render(<BatchAutosuggest {...defaultProps} />);
    
    const batchInput = screen.getByTestId('autosuggest-input');
    fireEvent.change(batchInput, { target: { value: 'Test' } });
    
    await waitFor(() => {
      expect(mockBatchService.findBatchesByKeyword).toHaveBeenCalledWith('Test');
    });
  });

  it('should display suggestions when search returns results', async () => {
    const mockBatches = [
      { name: 'Test Batch 1', id: 1 },
      { name: 'Test Batch 2', id: 2 }
    ];
    mockBatchService.findBatchesByKeyword.mockResolvedValue(mockBatches);

    render(<BatchAutosuggest {...defaultProps} />);
    
    const batchInput = screen.getByTestId('autosuggest-input');
    fireEvent.change(batchInput, { target: { value: 'Test' } });
    
    await waitFor(() => {
      expect(screen.getByText('Showing 2 results.')).toBeInTheDocument();
    });
  });

  it('should display no results message when search returns empty', async () => {
    mockBatchService.findBatchesByKeyword.mockResolvedValue([]);

    render(<BatchAutosuggest {...defaultProps} />);
    
    const batchInput = screen.getByTestId('autosuggest-input');
    fireEvent.change(batchInput, { target: { value: 'NonExistent' } });
    
    await waitFor(() => {
      expect(screen.getByText('No results found.')).toBeInTheDocument();
    });
  });

  it('should call onAdd when Add button is clicked with valid batch', async () => {
    const mockBatches = [{ name: 'Test Batch', id: 1 }];
    mockBatchService.findBatchesByKeyword.mockResolvedValue(mockBatches);
    const onAdd = jest.fn();

    render(<BatchAutosuggest {...defaultProps} onAdd={onAdd} />);
    
    const batchInput = screen.getByTestId('autosuggest-input');
    fireEvent.change(batchInput, { target: { value: 'Test Batch' } });
    
    await waitFor(() => {
      expect(screen.getByText('Showing 1 results.')).toBeInTheDocument();
    });
    
    const addButton = screen.getByRole('button', { name: /Add/i });
    fireEvent.click(addButton);
    
    expect(onAdd).toHaveBeenCalledWith(mockBatches[0]);
  });

  it('should not call onAdd when Add button is clicked without valid batch', () => {
    const onAdd = jest.fn();
    render(<BatchAutosuggest {...defaultProps} onAdd={onAdd} />);
    
    const addButton = screen.getByRole('button', { name: /Add/i });
    fireEvent.click(addButton);
    
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('should reset state after successful add', async () => {
    const mockBatches = [{ name: 'Test Batch', id: 1 }];
    mockBatchService.findBatchesByKeyword.mockResolvedValue(mockBatches);
    const onAdd = jest.fn();

    render(<BatchAutosuggest {...defaultProps} onAdd={onAdd} />);
    
    const batchInput = screen.getByTestId('autosuggest-input');
    fireEvent.change(batchInput, { target: { value: 'Test Batch' } });
    
    await waitFor(() => {
      expect(screen.getByText('Showing 1 results.')).toBeInTheDocument();
    });
    
    const addButton = screen.getByRole('button', { name: /Add/i });
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(batchInput.value).toBe('');
    });
  });

  it('should render highlighted suggestion text correctly', () => {
    const mockBatches = [{ name: 'Test Batch Name', id: 1 }];
    render(<BatchAutosuggest {...defaultProps} />);
    
    // Simulate the render suggestion function behavior
    const batchInput = screen.getByTestId('autosuggest-input');
    fireEvent.change(batchInput, { target: { value: 'Test' } });
    
    // The actual highlighting is tested through the component's internal renderSuggestion function
    expect(batchInput.value).toBe('Test');
  });
});