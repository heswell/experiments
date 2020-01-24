import React, { useReducer, useCallback, useEffect, useRef, useState } from 'react';
import layoutReducer, { initModel, Action } from '../model/layout-reducer';
import { typeOf } from '../component-registry';
import { Draggable } from '../drag-drop/draggable';
import { componentFromLayout } from '../util/component-from-layout-json';
import LayoutItem from './layout-item';
import {stretchLoading, stretchLayoutChildren} from '../model/stretch';

const EMPTY_OBJECT = {};

function useLayout(reducer, initialData){
    const [layoutModel, dispatchLayoutAction] = useReducer(reducer, initialData, initModel);

    if (layoutModel === null){
        stretchLoading.then(() => {
            dispatchLayoutAction({type: Action.INITIALIZE, ...initialData});
        });
    }

    return [layoutModel, dispatchLayoutAction];

}


export const LayoutRoot = ({ children: child }) => {
    const {props: {onLayoutModel, ...props}} = child;
    const [layoutModel, dispatchLayoutAction] = useLayout(layoutReducer, { layoutType: typeOf(child), props });
    const [drag, setDrag] = useState(-1.0);
    const dragOperation = useRef(null);

    useEffect(() => {
        if (layoutModel !== null){
            if (layoutModel.drag) {
                const {dragRect, dragPos, component, instructions} = layoutModel.drag;
                dragStart(dragRect, dragPos, component, instructions);
                setDrag(0.0);
            } else if (onLayoutModel){
                onLayoutModel(layoutModel, dispatchLayoutAction);
            }
        }
    }, [layoutModel])


    const dispatch = useCallback(action => {
        if (action.type === 'drag-start') {
            const { evt, ...options } = action;
            Draggable.handleMousedown(evt, prepareToDrag.bind(null, options), options.instructions);
        } else {
            dispatchLayoutAction(action);
        }
    },[layoutModel]);

    function prepareToDrag({ layoutModel, dragRect, instructions = EMPTY_OBJECT }, evt, xDiff, yDiff) {
        const dragPos = {x: evt.clientX, y: evt.clientY};
        // we need to wait for this to take effect before we continue with the drag
        dispatchLayoutAction({ type: Action.DRAG_START, layoutModel, dragRect, dragPos, instructions});
    }

    function dragStart(dragRect, dragPos, draggedLayoutModel) {
        var { top, left } = dragRect;
        // note: by passing null as dragContainer path, we are relying on registered DragContainer. How do we allow an 
        // override for this ?
        const dragTransform = Draggable.initDrag(layoutModel, null, dragRect, dragPos, {
            drag: handleDrag,
            drop: handleDrop
        });

        // the dragTransform should happen here

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
            setDrag(parseFloat(`${left}.${top}`));
        }
    }

    function handleDrop(dropTarget) {
        dispatch({type: Action.DRAG_DROP, dropTarget, targetPosition: dragOperation.current.position});
        dragOperation.current = null;
        setDrag(-1.0);
    }

    if (layoutModel === null){
        return null;
    }

    const rootProps = { ...props, layoutModel, dispatch, key: layoutModel ? layoutModel.$id : null };
    const layoutRoot = typeOf(child) === layoutModel.type
        ? child
        : componentFromLayout(layoutModel);
    const layoutRootComponent = React.cloneElement(layoutRoot, rootProps);

    if (dragOperation.current) {
        // better to leave style as-is and apply a scale transform.
        // this doesn't change the nested children computed style
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
            layoutModel: dragLayoutModel,
            dispatch: dispatchLayoutAction
        };

        const dragComponent = <LayoutItem {...layoutItemProps}>{componentFromLayout(dragLayoutModel)}</LayoutItem>;
        return [layoutRootComponent, dragComponent];

    } else {
        return layoutRootComponent;
    }

}

