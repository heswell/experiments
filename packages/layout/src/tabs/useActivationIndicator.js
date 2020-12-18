import { useCallback, useLayoutEffect, useMemo, useState } from "react";

export default function useActivationIndicator(value, rootRef, tabRefs) {
  const [initialStyle, setInitialStyle] = useState(null);
  //   const vertical = orientation === "vertical";

  const createIndicatorStyle = useCallback(
    (value) => {
      const tab = tabRefs[value].current;
      if (tab) {
        const tabRect = tab.measure();
        // we probably don't need to do this every time if we;re observng this anyway
        const rootRect = rootRef.current.getBoundingClientRect();
        const left = tabRect.left - rootRect.left;
        return { left, width: tabRect.width };
      }
    },
    [rootRef, tabRefs]
  );

  // We use useLayoutEffect and useMemo in combination here. The useLayoutEffect
  // computes the initial style. This has to fire after the initial render, when
  // the dom elements are first ready. This will trigger a second render to
  // position the activation indicator.
  // All subsequent updates will be triggered by changes to value. We don't want
  // to trigger these after render as this will always incure two renders for the
  // ActivationIndicator. AFter the first, we can compute position during the render
  // phase.
  // TODO cache DOM measurements
  useLayoutEffect(() => {
    setInitialStyle(createIndicatorStyle(value));
  }, []);

  // First time in this will return nothing, as the dom isn't ready for measurement
  const style = useMemo(() => createIndicatorStyle(value), [value]);

  return style || initialStyle;
}
