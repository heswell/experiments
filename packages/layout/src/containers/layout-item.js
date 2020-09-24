import React, { useRef, useCallback } from 'react';
import { PopupService } from '@heswell/ui-controls';
import {renderHeader} from '../component/component-header.jsx';
import ComponentContextMenu from '../componentContextMenu';
import { Action } from '../model/layout-reducer';
import { isRegistered, registerType, ComponentRegistry, typeOf } from '../component-registry';

import useStyles from '../use-styles';

const PureLayoutItem = React.memo(LayoutItem);
PureLayoutItem.displayName = 'LayoutItem';

export default function LayoutItem(props){
    // TODO do we need to use useLayout ?
    // TODO should we pass dispatch, title to the nested component ?
    const {children: component, layoutModel, dispatch, title, ...componentProps} = props;

    const el = useRef(null);

    const handleMouseDown = evt => {
        evt.stopPropagation();
        const dragRect = el.current.getBoundingClientRect();
        // when would we ever have this onMouseDown ?s
        if (props.onMouseDown) {
            props.onMouseDown({ layoutModel });
        } else {
            const componentType = typeOf(component);
            if (!isRegistered(componentType)){
                registerType(componentType, component.type);
            }
            // check if we are allowed to drag ?
            dispatch({type: Action.DRAG_START, evt, layoutModel, dragRect });
        }
    }

    const handleAction = useCallback((key, opts) => {
        if (key === 'menu') {
            var { left, top } = opts;
            // we used to pass 'this' so context menu could interrogate props
            PopupService.showPopup({ left, top, component: <ComponentContextMenu doAction={handleContextMenuAction} /> });
        }
    },[]);

    const handleContextMenuAction = action => {
        if (action === 'remove') {
            dispatch({type: Action.REMOVE, layoutModel});
        }        
    }

    // const className = cx('LayoutItem', {
    //     // 'minimized': state === 1,
    //     // 'maximized': state === 2,
    //     // 'active': this.props.isSelected,
    //     // 'dragging': dragging
    // });

    const {LayoutItem} = useStyles();
    const {computedStyle, children: [{computedStyle: style}]} = layoutModel;
    return (
        <div className={LayoutItem} ref={el} style={computedStyle} >
            {renderHeader(props, {onAction: handleAction, onMouseDown: handleMouseDown}, layoutModel)}
            {component.type === 'div'
                ? React.cloneElement(component, { style })
                : React.cloneElement(component, { 
                    ...componentProps,
                    style,
                    dispatch,
                    onMouseDown: handleMouseDown
                }) }
        </div>
    );

} 
