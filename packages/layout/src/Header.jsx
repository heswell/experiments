import React from "react";
import { Toolbar } from "@heswell/toolkit-2.0";
import { CloseIcon } from "./icons";
import { useViewAction } from "./ViewContext";

import "./Header.css";

const Header = ({ style, title, closeButton }) => {
  const dispatchViewAction = useViewAction();

  const handleClose = () => {
    dispatchViewAction("close");
  };

  return (
    <Toolbar
      className="Header"
      style={{ justifyContent: "flex-end" }}
      draggable
      showTitle
    >
      <CloseIcon onClick={handleClose} />
    </Toolbar>
  );
};

export default Header;
