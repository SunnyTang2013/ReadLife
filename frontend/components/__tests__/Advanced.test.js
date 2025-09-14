import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Advanced from '../Advanced';

// Mock react-datepicker
jest.mock('react-datepicker', () => {
  return function MockDatePicker({ selected, onChange, ...props }) {
    return (
      <div data-testid="date-picker" {...props}>
        <input
          data-testid="date-picker-input"
          value={selected ? selected.toISOString().split('T')[0] : ''}
          onChange={(e) => {
            const date = new Date(e.target.value);
            onChange(date);
          }}
        />
      </div>
    );
  };
});

// Mock react-toggle
jest.mock('react-toggle', () => {
  return function MockToggle({ checked, onChange, ...props }) {
    return (
      <input
        type="checkbox"
        data-testid="toggle"
        checked={checked}
        onChange={onChange}
        {...props}
      />
    );
  };
});

// Mock child components
jest.mock('../Alert', () => ({ type, text }) => (
  <div data-testid="alert" data-type={type}>{text}</div>
));

jest.mock('./AutoGrowTextarea', () => ({ value, onChange, ...props }) => (
  <textarea 
    data-testid="auto-grow-textarea" 
    value={value} 
    onChange={onChange} 
    {...props} 
  />
));

jest.mock('./ParametersTable', () => ({ parameters, onChange }) => (
  <div data-testid="parameters-table" onClick={() => onChange && onChange({ entries: {} })}>
    Parameters: {Object.keys(parameters.entries).length}
  </div>
));

// Mock CSS import
jest.mock('../style.css', () => ({}));

// Mock utilities
jest.mock('../../utils/utilities', () => ({
  checkWithinFiveCalendarDays: jest.fn(() => false),
}));

describe('Advanced', () => {
  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key) => {
          const mockData = {
            openUseAdvanced: 'false',
            as_of_date: '',
            market_date: '',
            trade_as_of_date: '',
            tradeOption: 'INCLUDE',
            tradedIdList: '',
            generateQIA: '',
            parameters: null,
            switchTab: 'Date',
          };
          return mockData[key] || null;
        }),
        setItem: jest.fn(),
      },
      writable: true,
    });

    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn(() => '20210115'),
      },
      writable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<Advanced />);
    expect(screen.getByText(/Advanced/)).toBeInTheDocument();
  });

  it('should open modal when advanced button is clicked', () => {
    render(<Advanced />);
    const advancedButton = screen.getByText(/Advanced/);
    fireEvent.click(advancedButton);
    
    expect(screen.getByText(/Advanced Override And Filter/)).toBeInTheDocument();
  });

  it('should close modal when cancel is clicked', async () => {
    render(<Advanced />);
    
    // Open modal
    const advancedButton = screen.getByText(/Advanced/);
    fireEvent.click(advancedButton);
    
    // Close modal
    const cancelButton = screen.getByText(/Cancel/);
    fireEvent.click(cancelButton);
    
    await waitFor(() => {
      expect(screen.queryByText(/Advanced Override And Filter/)).not.toBeInTheDocument();
    });
  });

  it('should toggle advanced mode', () => {
    render(<Advanced />);
    
    // Open modal
    fireEvent.click(screen.getByText(/Advanced/));
    
    // Toggle advanced mode
    const toggle = screen.getByTestId('toggle');
    expect(toggle.checked).toBe(false);
    
    fireEvent.click(toggle);
    expect(toggle.checked).toBe(true);
  });

  it('should switch between Date and Parameters tabs', () => {
    render(<Advanced />);
    
    // Open modal
    fireEvent.click(screen.getByText(/Advanced/));
    
    // Switch to Parameters tab
    const parametersTab = screen.getByText(/Parameters/);
    fireEvent.click(parametersTab);
    
    expect(screen.getByTestId('parameters-table')).toBeInTheDocument();
  });

  it('should handle date changes', () => {
    render(<Advanced />);
    
    // Open modal and enable advanced mode
    fireEvent.click(screen.getByText(/Advanced/));
    const toggle = screen.getByTestId('toggle');
    fireEvent.click(toggle);
    
    // Find date picker and change value
    const dateInputs = screen.getAllByTestId('date-picker-input');
    fireEvent.change(dateInputs[0], { target: { value: '2021-01-15' } });
    
    // The component should handle the date change
    expect(dateInputs[0].value).toBe('2021-01-15');
  });

  it('should handle trade option changes', () => {
    render(<Advanced />);
    
    // Open modal and enable advanced mode
    fireEvent.click(screen.getByText(/Advanced/));
    const toggle = screen.getByTestId('toggle');
    fireEvent.click(toggle);
    
    // Find trade option select
    const tradeSelect = screen.getByDisplayValue('Include');
    fireEvent.change(tradeSelect, { target: { value: 'EXCLUDE' } });
    
    expect(tradeSelect.value).toBe('EXCLUDE');
  });

  it('should handle QIA generation toggle', () => {
    render(<Advanced />);
    
    // Open modal and enable advanced mode
    fireEvent.click(screen.getByText(/Advanced/));
    const toggle = screen.getByTestId('toggle');
    fireEvent.click(toggle);
    
    // Find and toggle QIA checkbox
    const qiaCheckbox = screen.getByRole('checkbox', { name: '' });
    fireEvent.click(qiaCheckbox);
    
    expect(qiaCheckbox.checked).toBe(true);
  });
});