import { useEffect } from "react";

const observedMap = new Map();

const resizeObserver = new ResizeObserver((entries) => {
  for (let entry of entries) {
    const { target, contentRect } = entry;
    if (observedMap.has(target)) {
      const { onResize, measurements } = observedMap.get(target);
      let sizeChanged = false;
      for (let [dimension, size] of Object.entries(measurements)) {
        if (contentRect[dimension] !== size) {
          sizeChanged = true;
          measurements[dimension] = contentRect[dimension];
        }
      }
      if (sizeChanged) {
        // TODO only return measured sizes
        onResize(contentRect);
      }
    }
  }
});

export default function useResizeObserver(ref, dimensions, onResize) {
  useEffect(() => {
    const target = ref.current;
    if (observedMap.has(target)) {
      throw Error("useResizeObserver attemping to observe same element twice");
    }
    if (dimensions.length) {
      const measurements = dimensions.reduce((map, dimension) => {
        map[dimension] = 0;
        return map;
      }, {});
      observedMap.set(target, { onResize, measurements });
      resizeObserver.observe(target);
      return () => {
        resizeObserver.unobserve(target);
        observedMap.delete(target);
      };
    }
  }, [dimensions, ref, onResize]);
}
