import React, { useRef, useCallback } from 'react';
import cx from 'classnames';
import { PopupService } from '@heswell/ui-controls';
import ComponentHeader from '../component/component-header.jsx';
import ComponentContextMenu from '../componentContextMenu';
import { Action } from '../model/layout-reducer';
import { LayoutRoot } from './layout-root';
import useStyles from '../use-styles';

// import './layout-item.css';

const PureLayoutItem = React.memo(LayoutItem);
PureLayoutItem.displayName = 'LayoutItem';

export default function LayoutItem(props){
    // TODO should we pass dispatch, title to the nested component ?
    const {children: component, layoutModel, dispatch, title, ...componentProps} = props;

    // this is bad because followed by hooks- use context
    if (layoutModel === undefined){
        return (
            <LayoutRoot><PureLayoutItem {...props} /></LayoutRoot>
        )
    }

    const el = useRef(null);

    const handleMouseDown = evt => {
        evt.stopPropagation();
        const dragRect = el.current.getBoundingClientRect();
        if (props.onMouseDown) {
            props.onMouseDown({ layoutModel, position });
        } else {
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
    const {computedStyle, header, children: [{computedStyle: style}]} = layoutModel;
    return (
        <div className={LayoutItem} ref={el}
            style={computedStyle} >
            {header &&
                <ComponentHeader
                    title={title}
                    style={header.style}
                    menu={header.menu}
                    onMouseDown={handleMouseDown}
                    onAction={handleAction} /> }

            {component.type === 'div'
                ? React.cloneElement(component, { style })
                : React.cloneElement(component, { ...componentProps, style, dispatch }) }
        </div>
    );

} 
