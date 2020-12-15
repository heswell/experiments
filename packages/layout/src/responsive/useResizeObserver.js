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
  // Keep this effect separate in case user inadvertently passes different
  // dimensions or callback instance each time - we only ever want to
  // initiate new observation when ref changes.
  useEffect(() => {
    const target = ref.current;
    if (target) {
      if (observedMap.has(target)) {
        throw Error(
          "useResizeObserver attemping to observe same element twice"
        );
      }
      observedMap.set(target, { onResize: null, measurements: {} });
      resizeObserver.observe(target);
    }
    return () => {
      if (target) {
        resizeObserver.unobserve(target);
        observedMap.delete(target);
      }
    };
  }, [ref]);

  useEffect(() => {
    const target = ref.current;
    const record = observedMap.get(target);
    if (record) {
      for (let dimension of dimensions) {
        if (record.measurements[dimension] === undefined) {
          record.measurements[dimension] = 0;
        }
      }
      record.onResize = onResize;
    } else {
      throw Error(`ref is not being observed`);
    }
  }, [dimensions, ref, onResize]);
}
