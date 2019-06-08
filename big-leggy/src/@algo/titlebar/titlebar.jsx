import React from 'react';

import './titlebar.css';

export default ({
  style,
  title,
  children
}) => {
  return (
    <div className="Titlebar" style={style}>
      <div className="inner-container">
        {title && <span>{title}</span>}
        {children}
      </div>
    </div>
  )
}