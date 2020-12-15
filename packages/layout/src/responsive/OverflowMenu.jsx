import React, { forwardRef } from "react";
import { MoreVerticalIcon } from "../icons";
import "./OverflowMenu.css";
const Overflow = forwardRef(function Overflow({ onClick }, ref) {
    return (
      <button className="OverflowMenu" onClick={onClick} ref={ref}>
        <MoreVerticalIcon />
      </button>
    );
  });
  

  export default Overflow;