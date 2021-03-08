import React, { useState } from 'react';
import cx from "classnames";

import "./Drawer.css";

const Drawer = ({
  children,
  className: classNameProp,
  clickToOpen,
  open: openProp = false,
  position = "left",
  inline,
  onClick,
  peekaboo = false,
  ...props
}) => {

  const [open, setOpen] = useState(openProp);
  const classBase = "hwDrawer";

  const className = cx(classBase, classNameProp, `${classBase}-${position}`, {
    [`${classBase}-open`]: open,
    [`${classBase}-inline`]: inline,
    [`${classBase}-over`]: !inline,
    [`${classBase}-peekaboo`]: peekaboo
  });

  const toggleDrawer = () => {
    setOpen(!open);
  }

  const handleClick = clickToOpen
    ? toggleDrawer
    : onClick;

  return (
    <div {...props} className={className} onClick={handleClick}>
      <div className={`${classBase}-liner`}>
        <div className={`${classBase}-content`}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default Drawer;
