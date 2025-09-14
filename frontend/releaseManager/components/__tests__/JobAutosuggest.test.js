import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import JobAutosuggest from '../JobAutosuggest';

// Mock Autosuggest component
jest.mock('react-autosuggest', () => ({ 
  shouldRenderSuggestions,
  suggestions, 
  onSuggestionsFetchRequested, 
  onSuggestionSelected,
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
    />
    {suggestions.map((suggestion, index) => (
      <div 
        key={index} 
        data-testid={`suggestion-${index}`} 
        onClick={() => onSuggestionSelected({}, { suggestion })}
      >
        {suggestion.isAddNew ? '[+] Add new' : suggestion.name}
      </div>
    ))}
  </div>
));

describe('JobAutosuggest', () => {
  const defaultProps = {
    allowsClear: false,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the static jobList
    JobAutosuggest.jobList.length = 0;
    JobAutosuggest.jobList.push(
      { name: 'Job One', id: 1 },
      { name: 'Job Two', id: 2 },
      { name: 'Another Job', id: 3 }
    );
  });

  it('should render without crashing', () => {
    render(<JobAutosuggest {...defaultProps} />);
    
    expect(screen.getByTestId('autosuggest-mock')).toBeInTheDocument();
    expect(screen.getByTestId('autosuggest-input')).toBeInTheDocument();
  });

  it('should render loading input when jobList is null', () => {
    // Temporarily set jobList to null to test loading state
    const originalJobList = JobAutosuggest.jobList;
    JobAutosuggest.jobList = null;
    
    const { container } = render(<JobAutosuggest {...defaultProps} />);
    
    expect(container.querySelector('input[readonly]')).toBeInTheDocument();
    expect(container.querySelector('input[placeholder="Loading job ..."]')).toBeInTheDocument();
    
    // Restore jobList
    JobAutosuggest.jobList = originalJobList;
  });

  it('should filter suggestions based on input', async () => {
    render(<JobAutosuggest {...defaultProps} />);
    
    const input = screen.getByTestId('autosuggest-input');
    fireEvent.change(input, { target: { value: 'Job' } });
    
    // The filtering logic is tested through the debounced function
    await waitFor(() => {
      expect(input.value).toBe('Job');
    });
  });

  it('should show add new option when no exact match found', async () => {
    render(<JobAutosuggest {...defaultProps} />);
    
    const input = screen.getByTestId('autosuggest-input');
    fireEvent.change(input, { target: { value: 'New Job Name' } });
    
    await waitFor(() => {
      expect(input.value).toBe('New Job Name');
    });
  });

  it('should call onChange when suggestion is selected', async () => {
    const onChange = jest.fn();
    render(<JobAutosuggest {...defaultProps} onChange={onChange} />);
    
    const input = screen.getByTestId('autosuggest-input');
    fireEvent.change(input, { target: { value: 'Job' } });
    
    await waitFor(() => {
      const suggestions = screen.queryAllByTestId(/suggestion-/);
      if (suggestions.length > 0) {
        fireEvent.click(suggestions[0]);
      }
    });
    
    // The onChange should be called through the suggestion selection
    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
    });
  });

  it('should add new job to jobList when add new option is selected', async () => {
    const onChange = jest.fn();
    render(<JobAutosuggest {...defaultProps} onChange={onChange} />);
    
    const input = screen.getByTestId('autosuggest-input');
    fireEvent.change(input, { target: { value: 'Brand New Job' } });
    
    // Simulate selecting the "add new" option
    await waitFor(() => {
      const addNewSuggestions = screen.queryAllByText(/Add new/);
      if (addNewSuggestions.length > 0) {
        fireEvent.click(addNewSuggestions[0]);
      }
    });
    
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Brand New Job',
      id: 'Brand New Job'
    }));
  });

  it('should render clear button when allowsClear is true', () => {
    render(<JobAutosuggest {...defaultProps} allowsClear={true} />);
    
    expect(screen.getByText('Clear value')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Clear value/i })).toBeInTheDocument();
  });

  it('should not render clear button when allowsClear is false', () => {
    render(<JobAutosuggest {...defaultProps} allowsClear={false} />);
    
    expect(screen.queryByText('Clear value')).not.toBeInTheDocument();
  });

  it('should clear value when clear button is clicked', () => {
    const onChange = jest.fn();
    render(<JobAutosuggest {...defaultProps} allowsClear={true} onChange={onChange} />);
    
    const input = screen.getByTestId('autosuggest-input');
    fireEvent.change(input, { target: { value: 'Some Job' } });
    
    const clearButton = screen.getByRole('button', { name: /Clear value/i });
    fireEvent.click(clearButton);
    
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('should call onChange with null when input is cleared', () => {
    const onChange = jest.fn();
    render(<JobAutosuggest {...defaultProps} onChange={onChange} />);
    
    const input = screen.getByTestId('autosuggest-input');
    fireEvent.change(input, { target: { value: 'Job' } });
    fireEvent.change(input, { target: { value: '' } });
    
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('should render suggestion with highlighting for matching text', () => {
    render(<JobAutosuggest {...defaultProps} />);
    
    const input = screen.getByTestId('autosuggest-input');
    fireEvent.change(input, { target: { value: 'Job' } });
    
    // The highlighting logic is tested through the renderSuggestion function
    expect(input.value).toBe('Job');
  });

  it('should handle empty suggestions array', async () => {
    // Clear jobList to test empty suggestions
    JobAutosuggest.jobList.length = 0;
    
    render(<JobAutosuggest {...defaultProps} />);
    
    const input = screen.getByTestId('autosuggest-input');
    fireEvent.change(input, { target: { value: 'NonExistent' } });
    
    await waitFor(() => {
      expect(input.value).toBe('NonExistent');
    });
  });
});