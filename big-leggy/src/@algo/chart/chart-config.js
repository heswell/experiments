
import {data} from './chart-data';

// const upColor = '#ec0000';
// const upBorderColor = '#8A0000';
// const downColor = '#00da3c';
// const downBorderColor = '#008F28';


export const option = {
  title: {
      text: 'Sample',
      left: 0
  },
  tooltip: {
      trigger: 'axis',
      axisPointer: {
          type: 'cross'
      }
  },
  legend: {
      data: ['Bid', 'Ask']
  },
  grid: {
      left: '10%',
      right: '3%',
      bottom: '15%'
  },
  xAxis: {
      type: 'category',
      data: data.date,
      scale: true,
      boundaryGap : false,
      axisLine: {onZero: false},
      splitLine: {show: false},
      splitNumber: 20,
      min: 'dataMin',
      max: 'dataMax'
  },
  yAxis: {
      scale: true,
      splitArea: {
          show: true
      }
  },
  dataZoom: [
      {
          type: 'inside',
          start: 0,
          end: 100
      },
      {
          show: true,
          type: 'slider',
          y: '90%',
          start: 0,
          end: 100
      }
  ],
  series: [
      {
          name: 'Bid',
          type: 'line',
          data: data.bid,
          smooth: false,
          lineStyle: {
              normal: {opacity: 0.5}
          }
      },
      {
          name: 'Ask',
          type: 'line',
          data: data.ask,
          smooth: false,
          lineStyle: {
              normal: {opacity: 0.5}
          }
      },
      // {
      //     name: 'MA20',
      //     type: 'line',
      //     data: calculateMA(20),
      //     smooth: true,
      //     lineStyle: {
      //         normal: {opacity: 0.5}
      //     }
      // },
      // {
      //     name: 'MA30',
      //     type: 'line',
      //     data: calculateMA(30),
      //     smooth: true,
      //     lineStyle: {
      //         normal: {opacity: 0.5}
      //     }
      // },

  ]
};


/*
      {
          name: '日K',
          type: 'candlestick',
          data: data.values,
          itemStyle: {
              normal: {
                  color: upColor,
                  color0: downColor,
                  borderColor: upBorderColor,
                  borderColor0: downBorderColor
              }
          },
          // circular icons at given locations
          // markPoint: {
          //     label: {
          //         normal: {
          //             formatter: function (param) {
          //                 return param != null ? Math.round(param.value) : '';
          //             }
          //         }
          //     },
          //     data: [
          //         {
          //             name: 'XX标点',
          //             coord: ['2013/5/31', 2300],
          //             value: 2300,
          //             itemStyle: {
          //                 normal: {color: 'rgb(41,60,85)'}
          //             }
          //         },
          //         {
          //             name: 'highest value',
          //             type: 'max',
          //             valueDim: 'highest'
          //         },
          //         {
          //             name: 'lowest value',
          //             type: 'min',
          //             valueDim: 'lowest'
          //         },
          //         {
          //             name: 'average value on close',
          //             type: 'average',
          //             valueDim: 'close'
          //         }
          //     ],
          //     tooltip: {
          //         formatter: function (param) {
          //             return param.name + '<br>' + (param.data.coord || '');
          //         }
          //     }
          // },
          // dashed straight red lines
          // markLine: {
          //     symbol: ['none', 'none'],
          //     data: [
          //         [
          //             {
          //                 name: 'from lowest to highest',
          //                 type: 'min',
          //                 valueDim: 'lowest',
          //                 symbol: 'circle',
          //                 symbolSize: 10,
          //                 label: {
          //                     normal: {show: false},
          //                     emphasis: {show: false}
          //                 }
          //             },
          //             {
          //                 type: 'max',
          //                 valueDim: 'highest',
          //                 symbol: 'circle',
          //                 symbolSize: 10,
          //                 label: {
          //                     normal: {show: false},
          //                     emphasis: {show: false}
          //                 }
          //             }
          //         ],
          //         {
          //             name: 'min line on close',
          //             type: 'min',
          //             valueDim: 'close'
          //         },
          //         {
          //             name: 'max line on close',
          //             type: 'max',
          //             valueDim: 'close'
          //         }
          //     ]
          // }
      },

*/