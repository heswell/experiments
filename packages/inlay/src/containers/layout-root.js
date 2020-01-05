import React, { useReducer, useEffect, useRef, useState } from 'react';
import layoutReducer, { initModel, Action } from '../model/layout-reducer';
import { typeOf } from '../component-registry';
import { Draggable } from '../drag-drop/draggable';
import { componentFromLayout } from '../util/component-from-layout-json';
import LayoutItem from './layout-item';

const EMPTY_OBJECT = {};

export const LayoutRoot = ({ children: propsChildren }) => {

    const [layoutModel, dispatchLayoutAction] = useReducer(layoutReducer, { type: typeOf(propsChildren), props: propsChildren.props }, initModel);
    const [rootProps, setRootProps] = useState({ ...propsChildren.props, layoutModel, dispatch, key: layoutModel.$id })

    useEffect(() => {
        setRootProps({ ...propsChildren.props, layoutModel, dispatch, key: layoutModel.$id });
        if (layoutModel.drag) {
            const {dragRect, dragPos, component} = layoutModel.drag;
            dragStart(dragRect, dragPos, component);
        }
    }, [layoutModel])

    const dragOperation = useRef(null);
    const [dragPosition, setDragPosition] = useState(null);

    function dispatch(action) {
        if (action.type === 'drag-start') {
            const { evt, ...options } = action;
            Draggable.handleMousedown(evt, prepareToDrag.bind(null, options));
        } else {
            dispatchLayoutAction(action);
        }
    }

    function prepareToDrag({ layoutModel, dragRect, instructions = EMPTY_OBJECT }, evt, xDiff, yDiff) {
        if (!instructions.DoNotRemove) {
            const dragPos = {x: evt.clientX, y: evt.clientY};
            // we need to wait for this to take effect before we continue with the drag
            dispatchLayoutAction({ type: Action.DRAG_START, layoutModel, dragRect, dragPos});
        }
    }

    function dragStart(dragRect, dragPos, draggedLayoutModel) {
        var { top, left } = dragRect;

        const dragTransform = Draggable.initDrag(layoutModel, layoutModel.$path, dragRect, dragPos, {
            drag: handleDrag,
            drop: handleDrop
        });
        console.log(`%cdragTransform ${JSON.stringify(dragTransform)}`,'color:blue;font-weight:bold;')
        // see surface for draggedIcon
        var { $path, computedStyle, ...rest } = draggedLayoutModel;

        const componentToBeDragged = {
            ...rest,
            computedStyle: {
                ...computedStyle,
                ...dragTransform,
                left,
                top
            }
        }

        dragOperation.current = {
            component: componentToBeDragged,
            position: { left, top }
        }
    }

    function handleDrag(x, y) {
        const { position } = dragOperation.current;
        const left = typeof x === 'number' ? x : position.left;
        const top = typeof y === 'number' ? y : position.top;
        if (left !== position.left || top !== position.top) {
            dragOperation.current.position.left = left;
            dragOperation.current.position.top = top;
            setDragPosition({ left, top });
        }
    }

    function handleDrop(dropTarget) {
        dispatch({type: Action.DRAG_DROP, dropTarget});
        dragOperation.current = null;
    }

    const layoutRootComponent = React.cloneElement(propsChildren, rootProps);

    if (dragOperation.current) {
        const { component: { computedStyle, ...rest }, position } = dragOperation.current;
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

