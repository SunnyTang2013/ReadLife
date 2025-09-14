import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AutoGrowTextarea from '../AutoGrowTextarea';

describe('AutoGrowTextarea', () => {
  const defaultProps = {
    placeholder: 'Enter text here',
    value: '',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<AutoGrowTextarea {...defaultProps} />);
    const textarea = screen.getByPlaceholderText('Enter text here');
    expect(textarea).toBeInTheDocument();
  });

  it('should display the correct value', () => {
    const props = {
      ...defaultProps,
      value: 'Test value',
    };
    render(<AutoGrowTextarea {...props} />);
    const textarea = screen.getByDisplayValue('Test value');
    expect(textarea).toBeInTheDocument();
  });

  it('should call onChange when text is typed', () => {
    const handleChange = jest.fn();
    const props = {
      ...defaultProps,
      onChange: handleChange,
    };
    render(<AutoGrowTextarea {...props} />);
    
    const textarea = screen.getByPlaceholderText('Enter text here');
    fireEvent.change(textarea, { target: { value: 'New text' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          value: 'New text',
        }),
        type: 'change',
      })
    );
  });

  it('should have proper styling', () => {
    render(<AutoGrowTextarea {...defaultProps} />);
    const textarea = screen.getByPlaceholderText('Enter text here');
    
    expect(textarea).toHaveStyle('resize: none');
    expect(textarea).toHaveStyle('height: auto');
    expect(textarea).toHaveStyle('overflowY: hidden');
  });

  it('should merge custom styles', () => {
    const customStyle = {
      backgroundColor: 'red',
      fontSize: '16px',
    };
    const props = {
      ...defaultProps,
      style: customStyle,
    };
    render(<AutoGrowTextarea {...props} />);
    const textarea = screen.getByPlaceholderText('Enter text here');
    
    // Should have both custom and default styles
    expect(textarea).toHaveStyle('backgroundColor: red');
    expect(textarea).toHaveStyle('fontSize: 16px');
    expect(textarea).toHaveStyle('resize: none');
    expect(textarea).toHaveStyle('overflowY: hidden');
  });

  it('should have initial rows set to 1', () => {
    render(<AutoGrowTextarea {...defaultProps} />);
    const textarea = screen.getByPlaceholderText('Enter text here');
    expect(textarea).toHaveAttribute('rows', '1');
  });

  it('should pass through additional props', () => {
    const props = {
      ...defaultProps,
      disabled: true,
      'data-testid': 'custom-textarea',
      className: 'custom-class',
    };
    render(<AutoGrowTextarea {...props} />);
    
    const textarea = screen.getByTestId('custom-textarea');
    expect(textarea).toBeDisabled();
    expect(textarea).toHaveClass('custom-class');
  });

  it('should handle empty style prop', () => {
    const props = {
      ...defaultProps,
      style: {},
    };
    render(<AutoGrowTextarea {...props} />);
    const textarea = screen.getByPlaceholderText('Enter text here');
    
    expect(textarea).toHaveStyle('resize: none');
    expect(textarea).toHaveStyle('height: auto');
    expect(textarea).toHaveStyle('overflowY: hidden');
  });

  it('should handle undefined style prop', () => {
    const props = {
      ...defaultProps,
      style: undefined,
    };
    render(<AutoGrowTextarea {...props} />);
    const textarea = screen.getByPlaceholderText('Enter text here');
    
    expect(textarea).toHaveStyle('resize: none');
    expect(textarea).toHaveStyle('height: auto');
    expect(textarea).toHaveStyle('overflowY: hidden');
  });
});