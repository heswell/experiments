import { useLayoutEffect, useState } from "react";

import { useChildRefs } from "../useChildRefs";

export default function useActivationIndicator(
  {
    activeIndicator = "bottom",
    // orientation,
    value,
  },
  rootRef,
  tabRefs
) {
  const [indicatorPos, setIndicatorPos] = useState(null);
  //   const vertical = orientation === "vertical";

  useLayoutEffect(() => {
    if (activeIndicator) {
      if (!tabRefs[value]) {
        debugger;
      }
      const tabRect = tabRefs[value].current.measure();
      // we probably don't need to do this every time if we;re observng this anyway
      const rootRect = rootRef.current.getBoundingClientRect();
      const left = tabRect.left - rootRect.left;
      setIndicatorPos({ style: { left, width: tabRect.width } });
    }
  }, [activeIndicator, rootRef, setIndicatorPos, tabRefs, value]);

  return {
    indicatorProps: activeIndicator ? indicatorPos : undefined,
  };
}
