import React from 'react';
import cx from 'classnames';

import "./list-item.css";

const ListItem = ({
  children,
  isHighlighted, 
  idx, 
  isSelected, 
  onMouseEnter,
  onClick,
  ...props}) => {

  const handleClick = evt =>  onClick(evt, idx);
  const handleMouseEnter = evt =>  onMouseEnter(evt, idx);

  return (
    <div
    role="listitem"
    data-idx={idx}
    className={cx("hwListItem", {
      selected: isSelected,
      hilited: isHighlighted
    })}
    {...props}
    onMouseEnter={handleMouseEnter}
    onClick={handleClick}>
    {children}
  </div>

  )

}

export default ListItem;