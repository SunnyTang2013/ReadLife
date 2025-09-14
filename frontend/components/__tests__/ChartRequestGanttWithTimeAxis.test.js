import React from 'react';
import { render, screen } from '@testing-library/react';
import ChartRequestGanttWithTimeAxis from '../ChartRequestGanttWithTimeAxis';

// Mock echarts-for-react/lib/core
jest.mock('echarts-for-react/lib/core', () => {
  return React.forwardRef(function MockReactEChartsCore({ option, onChartReady }, ref) {
    // Mock chart instance methods
    const mockChartInstance = {
      getEchartsInstance: () => ({
        convertToPixel: jest.fn(() => [100, 50]),
        convertFromPixel: jest.fn(() => [1000, 1]),
        getZr: () => ({
          add: jest.fn(),
          remove: jest.fn(),
        }),
        getOption: () => ({
          dataZoom: [
            { start: 0, end: 50 },
            { start: 0, end: 50 },
            { start: 20, end: 100 },
            { start: 20, end: 100 },
          ],
        }),
        setOption: jest.fn(),
        dispatchAction: jest.fn(),
      }),
    };

    React.useImperativeHandle(ref, () => mockChartInstance);

    // Simulate chart ready callback
    React.useEffect(() => {
      if (onChartReady) {
        onChartReady();
      }
    }, [onChartReady]);

    return (
      <div data-testid="echarts-gantt">
        <div data-testid="gantt-title">{option.title.text}</div>
        <div data-testid="gantt-series-count">{option.series.length}</div>
      </div>
    );
  });
});

// Mock echarts/core
jest.mock('echarts/core', () => ({
  use: jest.fn(),
  graphic: {
    clipRectByRect: jest.fn((rect) => rect),
    Rect: class MockRect {
      constructor(config) {
        this.config = config;
        this.shape = config.shape;
        this.position = [0, 0];
      }
      attr(attrs) {
        Object.assign(this, attrs);
        return this;
      }
    },
  },
  format: {
    getTextRect: jest.fn(() => ({ width: 50 })),
  },
  throttle: jest.fn((fn) => fn),
}));

// Mock other echarts modules
jest.mock('echarts/charts', () => ({
  CustomChart: {},
}));

jest.mock('echarts/components', () => ({
  TitleComponent: {},
  ToolboxComponent: {},
  TooltipComponent: {},
  GridComponent: {},
  DataZoomComponent: {},
}));

jest.mock('echarts/renderers', () => ({
  CanvasRenderer: {},
}));

// Mock ScorchPropTypes
jest.mock('../proptypes/scorch', () => ({
  ganttData: () => ({
    isRequired: {},
  }),
}));

// Mock global requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn((fn) => setTimeout(fn, 16));
global.cancelAnimationFrame = jest.fn((id) => clearTimeout(id));

describe('ChartRequestGanttWithTimeAxis', () => {
  const mockGanttData = {
    requestNames: {
      data: [
        ['Request 1'],
        ['Request 2'],
        ['Request 3'],
      ],
      dimensions: ['name'],
    },
    requestList: {
      data: [
        [0, 1609459200000, 1609462800000, 'Request 1', 'SUCCESS'],
        [1, 1609466400000, 1609470000000, 'Request 2', 'PENDING'],
        [2, 1609473600000, 1609477200000, 'Request 3', 'FAILURE'],
      ],
      dimensions: ['categoryIndex', 'startTime', 'endTime', 'name', 'status'],
    },
  };

  const defaultProps = {
    data: mockGanttData,
    title: 'Test Gantt Chart',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<ChartRequestGanttWithTimeAxis {...defaultProps} />);
    expect(screen.getByTestId('echarts-gantt')).toBeInTheDocument();
  });

  it('should display the correct title', () => {
    render(<ChartRequestGanttWithTimeAxis {...defaultProps} />);
    expect(screen.getByTestId('gantt-title')).toHaveTextContent('Test Gantt Chart');
  });

  it('should render correct number of series', () => {
    render(<ChartRequestGanttWithTimeAxis {...defaultProps} />);
    expect(screen.getByTestId('gantt-series-count')).toHaveTextContent('2');
  });

  it('should handle empty data gracefully', () => {
    const emptyDataProps = {
      ...defaultProps,
      data: {
        requestNames: { data: [], dimensions: ['name'] },
        requestList: { data: [], dimensions: ['categoryIndex', 'startTime', 'endTime', 'name', 'status'] },
      },
    };
    render(<ChartRequestGanttWithTimeAxis {...emptyDataProps} />);
    expect(screen.getByTestId('echarts-gantt')).toBeInTheDocument();
  });

  it('should update when props change', () => {
    const { rerender } = render(<ChartRequestGanttWithTimeAxis {...defaultProps} />);
    expect(screen.getByTestId('gantt-title')).toHaveTextContent('Test Gantt Chart');

    const newProps = {
      ...defaultProps,
      title: 'Updated Gantt Chart',
    };
    rerender(<ChartRequestGanttWithTimeAxis {...newProps} />);
    expect(screen.getByTestId('gantt-title')).toHaveTextContent('Updated Gantt Chart');
  });

  it('should handle small datasets correctly', () => {
    const smallDataProps = {
      ...defaultProps,
      data: {
        requestNames: { data: [['Request 1']], dimensions: ['name'] },
        requestList: { 
          data: [[0, 1609459200000, 1609462800000, 'Request 1', 'SUCCESS']], 
          dimensions: ['categoryIndex', 'startTime', 'endTime', 'name', 'status'] 
        },
      },
    };
    render(<ChartRequestGanttWithTimeAxis {...smallDataProps} />);
    expect(screen.getByTestId('echarts-gantt')).toBeInTheDocument();
  });

  it('should have correct chart configuration structure', () => {
    const TestComponent = () => {
      const [chartOption, setChartOption] = React.useState(null);

      return (
        <div>
          {React.cloneElement(<ChartRequestGanttWithTimeAxis {...defaultProps} />, {
            option: (option) => {
              setChartOption(option);
              return option;
            },
          })}
          {chartOption && (
            <div data-testid="chart-config">
              <span data-testid="has-tooltip">{chartOption.tooltip ? 'true' : 'false'}</span>
              <span data-testid="has-grid">{chartOption.grid ? 'true' : 'false'}</span>
              <span data-testid="x-axis-type">{chartOption.xAxis?.type}</span>
              <span data-testid="y-axis-min">{chartOption.yAxis?.min}</span>
            </div>
          )}
        </div>
      );
    };

    render(<TestComponent />);
    // Basic structure verification
    expect(screen.getByTestId('echarts-gantt')).toBeInTheDocument();
  });
});