import React from "react";
import cx from "classnames";
import "./toolbar.css";

export const Tooltray = ({children, className, ...props}) => {
  return (
    <div className={cx("Tooltray",className)} {...props}>{children}</div>
  )
}

const Toolbar = ({children}) => {
  return (
    <div className="Toolbar">{children}</div>
  )
}

export default Toolbar;