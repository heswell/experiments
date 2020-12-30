import React from "react";
import classnames from "classnames";
import { Button, Icon, Toolbar, useDensity } from "@heswell/toolkit-2.0";
import { useViewAction } from "./ViewContext";

import "./Header.css";

const Header = ({
  className: classNameProp,
  density: densityProp,
  style,
  title,
  closeButton,
}) => {
  const dispatchViewAction = useViewAction();
  const density = useDensity(densityProp);

  const handleClose = () => {
    dispatchViewAction("close");
  };

  const className = classnames(
    "Header",
    `Header-${density}Density`,
    classNameProp
  );

  return (
    <Toolbar
      className={className}
      style={{ justifyContent: "flex-end" }}
      draggable
      showTitle
    >
      <Button onClick={handleClose} variant="secondary">
        <Icon name="close" />
      </Button>
    </Toolbar>
  );
};

export default Header;
