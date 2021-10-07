const dscc = require('@google/dscc');
const Chart = require('chart.js');
require('chartjs-plugin-piechart-outlabels');
const d3Interpolate = require('d3-interpolate');
const local = require('./localMessage');

const margin = {
  top: 10,
  bottom: 10,
  right: 10,
  left: 10,
};

const height = dscc.getHeight() - margin.top - margin.bottom;
const width = dscc.getWidth() - margin.left - margin.right;

const canvasElement = document.createElement('canvas');
const ctx = canvasElement.getContext('2d');
canvasElement.id = 'chart';
canvasElement.height = height;
canvasElement.width = width;
document.body.appendChild(canvasElement);

const lowestHex = '#ffc3c5';
const lowestRGB = 'rgb(255, 195, 197)';
const highestHex = '#ff0008';
const interpolator = d3Interpolate.interpolateRgb(lowestHex, highestHex);

const itp = (values) => {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const normalized = values.map((val) => (val - min) / (max - min));
  return normalized.map((val) => interpolator(val));
};

const drawViz = (data) => {
  const ctx = canvasElement.getContext('2d');
  ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  const datasets = data.fields.metricID.map((metric, i) => {
    const actualData = data.tables.DEFAULT.map(({ metricID }) => metricID[i]);
    backgroundColor = actualData.every((i) => i == '0')
      ? data.tables.DEFAULT.map((_) => lowestRGB)
      : itp(actualData);
    return {
      label: metric.name,
      data: data.tables.DEFAULT.map(() => 1),
      actualData,
      backgroundColor,
      borderWidth: 5,
      outlabels: {
        display: i === 0,
        text: '%l',
        color: 'black',
        backgroundColor: 'white',
        stretch: 45,
        font: {
          resizable: true,
          minSize: 12,
          maxSize: 18,
        },
      },
    };
  });
  console.log(datasets);

  const _ = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.tables.DEFAULT.map(({ dimID }) => dimID[0]),
      datasets,
    },
    options: {
      cutoutPercentage: 40,
      layout: {
        padding: {
          left: 0,
          right: 0,
          top: 50,
          bottom: 50,
        },
      },
      legend: {
        display: false,
      },
      tooltips: {
        mode: 'nearest',
        intersect: true,
        callbacks: {
          label(tooltipItem, data) {
            const { label } = data.datasets[tooltipItem.datasetIndex];
            const value =
              data.datasets[tooltipItem.datasetIndex].actualData[
                tooltipItem.index
              ];
            return `${label}: ${value}`;
          },
        },
      },
    },
  });
};
const LOCAL = false;

if (LOCAL) {
  drawViz(local.message);
} else {
  dscc.subscribeToData(drawViz, { transform: dscc.objectTransform });
}
