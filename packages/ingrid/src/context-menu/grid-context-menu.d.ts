import React from 'react';

interface GridContextMenuProps {
  dispatch: any;
  doAction: any;
  location: any;
  options: any;
}

export type GridContextMenuComponent = React.ComponentType<GridContextMenuProps>;
declare const GrisComponentMenu: GridContextMenuComponent;
export default GridContextMenu;