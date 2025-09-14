import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Chart } from 'chart.js';
import $ from 'jquery';

/**
 * This component shows a doughnut chart for the given data.
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
function Doughnut({ data, size }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const $elRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      $elRef.current = $(canvasRef.current);
      chartRef.current = new Chart($elRef.current, {
        type: 'doughnut',
        options: {
          cutoutPercentage: 75,
          legend: { display: false },
        },
      });
      updateChart();
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    updateChart();
  }, [data]);

  const updateChart = () => {
    if (!chartRef.current || !data) {
      return;
    }

    const initialData = {
      labels: [],
      values: [],
      colors: [],
    };
    
    const unpackedData = Object.keys(data).reduce((accumulator, currentKey) => {
      accumulator.labels.push(currentKey);
      accumulator.values.push(data[currentKey].value);
      accumulator.colors.push(data[currentKey].color);
      return accumulator;
    }, initialData);

    chartRef.current.data = {
      datasets: [{
        data: unpackedData.values,
        backgroundColor: unpackedData.colors,
      }],
      labels: unpackedData.labels,
    };
    chartRef.current.update();
  };

  // NOTE: For reason that I don't understand, width and height must be set on the canvas element.
  return (
    <div style={{ width: size, height: size }}>
      <canvas 
        ref={canvasRef} 
        style={{ width: '100vw', height: '100vw' }} 
      />
    </div>
  );
}

Doughnut.propTypes = {
  data: PropTypes.objectOf(PropTypes.shape({
    value: PropTypes.number.isRequired,
    color: PropTypes.string.isRequired,
  })).isRequired,
  size: PropTypes.string,
};

Doughnut.defaultProps = {
  size: '100%',
};

export default Doughnut;