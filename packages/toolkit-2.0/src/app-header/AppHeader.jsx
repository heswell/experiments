import React, { useEffect } from "react";
import cx from "classnames";
import { Logo } from "@heswell/toolkit-1.0";

import "./AppHeader.css";

const AppHeader = ({ appTitle, children, className, style }) => {
  console.log("%c[AppHeader] render", "color:green;font-weight: bold");

  useEffect(() => {
    console.log("%c[AppHeader] mounted", "color:blue;font-weight: bold");
    return () => {
      console.log("%c[AppHeader] unmounted", "color:blue;font-weight: bold");
    };
  }, []);

  return (
    <div className={cx("AppHeader", className)} style={style}>
      <Logo
        appTitle={appTitle}
        className={cx("Logo", className)}
        data-jpmui-test="app-header-logo"
        variant="jpm"
      />

      {children}
    </div>
  );
};

export default AppHeader;
