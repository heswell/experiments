import React from "react";
import classnames from "classnames";
import { Button, Icon } from "@heswell/toolkit-2.0";

const TearOut = ({ className, ...props }) => (
  <Button
    {...props}
    className={classnames("TearOutButton", className)}
    title="TearOut View"
    variant="secondary"
  >
    <Icon accessibleText="Tear out View" name="tear-out" />
  </Button>
);

export default TearOut;
