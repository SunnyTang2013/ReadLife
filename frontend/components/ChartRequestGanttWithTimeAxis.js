import React, { useState, useRef, useCallback, useEffect } from 'react';

import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  GridComponent,
  DataZoomComponent } from 'echarts/components';
import { CustomChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import PropTypes from 'prop-types';
import ScorchPropTypes from '../proptypes/scorch';

echarts.use([
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  GridComponent,
  DataZoomComponent,
  CustomChart,
  CanvasRenderer,
]);

const HEIGHT_RATIO = 0.6;
const DIM_CATEGORY_INDEX = 0;
const DIM_TIME_START = 1;
const DIM_TIME_END = 2;
const DIM_REQ_NAME = 3;
const DIM_REQ_STATUS = 4;
const DATA_ZOOM_AUTO_MOVE_THROTTLE = 30;
const DATA_ZOOM_X_INSIDE_INDEX = 1;
const DATA_ZOOM_Y_INSIDE_INDEX = 3;
const DATA_ZOOM_AUTO_MOVE_SPEED = 0.2;
const DATA_ZOOM_AUTO_MOVE_DETECT_AREA_WIDTH = 30;

let autoDataZoomAnimator;

function getDefaultDataZoom(yAxisStart) {
  return [
    {
      type: 'slider',
      xAxisIndex: 0,
      filterMode: 'weakFilter',
      height: 20,
      bottom: 0,
      start: 0,
      end: 50,
      handleIcon:
        'path://M10.7,11.9H9.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4h1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
      handleSize: '80%',
      showDetail: false,
    },
    {
      type: 'inside',
      id: 'insideX',
      xAxisIndex: 0,
      filterMode: 'weakFilter',
      start: 0,
      end: 50,
      zoomOnMouseWheel: false,
      moveOnMouseMove: true,
    },
    {
      type: 'slider',
      yAxisIndex: 0,
      zoomLock: true,
      width: 10,
      right: 10,
      top: 70,
      bottom: 30,
      start: yAxisStart,
      end: 100,
      handleSize: 0,
      showDetail: false,
    },
    {
      type: 'inside',
      id: 'insideY',
      yAxisIndex: 0,
      start: yAxisStart,
      end: 100,
      zoomOnMouseWheel: false,
      moveOnMouseMove: true,
      moveOnMouseWheel: true,
    },
  ];
}

function renderAxisLabelItem(params, api) {
  const y = api.coord([0, api.value(0)])[1];
  if (y < params.coordSys.y + 5) {
    return {};
  }
  return {
    type: 'group',
    position: [10, y],
    children: [
      {
        type: 'text',
        style: {
          x: 24,
          y: -3,
          text: api.value(1),
          textVerticalAlign: 'bottom',
          textAlign: 'left',
          textFill: '#000',
        },
      },
    ],
  };
}

function clipRectByRect(params, rect) {
  return echarts.graphic.clipRectByRect(rect, {
    x: params.coordSys.x,
    y: params.coordSys.y,
    width: params.coordSys.width,
    height: params.coordSys.height,
  });
}

function prepareBatch(batch, id, start, end, cursorDist) {
  if (cursorDist === 0) {
    return;
  }
  const sign = cursorDist / Math.abs(cursorDist);
  const size = end - start;
  const delta = DATA_ZOOM_AUTO_MOVE_SPEED * sign;

  let startVal = start + delta;
  let endVal = end + delta;
  if (endVal > 100) {
    endVal = 100;
    startVal = end - size;
  }
  if (startVal < 0) {
    startVal = 0;
    endVal = start + size;
  }
  batch.push({
    dataZoomId: id,
    start: startVal,
    end: endVal,
  });
}

function getCursorCartesianDist(cursorXY, bounds) {
  const dist0 = cursorXY - (bounds[0] + DATA_ZOOM_AUTO_MOVE_DETECT_AREA_WIDTH);
  const dist1 = cursorXY - (bounds[1] - DATA_ZOOM_AUTO_MOVE_DETECT_AREA_WIDTH);
  // eslint-disable-next-line no-nested-ternary
  return dist0 * dist1 <= 0 ? 0 // cursor is in cartesian
    : dist0 < 0
      ? dist0 // cursor is at left/top of cartesian
      : dist1; // cursor is at right/bottom of cartesian
}

function makeAnimator(callback) {
  let requestId;
  let callbackParams;
  // Use throttle to prevent from calling dispatchAction frequently.
  // eslint-disable-next-line no-param-reassign
  callback = echarts.throttle(callback, DATA_ZOOM_AUTO_MOVE_THROTTLE);
  function onFrame() {
    callback(callbackParams);
    requestId = requestAnimationFrame(onFrame);
  }
  return {
    start: params => {
      callbackParams = params;
      if (requestId == null) {
        onFrame();
      }
    },
    stop: () => {
      if (requestId != null) {
        cancelAnimationFrame(requestId);
      }
      // eslint-disable-next-line no-multi-assign
      requestId = callbackParams = null;
    },
  };
}

function onChartClick() {
  console.log('Click Chart');
}

function ChartRequestGanttWithTimeAxis({ data, title }) {
  const [draggable, setDraggable] = useState(false);
  const [draggingEl, setDraggingEl] = useState(null);
  const [draggingCursorOffset, setDraggingCursorOffset] = useState([0, 0]);
  const [draggingTimeLength, setDraggingTimeLength] = useState(null);
  const [dropShadow, setDropShadow] = useState(null);
  const [dataZoom, setDataZoom] = useState([]);
  const [cartesianXBounds, setCartesianXBounds] = useState([]);
  const [cartesianYBounds, setCartesianYBounds] = useState([]);
  const [dropRecord, setDropRecord] = useState(null);

  const eChartRef = useRef(null);

  const addOrUpdateBar = useCallback((el, itemData, style, z) => {
    const myChart = eChartRef.current.getEchartsInstance();
    const pointArrival = myChart.convertToPixel('grid', [
      itemData.timeArrival,
      itemData.categoryIndex,
    ]);
    const pointDeparture = myChart.convertToPixel('grid', [
      itemData.timeDeparture,
      itemData.categoryIndex,
    ]);
    const barLength = pointDeparture[0] - pointArrival[0];
    const barHeight = Math.abs(
      myChart.convertToPixel('grid', [0, 0])[1]
        - myChart.convertToPixel('grid', [0, 1])[1],
    ) * HEIGHT_RATIO;
    if (!el) {
      // eslint-disable-next-line no-param-reassign
      el = new echarts.graphic.Rect({
        shape: { x: 0, y: 0, width: 0, height: 0 },
        style: style,
        z: z,
      });
      myChart.getZr().add(el);
    }
    el.attr({
      shape: { x: 0, y: 0, width: barLength, height: barHeight },
      position: [pointArrival[0], pointArrival[1] - barHeight],
    });
    return el;
  }, []);

  const prepareDrop = useCallback(() => {
    const myChart = eChartRef.current.getEchartsInstance();
    // Check droppable place.
    const xPixel = draggingEl.shape.x + draggingEl.position[0];
    const yPixel = draggingEl.shape.y + draggingEl.position[1];
    const cursorData = myChart.convertFromPixel('grid', [xPixel, yPixel]);
    if (cursorData) {
      // Make drop shadow and _dropRecord
      const newDropRecord = {
        categoryIndex: Math.floor(cursorData[1]),
        timeArrival: cursorData[0],
        timeDeparture: cursorData[0] + draggingTimeLength,
      };
      const style = { fill: 'rgba(0,0,0,0.4)' };
      const newDropShadow = addOrUpdateBar(dropShadow, newDropRecord, style, 99);
      setDropShadow(newDropShadow);
      setDropRecord(newDropRecord);
    }
  }, [draggingEl, draggingTimeLength, dropShadow, addOrUpdateBar]);

  const updateRawData = useCallback(() => {
    const flightData = data.requestList.data;
    const movingItem = flightData[dropRecord.dataIndex];
    // Check conflict
    for (let i = 0; i < flightData.length; i++) {
      const dataItem = flightData[i];
      if (
        dataItem !== movingItem
        && dropRecord.categoryIndex === dataItem[DIM_CATEGORY_INDEX]
        && dropRecord.timeArrival < dataItem[DIM_TIME_END]
        && dropRecord.timeDeparture > dataItem[DIM_TIME_START]
      ) {
        console.log('Conflict! Find a free space to settle the bar!');
        return false;
      }
    }
    // No conflict.
    movingItem[DIM_CATEGORY_INDEX] = dropRecord.categoryIndex;
    movingItem[DIM_TIME_START] = dropRecord.timeArrival;
    movingItem[DIM_TIME_END] = dropRecord.timeDeparture;
    return true;
  }, [data.requestList.data, dropRecord]);

  const dispatchDataZoom = useCallback((params) => {
    const myChart = eChartRef.current.getEchartsInstance();
    const option = myChart.getOption();
    const optionInsideX = option.dataZoom[DATA_ZOOM_X_INSIDE_INDEX];
    const optionInsideY = option.dataZoom[DATA_ZOOM_Y_INSIDE_INDEX];
    const batch = [];
    prepareBatch(
      batch,
      'insideX',
      optionInsideX.start,
      optionInsideX.end,
      params.cursorDistX,
    );
    prepareBatch(
      batch,
      'insideY',
      optionInsideY.start,
      optionInsideY.end,
      -params.cursorDistY,
    );
    batch.length
    && myChart.dispatchAction({
      type: 'dataZoom',
      batch: batch,
    });
  }, []);

  const autoDataZoomWhenDraggingOutside = useCallback((cursorX, cursorY) => {
    // When cursor is outside the cartesian and being dragging,
    // auto move the dataZooms.
    const cursorDistX = getCursorCartesianDist(cursorX, cartesianXBounds);
    const cursorDistY = getCursorCartesianDist(cursorY, cartesianYBounds);
    if (cursorDistX !== 0 || cursorDistY !== 0) {
      autoDataZoomAnimator.start({
        cursorDistX: cursorDistX,
        cursorDistY: cursorDistY,
      });
    } else {
      autoDataZoomAnimator.stop();
    }
  }, [cartesianXBounds, cartesianYBounds]);

  const onMousedownAction = useCallback((param) => {
    if (!draggable || !param || param.seriesIndex == null) {
      return;
    }
    // Drag start
    const draggingRecord = {
      dataIndex: param.dataIndex,
      categoryIndex: param.value[DIM_CATEGORY_INDEX],
      timeArrival: param.value[DIM_TIME_START],
      timeDeparture: param.value[DIM_TIME_END],
    };
    const style = {
      lineWidth: 2,
      fill: 'rgba(255,0,0,0.1)',
      stroke: 'rgba(255,0,0,0.8)',
      lineDash: [6, 3],
    };
    const newDraggingEl = addOrUpdateBar(draggingEl, draggingRecord, style, 100);
    const newDraggingCursorOffset = [
      newDraggingEl.position[0] - param.event.offsetX,
      newDraggingEl.position[1] - param.event.offsetY,
    ];

    const newDraggingTimeLength = draggingRecord.timeDeparture - draggingRecord.timeArrival;
    setDraggingEl(newDraggingEl);
    setDraggingCursorOffset(newDraggingCursorOffset);
    setDraggingTimeLength(newDraggingTimeLength);
  }, [draggable, draggingEl, addOrUpdateBar]);

  const onMousemoveAction = useCallback((event) => {
    if (!draggingEl) {
      return;
    }
    const cursorX = event.offsetX;
    const cursorY = event.offsetY;
    // Move _draggingEl.
    draggingEl.attr('position', [
      draggingCursorOffset[0] + cursorX,
      draggingCursorOffset[1] + cursorY,
    ]);
    setDraggingEl(draggingEl);
    prepareDrop();
    autoDataZoomWhenDraggingOutside(cursorX, cursorY);
  }, [draggingEl, draggingCursorOffset, prepareDrop, autoDataZoomWhenDraggingOutside]);

  const onDragRelease = useCallback(() => {
    const myChart = eChartRef.current.getEchartsInstance();
    autoDataZoomAnimator.stop();
    if (draggingEl) {
      myChart.getZr().remove(draggingEl);
      setDraggingEl(null);
    }
    if (dropShadow) {
      myChart.getZr().remove(dropShadow);
      setDropShadow(null);
    }
    setDropRecord(null);
  }, [draggingEl, dropShadow]);

  const onMouseupAction = useCallback(() => {
    // Drop
    const myChart = eChartRef.current.getEchartsInstance();
    if (draggingEl && dropRecord) {
      updateRawData() && myChart.setOption({
        series: {
          id: 'flightData',
          data: data.requestList.data,
        },
      });
    }
    onDragRelease();
  }, [draggingEl, dropRecord, updateRawData, data.requestList.data, onDragRelease]);

  const onGlobalOutAction = useCallback(() => {
    const myChart = eChartRef.current.getEchartsInstance();
    autoDataZoomAnimator.stop();
    if (draggingEl) {
      myChart.getZr().remove(draggingEl);
      setDraggingEl(null);
    }
    if (dropShadow) {
      myChart.getZr().remove(dropShadow);
      setDropShadow(null);
    }
    setDropRecord(null);
  }, [draggingEl, dropShadow]);

  const onChartReadyCallback = useCallback(() => {
    autoDataZoomAnimator = makeAnimator(() => dispatchDataZoom);
  }, [dispatchDataZoom]);

  const renderGanttItem = useCallback((params, api) => {
    const categoryIndex = api.value(DIM_CATEGORY_INDEX);
    const timeArrival = api.coord([api.value(DIM_TIME_START), categoryIndex]);
    const timeDeparture = api.coord([api.value(DIM_TIME_END), categoryIndex]);
    const coordSys = params.coordSys;
    const newCartesianXBounds = [coordSys.x, coordSys.x + coordSys.width];
    const newCartesianYBounds = [coordSys.y, coordSys.y + coordSys.height];
    setCartesianXBounds(newCartesianXBounds);
    setCartesianYBounds(newCartesianYBounds);
    
    const barLength = timeDeparture[0] - timeArrival[0];
    // Get the heigth corresponds to length 1 on y axis.
    const barHeight = api.size([0, 1])[1] * HEIGHT_RATIO;
    const x = timeArrival[0];
    const y = timeArrival[1] - barHeight;
    const flightNumber = `${api.value(3)}`;
    const flightNumberWidth = echarts.format.getTextRect(flightNumber).width;
    const text = barLength > flightNumberWidth + 40 && x + barLength >= 180 ? flightNumber : '';
    const rectNormal = clipRectByRect(params, {
      x: x,
      y: y,
      width: barLength,
      height: barHeight,
    });
    const rectVIP = clipRectByRect(params, {
      x: x,
      y: y,
      width: barLength / 2,
      height: barHeight,
    });
    const rectText = clipRectByRect(params, {
      x: x,
      y: y,
      width: barLength,
      height: barHeight,
    });
    return {
      type: 'group',
      children: [
        {
          type: 'rect',
          ignore: !rectNormal,
          shape: rectNormal,
          style: api.style(),
        },
        {
          type: 'rect',
          ignore: !rectVIP && !api.value(4),
          shape: rectVIP,
          style: api.style({ fill: '#ddb30b' }),
        },
        {
          type: 'rect',
          ignore: !rectText,
          shape: rectText,
          style: api.style({
            fill: 'transparent',
            stroke: 'transparent',
            text: text,
            textFill: '#fff',
          }),
        },
      ],
    };
  }, []);

  const getChartOption = useCallback(() => {
    let yAxisStart = 20;
    if (data.requestNames.data.length < 5) {
      yAxisStart = 0;
    }
    const defaultDataZoom = getDefaultDataZoom(yAxisStart);

    dataZoom.forEach(singleData => {
      const index = defaultDataZoom.findIndex(dataVal => dataVal.id === singleData.id);
      defaultDataZoom.splice(index, 1);
      defaultDataZoom.push(singleData);
    });

    const option = {
      tooltip: {},
      animation: false,
      title: {
        text: title,
        left: 'center',
      },
      dataZoom: defaultDataZoom,
      grid: {
        show: true,
        top: 70,
        bottom: 20,
        left: 100,
        right: 20,
        backgroundColor: '#fff',
        borderWidth: 0,
      },
      xAxis: {
        type: 'time',
        position: 'top',
        splitLine: {
          lineStyle: {
            color: ['#E9EDFF'],
          },
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          lineStyle: {
            color: '#929ABA',
          },
        },
        axisLabel: {
          color: '#929ABA',
          inside: false,
          align: 'center',
        },
      },
      yAxis: {
        axisTick: { show: false },
        splitLine: { show: false },
        axisLine: { show: false },
        axisLabel: { show: false },
        min: 0,
        max: data.requestNames.data.length,
      },
      series: [
        {
          id: 'requestData',
          type: 'custom',
          renderItem: renderGanttItem,
          dimensions: data.requestList.dimensions,
          encode: {
            x: [DIM_TIME_START, DIM_TIME_END],
            y: DIM_CATEGORY_INDEX,
            tooltip: [DIM_REQ_NAME, DIM_REQ_STATUS, DIM_TIME_START, DIM_TIME_END],
          },
          data: data.requestList.data,
        },
        {
          type: 'custom',
          renderItem: renderAxisLabelItem,
          dimensions: data.requestNames.dimensions,
          encode: {
            x: -1,
            y: 0,
          },
          data: data.requestNames.data.map((item, index) => [index].concat(item)),
        },
      ],
    };

    return option;
  }, [data, title, dataZoom, renderGanttItem]);

  const onEvents = {
    click: onChartClick,
    mousedown: onMousedownAction,
    mousemove: onMousemoveAction,
    mouseup: onMouseupAction,
    globalout: onGlobalOutAction,
  };

  const chartOption = getChartOption();

  return (
    <ReactEChartsCore
      ref={eChartRef}
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

ChartRequestGanttWithTimeAxis.propTypes = {
  data: ScorchPropTypes.ganttData().isRequired,
  title: PropTypes.string.isRequired,
};

export default ChartRequestGanttWithTimeAxis;