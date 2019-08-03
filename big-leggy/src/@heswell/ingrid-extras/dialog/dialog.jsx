import React from 'react';
import {Draggable, PopupService} from '../../ingrid';

import './dialog.css';

export default ({
  buttons,
  children,
  onButtonClick,
  title
}) => {

   const buttonBar = buttons ? (
      <div className='buttons'>
        {buttons.map(key => getButton(key, onButtonClick))}
      </div>
   ) : null;

  return (
    <div className='dialog'>
      <Draggable onDrag={moveFilter}>
        <div className='title'>
          <span>{title}</span>
          <i className="material-icons">clear</i>
        </div>
      </Draggable>
      <div className='content-container'>
      {children}
      {buttonBar}
      </div>
    </div>
  )
}

function moveFilter(e, deltaX, deltaY){
  PopupService.movePopup(deltaX, deltaY)
}

const getButton = (key, onClick) => (
  <button key={key} onClick={() => onClick(key)}>{key}</button>
)
