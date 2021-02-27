import { useCallback, useEffect, useRef, useState } from 'react';
import useResizeObserver from './useResizeObserver';
import {
  breakpointRamp,
  getBreakPoints as getDocumentBreakpoints,
} from '../theme';

const EMPTY_ARRAY = [];

// TODO how do we cater for smallerThan/greaterThan breakpoints
export default function useBreakpoints(
  { breakPoints: breakPointsProp, smallerThan, onResize },
  ref,
) {
  const [breakpointMatch, setBreakpointmatch] = useState(
    smallerThan ? false : 'lg',
  );
  const bodyRef = useRef(document.body);
  const breakPointsRef = useRef(
    breakPointsProp
      ? breakpointRamp(breakPointsProp)
      : getDocumentBreakpoints(),
  );

  // TODO how do we identify the default
  const sizeRef = useRef('lg');

  const stopFromMinWidth = useCallback(
    (w) => {
      if (breakPointsRef.current) {
        for (let [name, size] of breakPointsRef.current) {
          if (w >= size) {
            return name;
          }
        }
      }
    },
    [breakPointsRef],
  );

  const matchSizeAgainstBreakpoints = useCallback(
    (width) => {
      console.log(`matchSizeAgainstBreakpoints smallerThan ${smallerThan}`);
      if (smallerThan) {
        const [, , maxValue] = breakPointsRef.current.find(
          ([name]) => name === smallerThan,
        );
        return width < maxValue;
      } else {
        return stopFromMinWidth(width);
      }
    },
    [smallerThan, stopFromMinWidth],
  );

  // TODO need to make the dimension a config
  useResizeObserver(
    ref || bodyRef,
    breakPointsRef.current ? ['width'] : EMPTY_ARRAY,
    ({ width: measuredWidth }) => {
      console.log('resize');
      const result = matchSizeAgainstBreakpoints(measuredWidth);
      if (result !== sizeRef.current) {
        sizeRef.current = result;
        setBreakpointmatch(result);
      }
    },
  );

  useEffect(() => {
    const target = ref || bodyRef;
    if (target.current) {
      const prevSize = sizeRef.current;
      if (breakPointsRef.current) {
        // We're measuring here when the resizeObserver has also measured
        // There isn't a convenient way to get the Resizeobserver to
        // notify initial size - that's not really its job, unless we
        // set a flag ?
        const { clientWidth } = target.current;
        const result = matchSizeAgainstBreakpoints(clientWidth);
        sizeRef.current = result;
        // If initial size of ref does not match the default, notify client after render
        if (result !== prevSize) {
          setBreakpointmatch(result);
        }
      }
    }
  }, [setBreakpointmatch, matchSizeAgainstBreakpoints, ref]);

  return breakpointMatch;
}
