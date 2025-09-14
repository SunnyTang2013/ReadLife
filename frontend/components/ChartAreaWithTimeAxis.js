import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { SingleAxisComponent,
  // GridSimpleComponent,
  GridComponent,
  // PolarComponent,
  // RadarComponent,
  // GeoComponent,
  // ParallelComponent,
  // CalendarComponent,
  // GraphicComponent,
  ToolboxComponent,
  TooltipComponent,
  AxisPointerComponent,
  // BrushComponent,
  TitleComponent,
  // TimelineComponent,
  // MarkPointComponent,
  // MarkLineComponent,
  // MarkAreaComponent,
  // LegendComponent,
  // LegendScrollComponent,
  // LegendPlainComponent,
  DataZoomComponent,
  DataZoomInsideComponent,
  DataZoomSliderComponent,
  // VisualMapComponent,
  // VisualMapContinuousComponent,
  // VisualMapPiecewiseComponent,
  AriaComponent,
  // TransformComponent,
  DatasetComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use(
  [LineChart, SingleAxisComponent, ToolboxComponent, AxisPointerComponent, TitleComponent,
    TooltipComponent, DataZoomComponent, DataZoomInsideComponent, DataZoomSliderComponent,
    DataZoomSliderComponent, CanvasRenderer, AriaComponent, DatasetComponent, GridComponent],
);

function onChartReadyCallback() {
  console.log('Chart is Ready');
}

function onChartClick() {
  console.log('Click Chart');
}

function onChartLegendSelectChanged() {
  console.log('Chart Legend Select Changed');
}

/**
 * This component shows a doughnut chart for the given data.
 *
 * https://www.npmjs.com/package/echarts-for-react?activeTab=readme
 * https://www.npmjs.com/package/echarts?activeTab=readme
 *
 * Data should be structured as following:
 *
 *   {
 *     key1: {value: 12, color: '#000'},
 *     key2: {value: 34, color: '#111'},
 *     key3: {value: 56, color: '#222'},
 *     ...
 *   }
 */
function ChartAreaWithTimeAxis({ data, title }) {
  const getOption = useCallback(() => {
    // const oneDay = 24 * 3600 * 1000;
    // const fiveMinutes = 300 * 1000;
    // let base = +new Date() - oneDay;
    // const data = [[base, Math.random() * 300]];
    // for (let i = 1; i < 289; i++) {
    //   const now = new Date((base += fiveMinutes));
    //   data.push([+now, Math.round((Math.random() - 0.5) * 20 + data[i - 1][1])]);
    // }
    const option = {
      tooltip: {
        trigger: 'axis',
        position: function (pt) {
          return [pt[0], '10%'];
        },
      },
      title: {
        left: 'center',
        text: title,
      },
      toolbox: {
        feature: {
          // dataZoom: {
          //   yAxisIndex: 'none',
          // },
          restore: {},
          saveAsImage: {},
        },
      },
      xAxis: {
        type: 'time',
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        boundaryGap: [0, '100%'],
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 20,
        },
        {
          start: 0,
          end: 20,
        },
      ],
      series: [
        {
          name: 'Count',
          type: 'line',
          smooth: true,
          symbol: 'none',
          areaStyle: {},
          data: data,
        },
      ],
    };

    return option;
  }, [data, title]);

  const onEvents = useMemo(() => ({
    click: onChartClick,
    legendselectchanged: onChartLegendSelectChanged,
  }), []);

  const chartOption = getOption();

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={chartOption}
      notMerge
      lazyUpdate
      theme="theme_name"
      onChartReady={onChartReadyCallback}
      onEvents={onEvents}
      // opts={}
    />
  );
}

ChartAreaWithTimeAxis.propTypes = {
  data: PropTypes.array.isRequired,
  title: PropTypes.string.isRequired,
};

// ChartAreaWithTimeAxis.defaultProps = {
//   size: '100%',
// };

export default ChartAreaWithTimeAxis;