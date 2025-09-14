import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CobDateDropDown from '../CobDateDropDown';

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

// Mock moment
jest.mock('moment', () => {
  const actualMoment = jest.requireActual('moment');
  const mockMoment = (date) => ({
    format: (format) => {
      if (format === actualMoment.HTML5_FMT.DATE) {
        return '2021-01-15T00:00:00';
      }
      return '20210115';
    },
  });
  mockMoment.HTML5_FMT = { DATE: 'YYYY-MM-DDTHH:mm:ss' };
  return mockMoment;
});

// Mock currentUser HOC
jest.mock('../currentUser', () => ({
  withCurrentUser: (Component) => (props) => (
    <Component {...props} currentUser={{ username: 'testuser', id: 1 }} />
  ),
}));

// Mock userService
jest.mock('../../backend/user', () => ({
  getUserPreferences: jest.fn(),
  updateUserPreferences: jest.fn(),
}));

// Mock ScorchPropTypes
jest.mock('../../proptypes/scorch', () => ({
  currentUser: () => ({
    isRequired: {},
  }),
}));

// Mock CSS import
jest.mock('react-datepicker/dist/react-datepicker.css', () => ({}));

describe('CobDateDropDown', () => {
  const mockUserService = require('../../backend/user');

  const defaultProps = {
    onDateSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful user preferences response
    mockUserService.getUserPreferences.mockResolvedValue({
      cobDate: 'JobContext',
    });
    
    // Mock session storage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        setItem: jest.fn(),
        getItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    // Mock timezone
    global.Intl = {
      DateTimeFormat: () => ({
        resolvedOptions: () => ({ timeZone: 'America/New_York' }),
      }),
    };
  });

  it('should render without crashing', async () => {
    render(<CobDateDropDown {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  it('should display default cobDate as JobContext', async () => {
    render(<CobDateDropDown {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText(/JobContext/)).toBeInTheDocument();
    });
  });

  it('should load user preferences on mount', async () => {
    render(<CobDateDropDown {...defaultProps} />);
    await waitFor(() => {
      expect(mockUserService.getUserPreferences).toHaveBeenCalledWith({
        username: 'testuser',
        id: 1,
      });
    });
  });

  it('should display custom cobDate when loaded from preferences', async () => {
    mockUserService.getUserPreferences.mockResolvedValue({
      cobDate: '20210115',
    });

    render(<CobDateDropDown {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText(/20210115/)).toBeInTheDocument();
    });
  });

  it('should handle date selection', async () => {
    const onDateSelectMock = jest.fn();
    render(<CobDateDropDown onDateSelect={onDateSelectMock} />);

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    // Click on Today button
    const todayButton = screen.getByText('Today');
    fireEvent.click(todayButton);

    await waitFor(() => {
      expect(onDateSelectMock).toHaveBeenCalled();
    });
  });

  it('should update session storage with cobDate', async () => {
    mockUserService.getUserPreferences.mockResolvedValue({
      cobDate: '20210115',
    });

    render(<CobDateDropDown {...defaultProps} />);
    await waitFor(() => {
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
        'scorch.ui.cobdate',
        '20210115'
      );
    });
  });

  it('should handle user preferences loading error', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockUserService.getUserPreferences.mockRejectedValue(new Error('Failed to load'));

    render(<CobDateDropDown {...defaultProps} />);
    await waitFor(() => {
      expect(mockUserService.getUserPreferences).toHaveBeenCalled();
    });

    consoleLogSpy.mockRestore();
  });

  it('should not call onDateSelect when selecting the same date', async () => {
    const onDateSelectMock = jest.fn();
    mockUserService.getUserPreferences.mockResolvedValue({
      cobDate: 'JobContext',
    });

    render(<CobDateDropDown onDateSelect={onDateSelectMock} />);

    await waitFor(() => {
      expect(screen.getByText('Job Context')).toBeInTheDocument();
    });

    // Click on Job Context button (same as current)
    const jobContextButton = screen.getByText('Job Context');
    fireEvent.click(jobContextButton);

    await waitFor(() => {
      expect(onDateSelectMock).not.toHaveBeenCalled();
    });
  });

  it('should handle timezone in date selection', async () => {
    const onDateSelectMock = jest.fn();
    render(<CobDateDropDown onDateSelect={onDateSelectMock} />);

    await waitFor(() => {
      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    const todayButton = screen.getByText('Today');
    fireEvent.click(todayButton);

    await waitFor(() => {
      expect(onDateSelectMock).toHaveBeenCalledWith('Today America/New_York');
    });
  });

  it('should add focus event listener on mount and remove on unmount', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = render(<CobDateDropDown {...defaultProps} />);

    expect(addEventListenerSpy).toHaveBeenCalledWith('focus', expect.any(Function));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('focus', expect.any(Function));

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });
});