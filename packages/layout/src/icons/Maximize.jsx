import React from "react";
import classnames from "classnames";

const Maximize = ({ className, ...props }) => (
  <button
    {...props}
    className={classnames("MaximizeButton", className)}
    title="Maximize View"
    variant="secondary"
  >
    {/* <Icon accessibleText="Maximize View" name="maximize" /> */}
  </button>
);

export default Maximize;
