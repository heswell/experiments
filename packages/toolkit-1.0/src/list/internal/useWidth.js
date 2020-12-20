import { useRef, useState, useCallback, useLayoutEffect } from "react";
import ResizeObserver from "resize-observer-polyfill";

export const useWidth = (responsive) => {
  const [width, setWidth] = useState();
  const ref = useRef();

  const handleResize = useCallback(function handleResize(contentRect) {
    setWidth(contentRect.width);
  }, []);

  useLayoutEffect(() => {
    handleResize(ref.current.getBoundingClientRect());

    if (responsive) {
      const observer = new ResizeObserver(([{ contentRect }]) => {
        handleResize(contentRect);
      });
      observer.observe(ref.current);

      return () => {
        observer.disconnect();
      };
    }
  }, [handleResize, responsive]);

  return [ref, width];
};
