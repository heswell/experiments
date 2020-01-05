import React, { useReducer, useEffect, useRef, useState } from 'react';
import layoutReducer, { initModel, Action } from '../model/layout-reducer';
import { typeOf } from '../component-registry';
import {Draggable} from '../drag-drop/draggable';
import {componentFromLayout} from '../util/component-from-layout-json';
import LayoutItem from './layout-item';

const EMPTY_OBJECT = {};

export const LayoutRoot = ({children: propsChildren}) => {
  
  const [layoutModel, dispatchLayoutAction] = useReducer(layoutReducer, {type: typeOf(propsChildren), props: propsChildren.props}, initModel);
  const [rootProps, setRootProps] = useState({...propsChildren.props, layoutModel, dispatch, key: layoutModel.$id})
  
  useEffect(() => {
    setRootProps({...propsChildren.props, layoutModel, dispatch, key: layoutModel.$id})
  },[layoutModel])

  const dragOperation = useRef(null);
  const [dragPosition, setDragPosition] = useState(null);

  function dispatch(action){
    if (action.type === 'drag-start'){
      const {evt, ...options} = action;
      Draggable.handleMousedown(evt, handleDragStart.bind(null, options));
    } else {
      dispatchLayoutAction(action);
    }
  }

  function handleDragStart({layoutModel: draggedLayoutModel, position: dragRect, instructions=EMPTY_OBJECT}, evt, xDiff, yDiff){
      var {top,left} = dragRect;

    if (!instructions.DoNotRemove){
      dispatchLayoutAction({type: Action.REMOVE, layoutModel: draggedLayoutModel});
    }

    const dragTransform = Draggable.initDrag(evt, layoutModel, layoutModel.$path, dragRect, {
      drag: handleDrag,
      drop: handleDrop
  });

  // see surface for draggedIcon
  var {$path, computedStyle, ...rest} = draggedLayoutModel;

  const componentToBeDragged = {
    ...rest,
    computedStyle: {
      ...computedStyle,
      left,
      top 
    }
  }

  dragOperation.current = {
    component: componentToBeDragged,
    position: {left, top}
  }

    return true;
  }

  function handleDrag(x,y){
    const {position} = dragOperation.current;     
    const left = typeof x === 'number' ? x : position.left;
    const top = typeof y === 'number' ? y : position.top;
    if (left !== position.left || top !== position.top){
      dragOperation.current.position.left = left;
      dragOperation.current.position.top = top;
      setDragPosition({left, top});
    }
  }

  function handleDrop(dropTarget){
    console.log(`handleDrop`,dropTarget)
  }


  const layoutRootComponent = React.cloneElement(propsChildren, rootProps);

  if (dragOperation.current){
    const {component: {computedStyle, ...rest}, position} = dragOperation.current;
    const dragLayoutModel = {
      ...rest,
      computedStyle: {
        ...computedStyle,
        ...position
      }
    };

    const layoutItemProps = {
      key: dragLayoutModel.$id,
      title: dragLayoutModel.props.title,
      layoutModel: dragLayoutModel
    };

    const dragComponent = <LayoutItem {...layoutItemProps}>{componentFromLayout(dragLayoutModel)}</LayoutItem>;
    return [layoutRootComponent, dragComponent];

  } else {
    return layoutRootComponent;
  }

}

