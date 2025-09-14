import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorAlert from '../ErrorAlert';

describe('ErrorAlert', () => {
  test('renders nothing when error is null', () => {
    const { container } = render(<ErrorAlert error={null} />);
    const hiddenDiv = container.querySelector('div[style*="display: none"]');
    expect(hiddenDiv).toBeInTheDocument();
  });

  test('renders nothing when error is undefined', () => {
    const { container } = render(<ErrorAlert error={undefined} />);
    const hiddenDiv = container.querySelector('div[style*="display: none"]');
    expect(hiddenDiv).toBeInTheDocument();
  });

  test('renders error message when error is provided', () => {
    const error = new Error('Something went wrong');
    render(<ErrorAlert error={error} />);
    
    expect(screen.getByText('Error: Something went wrong')).toBeInTheDocument();
  });

  test('renders error alert with correct CSS classes', () => {
    const error = new Error('Test error');
    render(<ErrorAlert error={error} />);
    
    const alert = screen.getByText('Error: Test error').closest('.alert');
    expect(alert).toHaveClass('alert', 'alert-danger', 'my-2');
  });

  test('displays error icon', () => {
    const error = new Error('Test error');
    const { container } = render(<ErrorAlert error={error} />);
    
    const icon = container.querySelector('i.fa-exclamation-triangle');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('fa', 'fa-fw', 'fa-exclamation-triangle', 'mr-1');
  });

  test('displays error URL and status when available', () => {
    const error = new Error('Network error');
    error.url = 'https://api.example.com/data';
    error.status = 404;
    
    render(<ErrorAlert error={error} />);
    
    expect(screen.getByText('https://api.example.com/data - 404')).toBeInTheDocument();
  });

  test('does not display URL/status badge when URL is missing', () => {
    const error = new Error('Simple error');
    error.status = 500;
    
    render(<ErrorAlert error={error} />);
    
    expect(screen.queryByText(/500/)).not.toBeInTheDocument();
  });

  test('does not display URL/status badge when status is missing', () => {
    const error = new Error('Simple error');
    error.url = 'https://api.example.com/data';
    
    render(<ErrorAlert error={error} />);
    
    expect(screen.queryByText(/https:\/\/api\.example\.com\/data/)).not.toBeInTheDocument();
  });

  test('URL/status badge has correct styling', () => {
    const error = new Error('Network error');
    error.url = 'https://api.example.com/data';
    error.status = 500;
    
    render(<ErrorAlert error={error} />);
    
    const badge = screen.getByText('https://api.example.com/data - 500');
    expect(badge).toHaveClass('badge', 'badge-danger');
    expect(badge.parentElement).toHaveClass('text-right', 'mt-2');
  });

  test('converts error to string properly', () => {
    const error = new Error('Custom error message');
    render(<ErrorAlert error={error} />);
    
    expect(screen.getByText('Error: Custom error message')).toBeInTheDocument();
  });

  test('handles string errors', () => {
    const error = 'String error message';
    render(<ErrorAlert error={error} />);
    
    expect(screen.getByText('String error message')).toBeInTheDocument();
  });
});