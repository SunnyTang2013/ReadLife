import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import JobConfigGroupsAutosuggest from '../JobConfigGroupsAutosuggest';

// Mock configurations backend
jest.mock('../../backend/configurations', () => ({
  findJobConfigGroupList: jest.fn(),
}));

// Mock constants
jest.mock('../../utils/constants', () => ({
  getJobConfigCategoriesByType: jest.fn(() => ({
    functional: ['Category1', 'Category2'],
    technical: ['TechCategory1', 'TechCategory2']
  })),
}));

// Mock utilities
jest.mock('../../utils/utilities', () => ({
  sortCaseInsensitive: jest.fn((arr) => [...arr].sort()),
}));

// Mock Autosuggest component
jest.mock('react-autosuggest', () => ({ 
  suggestions, 
  onSuggestionsFetchRequested, 
  getSuggestionValue, 
  renderSuggestion, 
  inputProps 
}) => (
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

const mockConfigurations = require('../../backend/configurations');

describe('JobConfigGroupsAutosuggest', () => {
  const defaultProps = {
    onAdd: jest.fn(),
    jiraKey: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<JobConfigGroupsAutosuggest {...defaultProps} />);
    
    expect(screen.getByLabelText(/Scope/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Categories/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Configuration/)).toBeInTheDocument();
    expect(screen.getByLabelText(/JIRA ID/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add/i })).toBeInTheDocument();
  });

  it('should return null when onAdd is null', () => {
    const { container } = render(<JobConfigGroupsAutosuggest {...defaultProps} onAdd={null} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('should render scope selector with functional and technical options', () => {
    render(<JobConfigGroupsAutosuggest {...defaultProps} />);
    
    const scopeSelect = screen.getByLabelText(/Scope/);
    expect(scopeSelect).toBeInTheDocument();
    
    expect(screen.getByText('Functional(Job Level)')).toBeInTheDocument();
    expect(screen.getByText('Technical(Context Level)')).toBeInTheDocument();
  });

  it('should update categories when scope changes', () => {
    render(<JobConfigGroupsAutosuggest {...defaultProps} />);
    
    const scopeSelect = screen.getByLabelText(/Scope/);
    fireEvent.change(scopeSelect, { target: { value: 'functional' } });
    
    const categorySelect = screen.getByLabelText(/Categories/);
    expect(categorySelect).toBeInTheDocument();
    
    // Categories should be populated based on scope
    expect(screen.getByText('Category1')).toBeInTheDocument();
    expect(screen.getByText('Category2')).toBeInTheDocument();
  });

  it('should update categories when scope changes to technical', () => {
    render(<JobConfigGroupsAutosuggest {...defaultProps} />);
    
    const scopeSelect = screen.getByLabelText(/Scope/);
    fireEvent.change(scopeSelect, { target: { value: 'technical' } });
    
    // Categories should be updated for technical scope
    expect(screen.getByText('TechCategory1')).toBeInTheDocument();
    expect(screen.getByText('TechCategory2')).toBeInTheDocument();
  });

  it('should disable autosuggest when no category is selected', () => {
    render(<JobConfigGroupsAutosuggest {...defaultProps} />);
    
    const autosuggestInput = screen.getByTestId('autosuggest-input');
    expect(autosuggestInput).toBeDisabled();
    expect(autosuggestInput.placeholder).toBe('Please select a category first.');
  });

  it('should enable autosuggest when category is selected', () => {
    render(<JobConfigGroupsAutosuggest {...defaultProps} />);
    
    const scopeSelect = screen.getByLabelText(/Scope/);
    fireEvent.change(scopeSelect, { target: { value: 'functional' } });
    
    const categorySelect = screen.getByLabelText(/Categories/);
    fireEvent.change(categorySelect, { target: { value: 'Category1' } });
    
    const autosuggestInput = screen.getByTestId('autosuggest-input');
    expect(autosuggestInput).not.toBeDisabled();
    expect(autosuggestInput.placeholder).toContain('Category1');
  });

  it('should handle JIRA key input changes', () => {
    const jiraKey = jest.fn();
    render(<JobConfigGroupsAutosuggest {...defaultProps} jiraKey={jiraKey} />);
    
    const jiraInput = screen.getByLabelText(/JIRA ID/);
    fireEvent.change(jiraInput, { target: { value: 'JIRA-456' } });
    
    expect(jiraKey).toHaveBeenCalledWith('JIRA-456');
  });

  it('should fetch suggestions when category and keyword are provided', async () => {
    const mockConfigGroups = [
      { name: 'Config Group 1', id: 1 },
      { name: 'Config Group 2', id: 2 }
    ];
    mockConfigurations.findJobConfigGroupList.mockResolvedValue(mockConfigGroups);

    render(<JobConfigGroupsAutosuggest {...defaultProps} />);
    
    const scopeSelect = screen.getByLabelText(/Scope/);
    fireEvent.change(scopeSelect, { target: { value: 'functional' } });
    
    const categorySelect = screen.getByLabelText(/Categories/);
    fireEvent.change(categorySelect, { target: { value: 'Category1' } });
    
    const autosuggestInput = screen.getByTestId('autosuggest-input');
    fireEvent.change(autosuggestInput, { target: { value: 'Config' } });
    
    await waitFor(() => {
      expect(mockConfigurations.findJobConfigGroupList).toHaveBeenCalledWith('Category1', 'Config');
    });
  });

  it('should display suggestions count when results are found', async () => {
    const mockConfigGroups = [
      { name: 'Config Group 1', id: 1 },
      { name: 'Config Group 2', id: 2 }
    ];
    mockConfigurations.findJobConfigGroupList.mockResolvedValue(mockConfigGroups);

    render(<JobConfigGroupsAutosuggest {...defaultProps} />);
    
    const scopeSelect = screen.getByLabelText(/Scope/);
    fireEvent.change(scopeSelect, { target: { value: 'functional' } });
    
    const categorySelect = screen.getByLabelText(/Categories/);
    fireEvent.change(categorySelect, { target: { value: 'Category1' } });
    
    const autosuggestInput = screen.getByTestId('autosuggest-input');
    fireEvent.change(autosuggestInput, { target: { value: 'Config' } });
    
    await waitFor(() => {
      expect(screen.getByText('Showing 2 results.')).toBeInTheDocument();
    });
  });

  it('should display no results message when no results found', async () => {
    mockConfigurations.findJobConfigGroupList.mockResolvedValue([]);

    render(<JobConfigGroupsAutosuggest {...defaultProps} />);
    
    const scopeSelect = screen.getByLabelText(/Scope/);
    fireEvent.change(scopeSelect, { target: { value: 'functional' } });
    
    const categorySelect = screen.getByLabelText(/Categories/);
    fireEvent.change(categorySelect, { target: { value: 'Category1' } });
    
    const autosuggestInput = screen.getByTestId('autosuggest-input');
    fireEvent.change(autosuggestInput, { target: { value: 'NonExistent' } });
    
    await waitFor(() => {
      expect(screen.getByText('No results found.')).toBeInTheDocument();
    });
  });

  it('should call onAdd when Add button is clicked with valid config group', async () => {
    const mockConfigGroups = [{ name: 'Config Group 1', id: 1 }];
    mockConfigurations.findJobConfigGroupList.mockResolvedValue(mockConfigGroups);
    const onAdd = jest.fn();

    render(<JobConfigGroupsAutosuggest {...defaultProps} onAdd={onAdd} />);
    
    const scopeSelect = screen.getByLabelText(/Scope/);
    fireEvent.change(scopeSelect, { target: { value: 'functional' } });
    
    const categorySelect = screen.getByLabelText(/Categories/);
    fireEvent.change(categorySelect, { target: { value: 'Category1' } });
    
    const autosuggestInput = screen.getByTestId('autosuggest-input');
    fireEvent.change(autosuggestInput, { target: { value: 'Config Group 1' } });
    
    await waitFor(() => {
      expect(screen.getByText('Showing 1 results.')).toBeInTheDocument();
    });
    
    const addButton = screen.getByRole('button', { name: /Add/i });
    fireEvent.click(addButton);
    
    expect(onAdd).toHaveBeenCalledWith(mockConfigGroups[0]);
  });

  it('should reset state after successful add', async () => {
    const mockConfigGroups = [{ name: 'Config Group 1', id: 1 }];
    mockConfigurations.findJobConfigGroupList.mockResolvedValue(mockConfigGroups);
    const onAdd = jest.fn();

    render(<JobConfigGroupsAutosuggest {...defaultProps} onAdd={onAdd} />);
    
    const scopeSelect = screen.getByLabelText(/Scope/);
    fireEvent.change(scopeSelect, { target: { value: 'functional' } });
    
    const categorySelect = screen.getByLabelText(/Categories/);
    fireEvent.change(categorySelect, { target: { value: 'Category1' } });
    
    const autosuggestInput = screen.getByTestId('autosuggest-input');
    fireEvent.change(autosuggestInput, { target: { value: 'Config Group 1' } });
    
    await waitFor(() => {
      expect(screen.getByText('Showing 1 results.')).toBeInTheDocument();
    });
    
    const addButton = screen.getByRole('button', { name: /Add/i });
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(scopeSelect.value).toBe('');
      expect(categorySelect.value).toBe('');
      expect(autosuggestInput.value).toBe('');
    });
  });

  it('should not call onAdd when Add button is clicked without valid config group', () => {
    const onAdd = jest.fn();
    render(<JobConfigGroupsAutosuggest {...defaultProps} onAdd={onAdd} />);
    
    const addButton = screen.getByRole('button', { name: /Add/i });
    fireEvent.click(addButton);
    
    expect(onAdd).not.toHaveBeenCalled();
  });
});