import { useState, useCallback, useLayoutEffect, useRef } from "react";
import { debounce, ownerWindow } from "../utils";

export default function useOverflowDetection(dependencies) {
  const targetRef = useRef();
  const [isOverflowed, setOverflowed] = useState(false);

  const handleResize = useCallback(
    debounce(() => {
      const { current } = targetRef;

      if (!current) {
        // no component to measure yet
        isOverflowed && setOverflowed(false);
        return;
      }

      setOverflowed(current.offsetWidth < current.scrollWidth);
    }),
    [targetRef, isOverflowed]
  );

  // check on resizing
  useLayoutEffect(() => {
    // Multi window support
    const win = ownerWindow(targetRef.current);

    win.addEventListener("resize", handleResize);
    return () => {
      handleResize.clear();
      win.removeEventListener("resize", handleResize);
    };
  }, [targetRef, handleResize]);

  useLayoutEffect(handleResize, dependencies);

  return [targetRef, isOverflowed];
}
