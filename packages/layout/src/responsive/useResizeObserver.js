import { useEffect, useRef } from "react";

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
        const { height, width } = contentRect;
        console.log(
          `ResizeObserver callback, size changed observed width ${width} height: ${height}`
        );
        onResize && onResize(contentRect);
      } else {
        console.log(`no change from recorded values`);
      }
    }
  }
});

export default function useResizeObserver(ref, dimensions, onResize) {
  const dimensionsRef = useRef(dimensions);
  // Keep this effect separate in case user inadvertently passes different
  // dimensions or callback instance each time - we only ever want to
  // initiate new observation when ref changes.
  useEffect(() => {
    async function registerObserver() {
      const target = ref.current;
      await document.fonts.ready;
      const rect = target.getBoundingClientRect();
      const measurements = dimensionsRef.current.reduce(
        (map, dim) => ((map[dim] = rect[dim]), map),
        {}
      );
      observedMap.set(target, { onResize, measurements });
      resizeObserver.observe(target);
    }

    if (ref.current) {
      // TODO might we want multiple callers to attach a listener to the same element ?
      if (observedMap.has(ref.current)) {
        throw Error(
          "useResizeObserver attemping to observe same element twice"
        );
      }
      // TODO set a pending entry on map
      registerObserver();
    }
    return () => {
      if (ref.current && observedMap.has(ref.current)) {
        resizeObserver.unobserve(ref.current);
        observedMap.delete(ref.current);
      }
    };
  }, [dimensionsRef, ref]);

  useEffect(() => {
    const target = ref.current;
    const record = observedMap.get(target);
    if (record) {
      //TODO check for pending entry
      //TODO 'unregister' dimensions thta have disapeared from prop
      console.log(
        "initialize the measurements that we are interested in, if we haven't already registered them"
      );
      for (let dimension of dimensions) {
        if (record.measurements[dimension] === undefined) {
          record.measurements[dimension] = 0;
        }
      }
      // Might not have changed, but no harm ...
      record.onResize = onResize;
    }
  }, [dimensions, ref, onResize]);
}
