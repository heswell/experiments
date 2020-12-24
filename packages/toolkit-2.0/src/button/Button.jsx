import React, { forwardRef } from "react";
import cx from "classnames";
import { useDensity } from "../theme";
import { IconClassNameProvider } from "../icon/IconClassNameContext";

import "./Button.css";

const Button = forwardRef(function Button(
  {
    component: Component = "button",
    children,
    className,
    component = "button",
    density: densityProp,
    type = "button",
    variant = "regular",
    ...props
  },
  ref
) {
  const density = useDensity(densityProp);

  return (
    <Component
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
    </Component>
  );
});

export default Button;
