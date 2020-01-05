import React, { useRef, useCallback } from 'react';
import cx from 'classnames';
import { PopupService } from '@heswell/ui-controls';
import ComponentHeader from '../component/component-header.jsx';
import ComponentContextMenu from '../componentContextMenu';
import { remove as removeFromLayout } from '../redux/actions';
import { layout as applyLayout } from '../model/index';
import {getLayoutModel} from '../model/layout-json';
import { Action } from '../model/layout-reducer';

import './layout-item.css';

export default function LayoutItem(props){
    // TODO should we pass dispatch, title to the nested component ?
    const {children: component, layoutModel, dispatch, title, ...componentProps} = props;

    const el = useRef(null);


    const handleMouseDown = evt => {

        const position = el.current.getBoundingClientRect();

        if (props.onMouseDown) {
            props.onMouseDown({ layoutModel, position });
        } else {
            // check if we are allowed to drag ?
            dispatch({type: 'drag-start', evt, layoutModel, position });
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

    const className = cx('LayoutItem', {
        // 'minimized': state === 1,
        // 'maximized': state === 2,
        // 'active': this.props.isSelected,
        // 'dragging': dragging
    });

    const {computedStyle, header, children: [{computedStyle: style}]} = layoutModel;
    return (
        <div className={className} ref={el}
            style={computedStyle} >
            {header &&
                <ComponentHeader
                    title={`${title}`}
                    style={header.style}
                    menu={header.menu}
                    onMouseDown={handleMouseDown}
                    onAction={handleAction} /> }

            {component.type === 'div'
                ? React.cloneElement(component, { style })
                : React.cloneElement(component, { ...componentProps, style }) }
        </div>
    );

} 
