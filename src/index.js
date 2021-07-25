const dscc = require('@google/dscc');
const Chart = require('chart.js');
require('chartjs-plugin-piechart-outlabels');
const d3 = require('d3-scale-chromatic');
const local = require('./localMessage');
// const interpolateColors = require('./utils');

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
  const colorScale = d3.interpolateBlues;
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

const drawViz = (data) => {
  const ctx = canvasElement.getContext('2d');
  ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  const colorRangeInfo = {
    colorStart: 0,
    colorEnd: 1,
    useEndAsStart: false,
  };

  const datasets = [];
  for (let i = 0; i < data.fields.metricID.length; i++) {
    datasets.push(
      data.tables.DEFAULT.reduce(
        (acc, cur) => {
          acc.labels.push(cur.dimID[0]);
          acc.datasets[0].data.push(1);
          acc.datasets[0].actualData.push(cur.metricID[i]);
          acc.datasets[0].backgroundColor = interpolateColors(
            acc.datasets[0].data.length,
            colorRangeInfo,
          );
          return acc;
        },
        {
          labels: [],
          datasets: [
            {
              label: data.fields.metricID[i].name,
              data: [],
              actualData: [],
              backgroundColor: [],
            },
          ],
        },
      ),
    );
  }

  const impressionsDataset = datasets.filter(
    (dataset) => dataset.datasets[0].label === 'impressions',
  )[0];

  console.log(impressionsDataset.datasets[0]);

  const impressionsChart = {
    label: 'Impressions',
    type: 'doughnut',
    data: impressionsDataset.datasets[0].data,
    backgroundColor: impressionsDataset.datasets[0].backgroundColor,
    options: {
      tooltips: {
        mode: 'nearest',
        intersect: false,
        callbacks: {
          label(tooltipItem, data) {
            const label = data.labels[tooltipItem.index];
            const value =
              data.datasets[tooltipItem.datasetIndex].actualData[
                tooltipItem.index
              ];
            return `${label}: ${value}`;
          },
        },
      },
      plugins: {
        outlabels: {
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
      },
    },
  };

  const doughnutChart = new Chart(ctx, {
    type: 'doughnut',
    labels: impressionsDataset.datasets[0].labels,
    data: {
      datasets: [impressionsChart, impressionsChart],
    },
    options: {
      legend: {
        display: false,
      },
      plugins: {
        outlabels: {
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
