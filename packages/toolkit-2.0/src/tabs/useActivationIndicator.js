import { useCallback, useLayoutEffect, useState } from "react";

// Overflow can affect tab positions, so we recalculate when it changes
export default function useActivationIndicator(rootRef, tabRef) {
  const [initialStyle, setInitialStyle] = useState(null);
  //   const vertical = orientation === "vertical";
  const createIndicatorStyle = useCallback(() => {
    if (tabRef.current) {
      const tabRect = tabRef.current.getBoundingClientRect();
      // TODO we could cache this one at least ...
      const rootRect = rootRef.current.getBoundingClientRect();
      const left = tabRect.left - rootRect.left;
      return { left, width: tabRect.width };
    }
  }, [rootRef, tabRef]);

  // We use useLayoutEffect and useMemo in combination here. The useLayoutEffect
  // computes the initial style. This has to fire after the initial render, when
  // the dom elements are first ready. This will trigger a second render to
  // position the activation indicator.
  // All subsequent updates will be triggered by changes to TabRef. We don't want
  // to trigger these after render as this will always incure two renders for the
  // ActivationIndicator. AFter the first, we can compute position during the render
  // phase.
  useLayoutEffect(() => {
    setInitialStyle(createIndicatorStyle());
  }, []);

  // Have tried memoising this. Problem is, it's difficult to get the timing right
  // when overflow may be present and a selected tab may be cutrrently overflowed
  // This is more expensive than necessary, but simple and safe...
  const style = createIndicatorStyle();

  return style || initialStyle;
}
