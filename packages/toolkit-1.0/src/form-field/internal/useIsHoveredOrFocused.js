import React, { useState, useMemo } from "react";

const useIsHoveredOrFocused = () => {
  const [isHoveredOrFocused, setIsHoveredOrFocused] = useState(false);
  const hasHover = React.useRef(false);
  const hasFocus = React.useRef(false);

  const methods = useMemo(
    () => ({
      onBlur: () => {
        hasFocus.current = false;
        setIsHoveredOrFocused(hasHover.current);
      },
      onFocus: () => {
        hasFocus.current = true;
        setIsHoveredOrFocused(true);
      },
      onMouseEnter: () => {
        hasHover.current = true;
        setIsHoveredOrFocused(true);
      },
      onMouseLeave: () => {
        hasHover.current = false;
        setIsHoveredOrFocused(hasFocus.current);
      }
    }),
    []
  );

  return [isHoveredOrFocused, methods];
};

export default useIsHoveredOrFocused;
