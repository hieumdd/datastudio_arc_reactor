const dscc = require('@google/dscc');
const Chart = require('chart.js');
require('chartjs-plugin-piechart-outlabels');
const d3 = require('d3-scale-chromatic');
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
const ctx = canvasElement.getContext('2d'); // eslint-disable-line
canvasElement.id = 'myViz';
canvasElement.height = height;
canvasElement.width = width;
document.body.appendChild(canvasElement);

const calculatePoint = (i, intervalSize, colorRangeInfo) => {
  const { colorStart, colorEnd, useEndAsStart } = colorRangeInfo;
  return useEndAsStart
    ? colorEnd - i * intervalSize
    : colorStart + i * intervalSize;
};

const interpolateColors = (dataLength, colorRangeInfo) => {
  const colorScale = d3.interpolateGreys;
  const { colorStart, colorEnd } = colorRangeInfo;
  const colorRange = colorEnd - colorStart;
  const intervalSize = colorRange / dataLength;
  let i;
  let colorPoint;
  const colorArray = [];

  for (i = 0; i < dataLength; i++) {
    colorPoint = calculatePoint(i, intervalSize, colorRangeInfo);
    colorArray.push(colorScale(colorPoint));
  }

  return colorArray;
};

const colorRangeInfo = {
  colorStart: 0.3,
  colorEnd: 1,
  useEndAsStart: false,
};

const drawViz = (data) => {
  const ctx = canvasElement.getContext('2d');
  ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  const datasets = [];

  for (let i = 0; i < data.fields.metricID.length; i++) {
    datasets.push({
      label: data.fields.metricID[i].name,
      data: data.tables.DEFAULT.map(() => 1),
      actualData: data.tables.DEFAULT.map((_data) => _data.metricID[i]),
      backgroundColor: interpolateColors(
        data.tables.DEFAULT.map((_data) => _data.metricID[i]).length,
        colorRangeInfo,
      ),
      outlabels: {
        display: i === 0,
        text: '%l',
        color: 'white',
        backgroundColor: 'black',
        stretch: 45,
        font: {
          resizable: true,
          minSize: 12,
          maxSize: 18,
        },
      },
    });
  }
  console.log(datasets);

  const doughnutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.tables.DEFAULT.map((_dim) => _dim.dimID[0]),
      datasets,
    },
    options: {
      legend: {
        display: false,
      },
      tooltips: {
        mode: 'nearest',
        intersect: false,
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
      plugins: {
        // outlabels: {
        //   display: false,
        //   text: '%l',
        //   color: 'black',
        //   backgroundColor: 'white',
        //   stretch: 45,
        //   font: {
        //     resizable: true,
        //     minSize: 12,
        //     maxSize: 18,
        //   },
        // },
      },
    },
  });
};

if (DSCC_IS_LOCAL) {
  // eslint-disable-line
  drawViz(local.message);
} else {
  dscc.subscribeToData(drawViz, { transform: dscc.objectTransform });
}
