import { useEffect } from "react";

const observedMap = new Map();
const NO_DATA = {};

const resizeObserver = new ResizeObserver((entries) => {
  for (let entry of entries) {
    const { target, contentRect } = entry;
    if (observedMap.has(target)) {
      const {
        onResize,
        measurements,
        // thresholds: { overflowPoints, overflowIndices },
      } = observedMap.get(target);
      let sizeChanged = false;
      for (let [dimension, size] of Object.entries(measurements)) {
        if (contentRect[dimension] !== size) {
          sizeChanged = true;
          measurements[dimension] = contentRect[dimension];
        }
      }
      if (sizeChanged) {
        // TODO only return measured sizes
        console.log(`notufy client which threshold has been breached`);
        const { height, width } = contentRect;
        console.log(`size changed observed width ${width} height: ${height}`);
        // const overflowedIndices = [];
        // for (let i = 0; i < overflowPoints.length; i++) {
        //   const overflowPoint = overflowPoints[i];
        //   if (width < overflowPoint) {
        //     overflowedIndices.push(overflowIndices[i]);
        //   } else {
        //     break;
        //   }
        // }

        onResize(contentRect);
      }
    }
  }
});

export default function useResizeObserver(
  ref,
  dimensions,
  onResize,
  trackOverflowItems = false
) {
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
      let thresholds = undefined;
      // if (trackOverflowItems) {
      //   thresholds = measureChildren(ref);
      // }
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
      console.log("initialize the measurements that we are interested in");
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

/*
const measureChildren = (ref) => {
  const nodes = Array.from(ref.current.childNodes);
  const { left, width } = ref.current.getBoundingClientRect();
  console.log(`container left ${left} width ${width}`);
  const measurements = nodes.reduce((list, node, i) => {
    const { index, priority = "1" } = node?.dataset ?? NO_DATA;
    if (index) {
      const { width, left, right } = node.getBoundingClientRect();
      console.log(
        `${node.dataset.index} = ${width}, left ${left} right: ${right}`
      );
      list.push({
        index: parseInt(index, 10),
        priority: parseInt(priority, 10),
        width,
      });
    }
    return list;
  }, []);

  const { overflowPoints, overflowIndices } = computeOverflowPoints(
    measurements
  );
  console.log({ overflowPoints });

  return { measurements, overflowPoints, overflowIndices };
};

const byDescendingPriority = (m1, m2) => {
  const sort1 = m1.priority - m2.priority;
  let result;
  if (result === 0) {
    sort = m1.index - m2.index;
  }
  return sort1;
};

const addAll = (sum, m) => sum + m.width;

const computeOverflowPoints = (measurements) => {
  measurements.sort(byDescendingPriority);
  console.log({ measurements });
  const all = measurements.slice();
  let measure = all.pop();
  let overflowPoint = all.reduce(addAll, 0) + measure.width;
  const overflowPoints = [overflowPoint];
  const overflowIndices = [];

  while (all.length > 0) {
    overflowIndices.push(measure.index);
    overflowPoint -= measure.width;
    overflowPoints.push(overflowPoint);
    measure = all.pop();
  }
  overflowIndices.push(measure.index);
  return { overflowPoints, overflowIndices };
};
*/
