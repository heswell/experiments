import React from 'react';

import './app-header.css';

export default ({ style }) => {

  return (
    <div className="AppHeader" style={style}>
      <div className="app-header-container">
        <div className="toolbar">
          <div className="app-search-container">
            <input className="app-search-input" placeholder="Search"/>
          </div>
        </div>
      </div>
    </div>
  )
}