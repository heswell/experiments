
import React from 'react';

interface DraggableProps {
  className?: string;
  onDrag: (e: React.MouseEvent, deltaX: number, deltaY: number) => void;
  onDragStart?: (e: React.MouseEvent) => any; //  what do we allow here ? Who uses it ?
  onDragEnd?: (e: React.MouseEvent, arg: any) => void;
}

export type DraggableComponent = React.ComponentType<DraggableProps>;
declare const Draggable: DraggableComponent;
export default Draggable;