import React, { forwardRef } from "react";
import cx from "classnames";
import { IconClassNameProvider } from "../icon/IconClassNameContext";

import "./Button.css";

const Button = forwardRef(function Button(
  {
    children,
    className,
    density = "medium",
    type = "button",
    variant = "regular",
    ...props
  },
  ref
) {
  return (
    <button
      className={cx(
        "Button",
        className,
        `Button-${variant}`,
        `Button-${density}Density`
      )}
      tabIndex={0}
      type={type}
      {...props}
      ref={ref}
    >
      <IconClassNameProvider value="Button-icon">
        <span className="Button-label">{children}</span>
      </IconClassNameProvider>
    </button>
  );
});

export default Button;
