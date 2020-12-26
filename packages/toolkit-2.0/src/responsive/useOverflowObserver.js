import { useCallback, useLayoutEffect, useRef, useState } from "react";
import useResizeObserver from "../responsive/useResizeObserver";
import { measureNode } from "../utils";

const HEIGHT_WIDTH = ["height", "width"];

const addAll = (sum, m) => sum + m.width;
const addAllExceptOverflowIndicator = (sum, m) =>
  sum + (m.isOverflowIndicator ? 0 : m.width);

const lastItem = (arr) => arr[arr.length - 1];

const moveOverflowItem = (fromStack, toStack) => {
  const item = lastItem(fromStack.current);
  fromStack.current = fromStack.current.slice(0, -1);
  toStack.current = toStack.current.concat(item);
  return item;
};

const byDescendingPriority = (m1, m2) => {
  const sort1 = m1.priority - m2.priority;
  let result;
  if (result === 0) {
    sort = m1.index - m2.index;
  }
  return sort1;
};

const measureChildNodes = (parentRef) => {
  const nodes = Array.from(parentRef.current.childNodes);
  const { width, height } = parentRef.current.getBoundingClientRect();
  const measurements = nodes.reduce((list, node, i) => {
    const { index, priority = "1", overflowIndicator } =
      node?.dataset ?? NO_DATA;
    if (index) {
      const width = measureNode(node);
      if (node.dataset?.overflowed) {
        delete node.dataset.overflowed;
      }
      list.push({
        index: parseInt(index, 10),
        isOverflowIndicator: overflowIndicator,
        priority: parseInt(priority, 10),
        label: node.innerText,
        width,
      });
    }
    return list;
  }, []);

  return [measurements.sort(byDescendingPriority), height, width];
};

// value could be anything which might require a re-evaluation. In the case of tabs
// we might have selected an overflowed tab. Can we make this more efficient, only
// needs action if an overflowed item re-enters the visible section
export default function useOverflowObserver(
  ref,
  rootHeight,
  selectedIndex,
  orientation = "horizontal"
) {
  const [overflowing, setOverflowing] = useState(false);
  const [, forceUpdate] = useState();
  const visibleRef = useRef([]);
  const overflowedRef = useRef([]);
  const width = useRef(null);
  const count = ref.current?.childNodes.length ?? 0;

  const markOverflowingItems = useCallback(
    (visibleContentWidth, containerWidth) => {
      while (visibleContentWidth > containerWidth) {
        const { index, width } = moveOverflowItem(visibleRef, overflowedRef);
        visibleContentWidth -= width;
        const target = ref.current.querySelector(`[data-index='${index}']`);
        target.dataset.overflowed = true;
      }
      if (!overflowing && overflowedRef.current.length > 0) {
        setOverflowing(true);
      }
    },
    [overflowing, setOverflowing]
  );

  const removeOverflowIfSpaceAllows = useCallback(
    (containerWidth) => {
      let visibleContentWidth = visibleRef.current.reduce(
        addAllExceptOverflowIndicator,
        0
      );
      const diff = containerWidth - visibleContentWidth;
      const overflow = overflowedRef.current;
      const { width: nextWidth } = overflow[overflow.length - 1];

      if (diff >= nextWidth) {
        const { width: overflowWidth } = visibleRef.current.find(
          (item) => item.isOverflowIndicator
        );
        // we can only ignore the width of overflow Indicator if either there is only one remaining
        // overflow item (so overflowIndicator will be removed) or diff is big enough to accommodate
        // the overflow Ind.
        if (overflow.length === 1 || diff > nextWidth + overflowWidth) {
          const { index, width: restoredWidth } = moveOverflowItem(
            overflowedRef,
            visibleRef
          );
          visibleContentWidth += restoredWidth;
          const target = ref.current.querySelector(`[data-index='${index}']`);
          delete target.dataset.overflowed;
        }
      }
      if (overflowing && overflowedRef.current.length === 0) {
        setOverflowing(false);
      }
    },
    [overflowing, setOverflowing]
  );

  const resizeHandler = useCallback(
    ({ width: containerWidth }) => {
      //TODO don't need to calculate this every time
      let renderedWidth = visibleRef.current.reduce(addAll, 0);
      if (containerWidth < renderedWidth) {
        markOverflowingItems(renderedWidth, containerWidth);
        // Note: we only need to register listener for width once we have overflow, which
        // can be driven by height change
      } else if (
        overflowedRef.current.length &&
        containerWidth > width.current
      ) {
        removeOverflowIfSpaceAllows(containerWidth);
      }
      width.current = containerWidth;
    },
    [removeOverflowIfSpaceAllows, markOverflowingItems, ref, visibleRef]
  );

  const resetMeasurements = useCallback(() => {
    const [measurements, containerHeight, containerWidth] = measureChildNodes(
      ref
    );
    width.current = containerWidth;
    visibleRef.current = measurements;
    overflowedRef.current = [];
    if (containerHeight > rootHeight) {
      let renderedWidth = visibleRef.current.reduce(addAll, 0);
      markOverflowingItems(renderedWidth, containerWidth);
    }
  }, [ref, markOverflowingItems]);

  // Measurement occurs post-render, by necessity, need to trigger a render
  useLayoutEffect(() => {
    async function measure() {
      await document.fonts.ready;
      resetMeasurements();
    }
    if (orientation === "horizontal") {
      measure();
    }
  }, [ref, count, resetMeasurements]);

  useLayoutEffect(() => {
    // if user selects an item from the overflow list,we need to reset
    if (overflowedRef.current.find((item) => item.index === selectedIndex)) {
      resetMeasurements();
      forceUpdate({});
    }
  }, [selectedIndex, resetMeasurements]);

  useResizeObserver(ref, HEIGHT_WIDTH, resizeHandler);

  return overflowedRef.current;
}
