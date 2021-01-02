import React from "react";
import classnames from "classnames";
import { Close, Minimize, Maximize, TearOut } from "./icons";
import { Button, Icon, Toolbar, useDensity } from "@heswell/toolkit-2.0";
import { useLayoutDispatch } from "./LayoutContext";

import "./Header.css";

const Header = ({
  className: classNameProp,
  density: densityProp,
  collapsed,
  expanded,
  closeable,
  style,
  tearOut,
  title,
  closeButton,
}) => {
  const layoutDispatch = useLayoutDispatch();
  const density = useDensity(densityProp);

  const handleClose = () => {
    layoutDispatch("close");
  };

  const handleMouseDown = (evt) => {
    evt.stopPropagation();
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
      {collapsed === false ? <Minimize /> : null}
      {expanded === false ? <Maximize /> : null}
      {tearOut ? <TearOut /> : null}
      {closeable ? (
        <Close onClick={handleClose} onMouseDown={handleMouseDown} />
      ) : null}
    </Toolbar>
  );
};

export default Header;
