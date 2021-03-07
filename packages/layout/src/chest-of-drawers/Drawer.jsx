import React from 'react';
import cx from "classnames";

import "./Drawer.css";

const Drawer = ({
  children,
  className: classNameProp,
  open, 
  position = "left", 
  inline, 
  peekaboo = false,
  ...props
}) => {

  const classBase = "hwDrawer";

  const className = cx(classBase, classNameProp, `${classBase}-${position}`, {
    [`${classBase}-open`]: open,
    [`${classBase}-inline`]: inline,
    [`${classBase}-over`]: !inline,
    [`${classBase}-peekaboo`]: peekaboo
  });

  return (
    <div {...props} className={className}>
      <div className={`${classBase}-liner`}>
        {children}
        </div>
    </div>
  )
}

export default Drawer;
