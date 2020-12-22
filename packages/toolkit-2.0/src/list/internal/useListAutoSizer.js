import { useRef, useState, useCallback, useLayoutEffect } from "react";
// import ResizeObserver from "resize-observer-polyfill";

export function useListAutoSizer(props) {
  const { responsive, width, height } = props;
  const [size, setSize] = useState({ width, height });
  const ref = useRef();

  const handleResize = useCallback(function handleResize(contentRect) {
    setSize({
      width: contentRect.width,
      height: contentRect.height
    });
  }, []);

  useLayoutEffect(() => {
    setSize({ width, height });
  }, [width, height]);

  useLayoutEffect(() => {
    if (responsive) {
      handleResize(ref.current.getBoundingClientRect());

      const observer = new ResizeObserver(([{ contentRect }]) =>
        handleResize(contentRect)
      );

      observer.observe(ref.current);
      return () => {
        observer.disconnect();
      };
    }
  }, [handleResize, responsive]);

  return [ref, size];
}
