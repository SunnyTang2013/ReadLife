import React from 'react';
import { render, screen } from '@testing-library/react';
import RequestStatusBadge from '../RequestStatusBadge';

describe('RequestStatusBadge', () => {
  it('should render without crashing', () => {
    render(<RequestStatusBadge status="SUCCESS" />);
    expect(screen.getByText('SUCCESS')).toBeInTheDocument();
  });

  it('should display PENDING status with secondary badge', () => {
    render(<RequestStatusBadge status="PENDING" />);
    const badge = screen.getByText('PENDING');
    expect(badge).toHaveClass('badge', 'badge-secondary');
  });

  it('should display SUCCESS status with purple badge', () => {
    render(<RequestStatusBadge status="SUCCESS" />);
    const badge = screen.getByText('SUCCESS');
    expect(badge).toHaveClass('badge', 'badge-purple');
  });

  it('should display FAILURE status with danger badge', () => {
    render(<RequestStatusBadge status="FAILURE" />);
    const badge = screen.getByText('FAILURE');
    expect(badge).toHaveClass('badge', 'badge-danger');
  });

  it('should display ONGOING status with blue badge when no errors', () => {
    render(<RequestStatusBadge status="ONGOING" errorGoingNumber={0} />);
    const badge = screen.getByText('ONGOING');
    expect(badge).toHaveClass('badge', 'badge-blue');
  });

  it('should display ONGOING status with warning badge when there are errors', () => {
    render(<RequestStatusBadge status="ONGOING" errorGoingNumber={5} />);
    const outerBadge = screen.getByText(/ONGOING/);
    expect(outerBadge).toHaveClass('badge', 'badge-warning', 'outter-badge');
    
    const innerBadge = screen.getByText('5');
    expect(innerBadge).toHaveClass('badge', 'badge-danger', 'inner-badge');
  });

  it('should display unknown status with warning badge', () => {
    render(<RequestStatusBadge status="UNKNOWN" />);
    const badge = screen.getByText('UNKNOWN');
    expect(badge).toHaveClass('badge', 'badge-warning');
  });

  it('should handle negative errorGoingNumber', () => {
    render(<RequestStatusBadge status="ONGOING" errorGoingNumber={-1} />);
    const badge = screen.getByText('ONGOING');
    expect(badge).toHaveClass('badge', 'badge-blue');
    expect(screen.queryByText('-1')).not.toBeInTheDocument();
  });

  it('should handle zero errorGoingNumber', () => {
    render(<RequestStatusBadge status="ONGOING" errorGoingNumber={0} />);
    const badge = screen.getByText('ONGOING');
    expect(badge).toHaveClass('badge', 'badge-blue');
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('should show error count for positive errorGoingNumber', () => {
    render(<RequestStatusBadge status="ONGOING" errorGoingNumber={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('3')).toHaveClass('badge', 'badge-danger', 'inner-badge');
  });

  it('should use default errorGoingNumber when not provided', () => {
    render(<RequestStatusBadge status="ONGOING" />);
    const badge = screen.getByText('ONGOING');
    expect(badge).toHaveClass('badge', 'badge-blue');
  });

  it('should handle empty status string', () => {
    render(<RequestStatusBadge status="" />);
    const badge = screen.getByText('');
    expect(badge).toHaveClass('badge', 'badge-warning');
  });

  it('should handle large error numbers', () => {
    render(<RequestStatusBadge status="ONGOING" errorGoingNumber={999} />);
    expect(screen.getByText('999')).toBeInTheDocument();
    const outerBadge = screen.getByText(/ONGOING/);
    expect(outerBadge).toHaveClass('badge', 'badge-warning', 'outter-badge');
  });

  it('should properly structure nested badges for ongoing errors', () => {
    render(<RequestStatusBadge status="ONGOING" errorGoingNumber={2} />);
    
    // Check outer span structure
    const outerSpan = screen.getByText(/ONGOING/).closest('span');
    expect(outerSpan).toHaveClass('badge', 'badge-warning', 'outter-badge');
    
    // Check inner div structure
    const innerDiv = screen.getByText('2');
    expect(innerDiv.tagName).toBe('DIV');
    expect(innerDiv).toHaveClass('badge', 'badge-danger', 'inner-badge');
  });
});