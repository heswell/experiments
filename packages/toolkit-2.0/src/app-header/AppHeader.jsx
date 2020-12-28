import React, { useEffect } from "react";
import cx from "classnames";
import { useDensity } from "../theme";
import { OverflowMenu, useOverflowObserver } from "../responsive";

import "./AppHeader.css";

const AppHeader = ({ children, className, density: densityProp, style }) => {
  console.log("%c[AppHeader] render", "color:green;font-weight: bold");
  const density = useDensity(densityProp);

  useEffect(() => {
    console.log("%c[AppHeader] mounted", "color:blue;font-weight: bold");
    return () => {
      console.log("%c[AppHeader] unmounted", "color:blue;font-weight: bold");
    };
  }, []);

  const [innerContainerRef, overflowedItems] = useOverflowObserver(
    "horizontal",
    "AppHeader"
  );

  return (
    <div
      className={cx("AppHeader", `AppHeader-${density}Density`, className)}
      style={style}
    >
      <div className="AppHeader-innerContainer" ref={innerContainerRef}>
        <div className="responsive-pillar" />
        {children}
      </div>
    </div>
  );
};

export default AppHeader;
