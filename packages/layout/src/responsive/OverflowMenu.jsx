import React, { forwardRef } from "react";
import Button from "../button/Button";
import Icon from "../icon/Icon";

import "./OverflowMenu.css";

const Overflow = forwardRef(function Overflow({ show, ...props }, ref) {
  return (
    <Button variant="secondary" ref={ref} {...props} tabIndex={0}>
      <Icon accessibleText="overflow menu" name="more" />
    </Button>
  );
});

export default Overflow;
