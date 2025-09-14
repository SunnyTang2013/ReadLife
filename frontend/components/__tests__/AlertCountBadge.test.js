import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AlertCountBadge from '../AlertCountBadge';

describe('AlertCountBadge', () => {
  test('renders badge with text when text is provided', () => {
    const testText = '5';
    render(<AlertCountBadge text={testText} />);
    
    const badge = screen.getByText(testText);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('badge', 'badge-warning');
  });

  test('renders empty span when text is null', () => {
    const { container } = render(<AlertCountBadge text={null} />);
    const span = container.querySelector('span');
    expect(span).toBeInTheDocument();
    expect(span).toBeEmptyDOMElement();
  });

  test('renders empty span when text is empty string', () => {
    const { container } = render(<AlertCountBadge text="" />);
    const span = container.querySelector('span');
    expect(span).toBeInTheDocument();
    expect(span).toBeEmptyDOMElement();
  });

  test('renders empty span when text is undefined', () => {
    const { container } = render(<AlertCountBadge text={undefined} />);
    const span = container.querySelector('span');
    expect(span).toBeInTheDocument();
    expect(span).toBeEmptyDOMElement();
  });

  test('renders badge with numeric text', () => {
    const testText = '10';
    render(<AlertCountBadge text={testText} />);
    
    const badge = screen.getByText(testText);
    expect(badge).toBeInTheDocument();
    expect(badge.parentElement).toHaveClass('text-muted', 'ml-2');
  });

  test('renders badge with string text', () => {
    const testText = 'Warning';
    render(<AlertCountBadge text={testText} />);
    
    const badge = screen.getByText(testText);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('badge', 'badge-warning', 'ml-2');
  });

  test('applies correct CSS classes to parent and badge', () => {
    const testText = 'Test';
    render(<AlertCountBadge text={testText} />);
    
    const badge = screen.getByText(testText);
    const parent = badge.parentElement;
    
    expect(parent).toHaveClass('text-muted', 'ml-2');
    expect(badge).toHaveClass('badge', 'badge-warning', 'ml-2');
  });
});