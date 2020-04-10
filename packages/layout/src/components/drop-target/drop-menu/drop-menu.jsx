import React from 'react';

import './drop-menu.css';

export function computeMenuPosition(dropTarget, offsetTop = 0, offsetLeft = 0) {
  const { pos, clientRect: box } = dropTarget;
  return pos.position.West ? [box.left - offsetLeft + 26, pos.y - offsetTop]
      : pos.position.South ? [pos.x - offsetLeft, box.bottom - offsetTop - 26]
      : pos.position.East ? [box.right - offsetLeft - 26, pos.y - offsetTop]
      /* North | Header*/ : [pos.x - offsetLeft, box.top - offsetTop + 26];
}

const DropMenu = ({dropTarget, onHover}) => {

  const dropTargets = dropTarget.toArray();

  return (
    <div className="drop-menu" onMouseLeave={() => onHover(null)}>
      {dropTargets.map((target, i) => (
        <div key={i} className="drop-menu-item" onMouseEnter={() => onHover(target)}/>
      ))}
    </div>
  )
}

export default DropMenu;