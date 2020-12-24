import React, { forwardRef, useRef } from "react";
import cx from "classnames";
import useBreakPoints from "./useBreakPoints";
import { useForkRef } from "../utils";

const ResponsiveContainer = forwardRef(function ResponsiveContainer(
  props,
  ref
) {
  const { children, className, onMouseDown, style } = props;

  const root = useRef(null);
  const minWidth = useBreakPoints(root, props);

  return (
    <div
      className={cx(className, "responsive")}
      onMouseDown={onMouseDown}
      ref={useForkRef(ref, root)}
      style={{ ...style, minWidth }}
    >
      {children}
    </div>
  );
});

export default ResponsiveContainer;
