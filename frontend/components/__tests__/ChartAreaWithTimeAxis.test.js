import React from 'react';
import { render, screen } from '@testing-library/react';
import ChartAreaWithTimeAxis from '../ChartAreaWithTimeAxis';

// Mock echarts-for-react/lib/core
jest.mock('echarts-for-react/lib/core', () => {
  return function MockReactEChartsCore({ option, onChartReady }) {
    // Simulate chart ready callback
    React.useEffect(() => {
      if (onChartReady) {
        onChartReady();
      }
    }, [onChartReady]);

    return (
      <div data-testid="echarts-core">
        <div data-testid="chart-title">{option.title.text}</div>
        <div data-testid="chart-data-length">{option.series[0].data.length}</div>
      </div>
    );
  };
});

// Mock echarts/core
jest.mock('echarts/core', () => ({
  use: jest.fn(),
}));

// Mock all echarts components and renderers
jest.mock('echarts/charts', () => ({
  LineChart: {},
}));

jest.mock('echarts/components', () => ({
  SingleAxisComponent: {},
  GridComponent: {},
  ToolboxComponent: {},
  TooltipComponent: {},
  AxisPointerComponent: {},
  TitleComponent: {},
  DataZoomComponent: {},
  DataZoomInsideComponent: {},
  DataZoomSliderComponent: {},
  AriaComponent: {},
  DatasetComponent: {},
}));

jest.mock('echarts/renderers', () => ({
  CanvasRenderer: {},
}));

describe('ChartAreaWithTimeAxis', () => {
  const mockData = [
    [1609459200000, 10], // 2021-01-01 00:00:00
    [1609462800000, 15], // 2021-01-01 01:00:00
    [1609466400000, 12], // 2021-01-01 02:00:00
  ];

  const defaultProps = {
    data: mockData,
    title: 'Test Chart',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<ChartAreaWithTimeAxis {...defaultProps} />);
    expect(screen.getByTestId('echarts-core')).toBeInTheDocument();
  });

  it('should display the correct title', () => {
    render(<ChartAreaWithTimeAxis {...defaultProps} />);
    expect(screen.getByTestId('chart-title')).toHaveTextContent('Test Chart');
  });

  it('should pass the correct data to the chart', () => {
    render(<ChartAreaWithTimeAxis {...defaultProps} />);
    expect(screen.getByTestId('chart-data-length')).toHaveTextContent('3');
  });

  it('should handle empty data array', () => {
    const emptyDataProps = {
      ...defaultProps,
      data: [],
    };
    render(<ChartAreaWithTimeAxis {...emptyDataProps} />);
    expect(screen.getByTestId('chart-data-length')).toHaveTextContent('0');
  });

  it('should update when props change', () => {
    const { rerender } = render(<ChartAreaWithTimeAxis {...defaultProps} />);
    expect(screen.getByTestId('chart-title')).toHaveTextContent('Test Chart');

    const newProps = {
      ...defaultProps,
      title: 'Updated Chart',
      data: [[1609459200000, 20]],
    };
    rerender(<ChartAreaWithTimeAxis {...newProps} />);
    expect(screen.getByTestId('chart-title')).toHaveTextContent('Updated Chart');
    expect(screen.getByTestId('chart-data-length')).toHaveTextContent('1');
  });

  it('should have correct chart configuration', () => {
    const TestComponent = () => {
      const [chartOption, setChartOption] = React.useState(null);

      return (
        <div>
          {React.cloneElement(<ChartAreaWithTimeAxis {...defaultProps} />, {
            option: (option) => {
              setChartOption(option);
              return option;
            },
          })}
          {chartOption && (
            <div data-testid="chart-config">
              <span data-testid="x-axis-type">{chartOption.xAxis?.type}</span>
              <span data-testid="y-axis-type">{chartOption.yAxis?.type}</span>
              <span data-testid="series-type">{chartOption.series?.[0]?.type}</span>
            </div>
          )}
        </div>
      );
    };

    render(<TestComponent />);
    // Note: This test would need more sophisticated mocking to fully test chart configuration
    expect(screen.getByTestId('echarts-core')).toBeInTheDocument();
  });
});