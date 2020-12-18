import { useCallback, useEffect, useRef } from "react";
import useResizeObserver from "../responsive/useResizeObserver";

const HEIGHT = ["height"];
const HEIGHT_WIDTH = ["height", "width"];

const addAll = (sum, m) => sum + m.width;

export default function useOverflowObserver(ref, onOverflow) {
  const visibleRef = useRef(null);
  const overflowedRef = useRef([]);
  const width = useRef(null);

  const resizeHandler = useCallback(
    ({ width: containerWidth, height: containerHeight }) => {
      let renderedWidth = visibleRef.current.reduce(addAll, 0);

      if (containerWidth < width.current) {
        console.log(
          `%c[useOverflowObserver] size changed ${containerHeight} ${containerWidth},
          renderedWidth ${renderedWidth}`,
          "color:green;font-weight:bold;"
        );

        // Note: we only need to register listener for width once we have overflow

        while (renderedWidth > containerWidth) {
          const overflow = visibleRef.current.pop();
          overflowedRef.current.push(overflow);
          const { index, width } = overflow;
          renderedWidth -= width;
          const target = ref.current.querySelector(`[data-index='${index}']`);
          target.dataset.hidden = true;
        }
      } else if (overflowedRef.current.length) {
        const diff = containerWidth - renderedWidth;
        const { width: nextWidth } = overflowedRef.current[
          overflowedRef.current.length - 1
        ];

        if (diff >= nextWidth) {
          const overflow = overflowedRef.current.pop();
          visibleRef.current.push(overflow);
          const { index, width } = overflow;
          renderedWidth += width;
          const target = ref.current.querySelector(`[data-index='${index}']`);
          delete target.dataset.hidden;
        }

        console.log(
          `content height ${containerHeight} width ${containerWidth}`
        );
      }
      width.current = containerWidth;
    },
    [visibleRef, onOverflow, ref]
  );

  useEffect(() => {
    async function measure() {
      await document.fonts.ready;
      const start = performance.now();
      const [measurements, containerHeight, containerWidth] = measureChildren(
        ref
      );
      width.current = containerWidth;
      const end = performance.now();
      console.log(`measurements took ${end - start}ms`);
      visibleRef.current = measurements;
      if (containerHeight > 32) {
        console.log("NEED TO ADJUST OVERFLOW RIGHT FROM THE GET-GO");
      }
    }
    measure();
  }, [ref]);

  useResizeObserver(ref, HEIGHT_WIDTH, resizeHandler);
}

// const overflowedIndices = [];
// for (let i = 0; i < overflowPoints.length; i++) {
//   const overflowPoint = overflowPoints[i];
//   if (width < overflowPoint) {
//     overflowedIndices.push(overflowIndices[i]);
//   } else {
//     break;
//   }
// }

let thresholds = undefined;
// if (trackOverflowItems) {
//   thresholds = measureChildren(ref);
// }

const byDescendingPriority = (m1, m2) => {
  const sort1 = m1.priority - m2.priority;
  let result;
  if (result === 0) {
    sort = m1.index - m2.index;
  }
  return sort1;
};

const measureChildren = (ref) => {
  const nodes = Array.from(ref.current.childNodes);
  const { left, width, height } = ref.current.getBoundingClientRect();
  console.log(`container left ${left} width ${width}`);
  const measurements = nodes.reduce((list, node, i) => {
    const { index, priority = "1" } = node?.dataset ?? NO_DATA;
    if (index) {
      const width = measureWidth(node);
      console.log(`${node.dataset.index} = ${width}`);
      list.push({
        index: parseInt(index, 10),
        priority: parseInt(priority, 10),
        width,
      });
    }
    return list;
  }, []);

  return [measurements.sort(byDescendingPriority), height, width];
};

function measureWidth(node) {
  const { width } = node.getBoundingClientRect();
  const style = getComputedStyle(node);
  const marginLeft = parseInt(style.getPropertyValue("margin-left"), 10);
  const marginRight = parseInt(style.getPropertyValue("margin-right"), 10);
  return marginLeft + width + marginRight;
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
