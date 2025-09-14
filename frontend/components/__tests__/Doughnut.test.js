import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Doughnut from '../Doughnut';

// Mock Chart.js
jest.mock('chart.js', () => ({
  Chart: jest.fn().mockImplementation(() => ({
    data: {},
    update: jest.fn(),
    destroy: jest.fn()
  }))
}));

// Mock jQuery
jest.mock('jquery', () => jest.fn(() => ({
  // Mock jQuery object
})));

describe('Doughnut', () => {
  const mockData = {
    success: { value: 10, color: '#28a745' },
    failure: { value: 5, color: '#dc3545' },
    pending: { value: 3, color: '#ffc107' }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders canvas element', () => {
    const { container } = render(<Doughnut data={mockData} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  test('applies default size style', () => {
    const { container } = render(<Doughnut data={mockData} />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveStyle({
      width: '100%',
      height: '100%'
    });
  });

  test('applies custom size style', () => {
    const customSize = '200px';
    const { container } = render(<Doughnut data={mockData} size={customSize} />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveStyle({
      width: customSize,
      height: customSize
    });
  });

  test('canvas has correct style attributes', () => {
    const { container } = render(<Doughnut data={mockData} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toHaveStyle({
      width: '100vw',
      height: '100vw'
    });
  });

  test('creates Chart instance with correct config', () => {
    const Chart = require('chart.js').Chart;
    render(<Doughnut data={mockData} />);
    
    expect(Chart).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: 'doughnut',
        options: {
          cutoutPercentage: 75,
          legend: { display: false }
        }
      })
    );
  });

  test('handles empty data object', () => {
    const { container } = render(<Doughnut data={{}} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  test('updates chart when data changes', () => {
    const Chart = require('chart.js').Chart;
    const mockUpdate = jest.fn();
    Chart.mockImplementation(() => ({
      data: {},
      update: mockUpdate,
      destroy: jest.fn()
    }));

    const { rerender } = render(<Doughnut data={mockData} />);
    
    const newData = {
      ...mockData,
      ongoing: { value: 2, color: '#007bff' }
    };
    
    rerender(<Doughnut data={newData} />);
    
    expect(mockUpdate).toHaveBeenCalled();
  });

  test('destroys chart on unmount', () => {
    const Chart = require('chart.js').Chart;
    const mockDestroy = jest.fn();
    Chart.mockImplementation(() => ({
      data: {},
      update: jest.fn(),
      destroy: mockDestroy
    }));

    const { unmount } = render(<Doughnut data={mockData} />);
    unmount();
    
    expect(mockDestroy).toHaveBeenCalled();
  });
});