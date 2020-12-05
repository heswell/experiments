import { useRef } from "react";
import useResizeObserver from "./useResizeObserver";

const byDescendingStopSize = ([, s1], [, s2]) => s2 - s1;
const EMPTY_ARRAY = [];

export default function useBreakPoints(
  ref,
  { breakPoints: breakPointsProp, onResize }
) {
  const breakPoints = breakPointsProp
    ? Object.entries(breakPointsProp).sort(byDescendingStopSize)
    : null;
  const minWidth = breakPoints ? breakPoints[breakPoints.length - 1][1] : 0;
  // TODO how do we identify the default
  const size = useRef("lg");

  const stopFromWidth = (w) => {
    if (breakPoints) {
      for (let [name, size] of breakPoints) {
        if (w >= size) {
          return name;
        }
      }
    }
  };

  // TODO need to make the dimension a config
  useResizeObserver(
    ref,
    breakPoints ? ["width"] : EMPTY_ARRAY,
    ({ width: measuredWidth }) => {
      const breakPoint = stopFromWidth(measuredWidth);
      if (breakPoint !== size.current) {
        size.current = breakPoint;
        onResize(breakPoint);
      }
    }
  );

  return minWidth;
}
