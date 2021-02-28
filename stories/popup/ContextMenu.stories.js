import React from 'react';

import { ContextMenu, MenuItem, PopupService, Separator } from '@heswell/popup';


export default {
  title: 'Popup/ContextMenu',
  component: ContextMenu
};

export const SimpleContextMenu = () =>
  <div style={{ position: 'absolute', top: 100, left: 100 }}>
    <ContextMenu>
      <MenuItem label="Item 1">
        <MenuItem label="Item 1.1" />
        <MenuItem label="Item 1.2" />
        <MenuItem label="Item 1.3" />
        <Separator />
        <MenuItem label="Item 1.4" />
        <MenuItem label="Item 1.5" />
      </MenuItem>
      <MenuItem label="Item 2" />
      <MenuItem label="item 3">
        <MenuItem label="Item 3.1">
          <MenuItem label="Item 3.1.1" />
          <MenuItem label="Item 3.1.2" />
          <MenuItem label="Item 3.1.3" />
          <MenuItem label="Item 3.1.4" />
        </MenuItem>
        <MenuItem label="Item 3.2" />
        <MenuItem label="Item 3.3" />
        <MenuItem label="Item 3.3" />
      </MenuItem>
    </ContextMenu>
  </div>


export const ContextMenuPopup = () => {

  const component = (
    <ContextMenu>
      <MenuItem label="Item 1">
        <MenuItem label="Item 1.1" />
        <MenuItem label="Item 1.2" />
        <MenuItem label="Item 1.3" />
        <Separator />
        <MenuItem label="Item 1.4" />
        <MenuItem label="Item 1.5" />
      </MenuItem>
      <MenuItem label="Item 2" />
      <MenuItem label="item 3">
        <MenuItem label="Item 3.1">
          <MenuItem label="Item 3.1.1" />
          <MenuItem label="Item 3.1.2" />
          <MenuItem label="Item 3.1.3" />
          <MenuItem label="Item 3.1.4" />
        </MenuItem>
        <MenuItem label="Item 3.2" />
        <MenuItem label="Item 3.3" />
        <MenuItem label="Item 3.3" />
      </MenuItem>
    </ContextMenu>
  );


  const handleClick = (evt) => {
    PopupService.showPopup({ left: Math.round(evt.clientX), top: Math.round(evt.clientY), component });
}

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <button onClick={handleClick}>Show Context Menu</button>
    </div>
  )

}
