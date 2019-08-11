 import Dygraph from 'dygraphs';

export function darkenColor(colorStr) {
    // Defined in dygraph-utils.js
    const color = Dygraph.toRGB_(colorStr);
    color.r = Math.floor((255 + color.r) / 2);
    color.g = Math.floor((255 + color.g) / 2);
    color.b = Math.floor((255 + color.b) / 2);
    return 'rgb(' + color.r + ',' + color.g + ',' + color.b + ')';
}

export default function barChartPlotter(e) {
        const ctx = e.drawingContext;
        const points = e.points;
        const y_bottom = e.dygraph.toDomYCoord(0);

        // ctx.fillStyle = darkenColor(e.color);
        ctx.fillStyle = 'rgb(0,0,0)';
        ctx.strokeStyle = 'rgb(0,0,0)';

        // Find the minimum separation between x-values.
        // This determines the bar width.
        let min_sep = Infinity;
        for (let i = 1; i < points.length; i++) {
            const sep = points[i].canvasx - points[i - 1].canvasx;
            if (sep < min_sep){ 
              min_sep = sep;
            }
        }
        const bar_width = Math.floor(2.0 / 3 * min_sep);
        const height = 60;
        // Do the actual plotting.
        for (let i = 0; i < points.length; i++) {
          const p = points[i];
          const center_x = p.canvasx;
          const canvasY = p.yval === 0 ? p.canvasy : Math.min(p.canvasy, height-1);
          ctx.fillRect(center_x - bar_width / 2, canvasY,
              bar_width, y_bottom - canvasY);

        //   ctx.strokeRect(center_x - bar_width / 2, p.canvasy,
        //       bar_width, y_bottom - p.canvasy);
        }
      }
