import React, { useEffect } from "react";
import cx from "classnames";
import { useDensity } from "../theme";
import { OverflowMenu, useOverflowObserver } from "../responsive";

import "./AppHeader.css";

const AppHeader = ({
  children,
  className,
  density: densityProp,
  id,
  style,
}) => {
  const density = useDensity(densityProp);

  const [innerContainerRef, overflowedItems] = useOverflowObserver(
    "horizontal",
    "AppHeader"
  );

  return (
    <div
      className={cx("AppHeader", `AppHeader-${density}Density`, className)}
      id={id}
      style={style}
    >
      <div className="AppHeader-innerContainer" ref={innerContainerRef}>
        {/* <div className="responsive-pillar" /> */}
        <OverflowMenu
          className="AppHeader-navMenu"
          iconName="menu-burger"
          source={overflowedItems}
        />
        {children}
      </div>
    </div>
  );
};

export default AppHeader;
