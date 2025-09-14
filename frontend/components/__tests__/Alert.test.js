import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Alert from '../Alert';

describe('Alert', () => {
  test('renders primary alert with correct styles and text', () => {
    const text = 'This is a primary alert';
    render(<Alert type="primary" text={text} />);
    
    const alertDiv = screen.getByText(text).parentElement;
    const icon = alertDiv.querySelector('i');
    
    expect(alertDiv).toHaveClass('alert', 'alert-primary', 'my-2');
    expect(icon).toHaveClass('fa', 'fa-fw', 'fa-info-circle', 'mr-1');
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  test('renders success alert with correct styles and text', () => {
    const text = 'This is a success alert';
    render(<Alert type="success" text={text} />);
    
    const alertDiv = screen.getByText(text).parentElement;
    const icon = alertDiv.querySelector('i');
    
    expect(alertDiv).toHaveClass('alert', 'alert-success', 'my-2');
    expect(icon).toHaveClass('fa', 'fa-fw', 'fa-check-circle-o', 'mr-1');
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  test('renders danger alert with correct styles and text', () => {
    const text = 'This is a danger alert';
    render(<Alert type="danger" text={text} />);
    
    const alertDiv = screen.getByText(text).parentElement;
    const icon = alertDiv.querySelector('i');
    
    expect(alertDiv).toHaveClass('alert', 'alert-danger', 'my-2');
    expect(icon).toHaveClass('fa', 'fa-fw', 'fa-exclamation-triangle', 'mr-1');
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  test('renders warning alert with correct styles and text', () => {
    const text = 'This is a warning alert';
    render(<Alert type="warning" text={text} />);
    
    const alertDiv = screen.getByText(text).parentElement;
    const icon = alertDiv.querySelector('i');
    
    expect(alertDiv).toHaveClass('alert', 'alert-warning', 'my-2');
    expect(icon).toHaveClass('fa', 'fa-fw', 'fa-exclamation-triangle', 'mr-1');
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  test('renders default error message when text is empty', () => {
    render(<Alert type="primary" text="" />);
    
    const defaultMessage = 'An error occurred but no details are provided.';
    expect(screen.getByText(defaultMessage)).toBeInTheDocument();
  });

  test('renders default error message when text is null', () => {
    render(<Alert type="primary" text={null} />);
    
    const defaultMessage = 'An error occurred but no details are provided.';
    expect(screen.getByText(defaultMessage)).toBeInTheDocument();
  });

  test('renders custom text when provided', () => {
    const customText = 'Custom alert message';
    render(<Alert type="primary" text={customText} />);
    
    expect(screen.getByText(customText)).toBeInTheDocument();
  });

  test('contains both icon and text in same div', () => {
    const text = 'Test alert';
    render(<Alert type="success" text={text} />);
    
    const alertDiv = screen.getByText(text).parentElement;
    const icon = alertDiv.querySelector('i');
    
    expect(alertDiv).toContainElement(icon);
    expect(alertDiv).toHaveTextContent(text);
  });
});