import Dygraph from 'dygraphs';
import barChartPlotter from '../../dygraphs/barchartPlotter';

export function createGraph(el, values, val1, val2, onSelectRange){

  if (!values || values.length === 0){
      return;
  }
  console.log(values)
  let [_minX = 0, _maxX = 0] = getRange(values, val1, val2);
  console.log(`cdm (${_minX}) (${_maxX})`);
  const _maxRange = values.length + 1;
  const _values = values.map(([x, y]) => [x, y]);

  const graph = window.graph =  new Dygraph(
      el,
      _values,
      {
          width: 240,
          height: 60,
          axes: {
              x: { drawAxis: false, drawGrid: false },
              y: { drawAxis: false, drawGrid: false }
          },
          xRangePad: 3,
          animatedZooms: false,
          zoomCallback: (min, max/*, yRanges*/) => {
              console.log(`zoomCallback (${min}) (${max})`);
              _minX = min;
              _maxX = max;
              graph.updateOptions({
                  dateWindow: [0, _maxRange],
                  valueRange: null
              });

              const loIdx = Math.ceil(min);
              const hiIdx = Math.floor(max);
              const lo = values[loIdx - 1][2];
              const hi = values[Math.min(hiIdx,values.length)-1][3];
            
              onSelectRange(lo, hi)
          },
          underlayCallback: function (canvas, area, g) {
              console.log(`underlayCallback (${_minX}) (${_maxX})`);
              const bottom_left = g.toDomCoords(_minX, -20);
              const top_right = g.toDomCoords(_maxX, +20);
              const left = bottom_left[0];
              const right = top_right[0];

              canvas.fillStyle = 'rgba(255, 255, 102, 1.0)';
              canvas.fillRect(left, area.y, right - left, area.h);
          },

          dateWindow: [0, _maxRange],
          includeZero: true,
          showLabelsOnHighlight: false,
          plotter: barChartPlotter
      }
  );

  return graph;

}


    // note this range, if not [0,0] will cause selection to be highlighted in graph

function getRange(values, val1, val2){
  console.log(`getRange from state ${val1} ${val2}`,values)        

  if (val1 && val2){
      const idx1 = indexOf(val1,values);
      const idx2 = indexOf(val2,values); 
      if (idx1 === -1 || idx2 === -1){
          return [0,0]
      } else {
          return [idx1, idx2]
      }
  } else {
      return [0,0];
  }
}

function indexOf(val, values){
  for (let i=0;i<values.length;i++){
      if (val >= values[i][2] && val <= values[i][3]){
          return i+1;
      }
  }
  return -1;
}
