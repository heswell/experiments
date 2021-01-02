import React from "react";
import classnames from "classnames";
import { Button, Icon } from "@heswell/toolkit-2.0";

const Minimize = ({ className, ...props }) => (
  <Button
    {...props}
    className={classnames("MinimizeButton", className)}
    title="Minimize View"
    variant="secondary"
  >
    <Icon accessibleText="Minimize View" name="minimize" />
  </Button>
);

export default Minimize;
