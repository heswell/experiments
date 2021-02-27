import React from "react";
import classnames from "classnames";

const Minimize = ({ className, ...props }) => (
  <button
    {...props}
    className={classnames("MinimizeButton", className)}
    title="Minimize View"
    variant="secondary"
  >
  </button>
);

export default Minimize;
