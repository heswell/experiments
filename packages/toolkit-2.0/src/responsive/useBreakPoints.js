import { useCallback, useEffect, useRef } from "react";
import useResizeObserver from "./useResizeObserver";

const byDescendingStopSize = ([, s1], [, s2]) => s2 - s1;
const EMPTY_ARRAY = [];

export default function useBreakPoints(
  ref,
  { breakPoints: breakPointsProp, onResize }
) {
  const breakPointsRef = useRef(
    breakPointsProp
      ? Object.entries(breakPointsProp).sort(byDescendingStopSize)
      : null
  );
  const minWidth = breakPointsRef.current
    ? breakPointsRef.current[breakPointsRef.current.length - 1][1]
    : undefined;
  // TODO how do we identify the default
  const sizeRef = useRef("lg");

  const stopFromWidth = useCallback(
    (w) => {
      if (breakPointsRef.current) {
        for (let [name, size] of breakPointsRef.current) {
          if (w >= size) {
            return name;
          }
        }
      }
    },
    [breakPointsRef]
  );

  // TODO need to make the dimension a config
  useResizeObserver(
    ref,
    breakPointsRef.current ? ["width"] : EMPTY_ARRAY,
    ({ width: measuredWidth }) => {
      const breakPoint = stopFromWidth(measuredWidth);
      if (breakPoint !== sizeRef.current) {
        sizeRef.current = breakPoint;
        onResize(breakPoint);
      }
    }
  );

  useEffect(() => {
    if (ref.current) {
      const prevSize = sizeRef.current;
      if (breakPointsRef.current) {
        // We're measuring here when the resizeObserver has also measured
        // There isn't a convenient way to get the Resizeobserver to
        // notify initial size - that's not really its job, unless we
        // set a flag ?
        const { width } = ref.current.getBoundingClientRect();
        sizeRef.current = stopFromWidth(width);
        // If initial size of ref does not match the default, notify client after render
        if (sizeRef.current !== prevSize) {
          onResize(sizeRef.current);
        }
      }
    }
  }, [ref]);

  return [minWidth, sizeRef.current];
}
