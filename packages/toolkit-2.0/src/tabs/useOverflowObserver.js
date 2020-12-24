import { useCallback, useLayoutEffect, useRef, useState } from "react";
import useResizeObserver from "../responsive/useResizeObserver";

const HEIGHT = ["height"];
const HEIGHT_WIDTH = ["height", "width"];

const addAll = (sum, m) => sum + m.width;

const moveOverflowItem = (fromStack, toStack) => {
  const item = fromStack.current.pop();
  toStack.current.push(item);
  return item;
};

export default function useOverflowObserver(ref) {
  const [overflowing, setOverflowing] = useState(false);
  const visibleRef = useRef(null);
  const overflowedRef = useRef([]);
  const width = useRef(null);

  const manageReducedWidth = useCallback(
    (visibleContentWidth, containerWidth) => {
      const overflow = overflowedRef.current;
      while (visibleContentWidth > containerWidth) {
        const { index, width } = moveOverflowItem(visibleRef, overflowedRef);
        visibleContentWidth -= width;
        const target = ref.current.querySelector(`[data-index='${index}']`);
        target.dataset.overflowed = true;
      }

      if (!overflowing && overflow.length > 0) {
        setOverflowing(true);
      }
    },
    [overflowing, setOverflowing]
  );

  const manageIncreasedWidth = useCallback(
    (visibleContentWidth, containerWidth) => {
      const diff = containerWidth - visibleContentWidth;
      const overflow = overflowedRef.current;
      const { width: nextWidth } = overflow[overflow.length - 1];

      if (diff >= nextWidth) {
        const { index, width } = moveOverflowItem(overflowedRef, visibleRef);
        visibleContentWidth += width;
        const target = ref.current.querySelector(`[data-index='${index}']`);
        delete target.dataset.overflowed;
      }

      if (overflowing && overflow.length === 0) {
        setOverflowing(false);
      }
    },
    [overflowing, setOverflowing]
  );

  const resizeHandler = useCallback(
    ({ width: containerWidth }) => {
      let renderedWidth = visibleRef.current.reduce(addAll, 0);
      if (containerWidth < width.current) {
        manageReducedWidth(renderedWidth, containerWidth);
        // Note: we only need to register listener for width once we have overflow, which
        // can be driven by height change
      } else if (overflowedRef.current.length) {
        manageIncreasedWidth(renderedWidth, containerWidth);
      }
      width.current = containerWidth;
    },
    [overflowing, manageIncreasedWidth, manageReducedWidth, ref, visibleRef]
  );

  useLayoutEffect(() => {
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
        let renderedWidth = visibleRef.current.reduce(addAll, 0);
        manageReducedWidth(renderedWidth, containerWidth);
      }
    }
    measure();
  }, [ref]);

  useResizeObserver(ref, HEIGHT_WIDTH, resizeHandler);

  return overflowing;
}

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
