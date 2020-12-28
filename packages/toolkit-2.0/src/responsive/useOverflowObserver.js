import { useCallback, useLayoutEffect, useRef, useState } from "react";
import useResizeObserver from "./useResizeObserver";
import measureNode from "./measureMinimumNodeSize";

const HEIGHT_WIDTH = ["height", "width"];
const NO_OVERFLOW_INDICATOR = {};

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

const getOverflowIndicator = (visibleRef) =>
  visibleRef.current.find((item) => item.isOverflowIndicator);

const measureChildNodes = ({ current: innerEl }) => {
  const nodes = Array.from(innerEl.childNodes);
  const parentRect = innerEl.parentNode.getBoundingClientRect();
  const { width, height } = innerEl.getBoundingClientRect();
  const measurements = nodes.reduce((list, node, i) => {
    const { index, priority = "1", overflowIndicator } =
      node?.dataset ?? NO_DATA;
    if (index) {
      const width = measureNode(node);
      console.log(`remove overflowed flag from ${index}`);
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

  return [
    measurements.sort(byDescendingPriority),
    height,
    width,
    parentRect.height,
    parentRect.width,
  ];
};

// value could be anything which might require a re-evaluation. In the case of tabs
// we might have selected an overflowed tab. Can we make this more efficient, only
// needs action if an overflowed item re-enters the visible section
export default function useOverflowObserver(
  orientation = "horizontal",
  label = ""
) {
  const rootHeight = useRef(null);
  const ref = useRef(null);
  const [overflowing, _setOverflowing] = useState(false);
  const overflowingRef = useRef(false);
  const setOverflowing = useCallback(
    (value) => {
      _setOverflowing((overflowingRef.current = value));
    },
    [_setOverflowing]
  );
  const [, forceUpdate] = useState();
  const visibleRef = useRef([]);
  const overflowedRef = useRef([]);
  const width = useRef(null);

  const markOverflowingItems = useCallback(
    (visibleContentWidth, containerWidth) => {
      while (visibleContentWidth > containerWidth) {
        const { index, width } = moveOverflowItem(visibleRef, overflowedRef);
        visibleContentWidth -= width;
        const target = ref.current.querySelector(`[data-index='${index}']`);
        target.dataset.overflowed = true;
      }
      if (!overflowingRef.current && overflowedRef.current.length > 0) {
        setOverflowing(true);
      }
    },
    [overflowingRef, setOverflowing]
  );

  const removeOverflowIfSpaceAllows = useCallback(
    (containerWidth) => {
      let visibleContentWidth = visibleRef.current.reduce(
        addAllExceptOverflowIndicator,
        0
      );
      let diff = containerWidth - visibleContentWidth;

      while (overflowedRef.current.length > 0) {
        const { width: nextWidth } = overflowedRef.current[
          overflowedRef.current.length - 1
        ];

        if (diff >= nextWidth) {
          const { width: overflowWidth = 0 } =
            getOverflowIndicator(visibleRef) || NO_OVERFLOW_INDICATOR;
          // we can only ignore the width of overflow Indicator if either there is only one remaining
          // overflow item (so overflowIndicator will be removed) or diff is big enough to accommodate
          // the overflow Ind.
          if (
            overflowedRef.current.length === 1 ||
            diff > nextWidth + overflowWidth
          ) {
            const { index, width: restoredWidth } = moveOverflowItem(
              overflowedRef,
              visibleRef
            );
            visibleContentWidth += restoredWidth;
            const target = ref.current.querySelector(`[data-index='${index}']`);
            delete target.dataset.overflowed;
            diff = diff - restoredWidth;
          } else {
            break;
          }
        } else {
          break;
        }
      }
      if (overflowingRef.current && overflowedRef.current.length === 0) {
        setOverflowing(false);
      }
    },
    [overflowingRef, setOverflowing]
  );

  const resizeHandler = useCallback(
    ({ width: containerWidth }) => {
      //TODO don't need to calculate this every time
      let renderedWidth = visibleRef.current.reduce(addAll, 0);
      console.log(
        `resizeHandler<${label}>. containerWidth=${containerWidth} renderedWidth=${renderedWidth}`
      );
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

  const resetMeasurements = useCallback(
    (withForce = true) => {
      const [
        measurements,
        containerHeight,
        containerWidth,
        parentHeight,
      ] = measureChildNodes(ref);
      rootHeight.current = parentHeight;
      width.current = containerWidth;
      visibleRef.current = measurements;
      overflowedRef.current = [];
      if (containerHeight > rootHeight.current) {
        let renderedWidth = visibleRef.current.reduce(addAll, 0);
        markOverflowingItems(renderedWidth, containerWidth);
      }

      if (withForce) {
        forceUpdate({});
      }
    },
    [ref, markOverflowingItems]
  );

  useLayoutEffect(() => {
    if (overflowing) {
      const target = ref.current.querySelector(
        `[data-overflow-indicator='true']`
      );
      if (target) {
        const { index, priority = "1" } = target?.dataset ?? NO_DATA;
        const item = {
          index: parseInt(index, 10),
          isOverflowIndicator: true,
          priority: parseInt(priority, 10),
          label: target.innerText,
          width: measureNode(target),
        };
        visibleRef.current = visibleRef.current
          .concat(item)
          .sort(byDescendingPriority);
      }
    } else if (getOverflowIndicator(visibleRef)) {
      visibleRef.current = visibleRef.current.filter(
        (item) => !item.isOverflowIndicator
      );
    }
  }, [overflowing, ref, visibleRef]);

  // Measurement occurs post-render, by necessity, need to trigger a render
  useLayoutEffect(() => {
    async function measure() {
      await document.fonts.ready;
      resetMeasurements(false);
    }
    if (orientation === "horizontal") {
      measure();
    }
  }, [ref, resetMeasurements]);

  useResizeObserver(ref, HEIGHT_WIDTH, resizeHandler);

  return [ref, overflowedRef.current, resetMeasurements];
}
