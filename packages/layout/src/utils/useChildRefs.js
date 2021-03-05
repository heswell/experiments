import React, { createRef, useCallback, useRef } from "react";

const useChildRefs = (children) => {
  const childRefs = useRef([]);

  const childCount = React.Children.count(children);
  if (childRefs.current.length !== childCount) {
    // add or remove refs
    childRefs.current = Array(childCount)
      .fill(null)
      .map((_, i) => childRefs.current[i] || createRef());
  }

  return childRefs.current;
};

export default useChildRefs;
