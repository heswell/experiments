import React from 'react';
import cx from "classnames";

import "./drag-icon.css"

const DragIcon = ({children, className,  ...props}) => {

  return (
    <div {...props} className={cx("DragIcon", className)}></div>
  )

}

export default DragIcon;