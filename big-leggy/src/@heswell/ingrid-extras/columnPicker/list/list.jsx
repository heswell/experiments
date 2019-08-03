import React, {useState, useEffect, useRef, useCallback} from 'react';
import {Motion, spring} from 'react-motion';
import cx from 'classnames';

import './list.css';

const springConfig = {stiffness: 300, damping: 50};
const noop = () => {}

function clamp(n, min, max) {
    return Math.max(Math.min(n, max), min);
}

function reinsert(arr, from, to) {
    const _arr = arr.slice(0);
    const val = _arr[from];
    _arr.splice(from, 1);
    _arr.splice(to, 0, val);
    return _arr;
}

const List = ({
    className,
    dragged={ item: null }, // should we rely on this being passed in ?
    dragging, // not sura about this one
    items,
    mouseMoveX,
    mouseMoveY,
    onItemRemoved=noop,
    onMeasure=noop,
    onReorder=noop,
    onTarget,
    style
}) => {

    const delta = useRef(0);
    const dragOffset = useRef({x:0, y:0})
    const el = useRef(null);
    const isPressed = useRef(false);
    const lastPressed = useRef(null);
    const lastItems = useRef(items);
    const lastPressedPos = useRef(0);
    const orderedItems = useRef(Array.from(Array(items.length),(_,i) => i))    

    const [state, setState] = useState({
        isDragging: false,
        mouse: 0
    });

    if (lastItems.current !== items){
        lastItems.current = items;
        orderedItems.current = Array.from(Array(items.length),(_,i) => i);
    }

    useEffect(() => {
        var {left, top, right, bottom} = el.current.getBoundingClientRect();

        setState(currentState => ({
            ...currentState,
            left,
            top,
            right,
            bottom
        }));

        onMeasure({left, top, right, bottom});

    },[]);

    useEffect(() => {
        if (dragged.item){
            dragOffset.current = {
                x: dragged.rect.left - state.left,
                y: dragged.rect.top - state.top
            }
        }
    },[dragged])

    const handleMouseDown = (item, pos, pressY, {pageY}) => {

        isPressed.current = true;
        lastPressed.current = item;
        lastPressedPos.current = pos;
        delta.current = pageY - pressY;

        setState(currentState => ({
            ...currentState,
            isDragging: true,
            mouse: pressY
        }));	    

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }

    const handleMouseMove = useCallback(({pageY}) => {
        if (isPressed.current) {
            const mouse = pageY - delta.current;
            const row = clamp(Math.round(mouse / 24), 0, items.length - 1);
            const order = orderedItems.current;
            orderedItems.current = reinsert(order, order.indexOf(lastPressedPos.current), row);
            setState(currentState => ({...currentState, mouse}));
        }
    },[items.length])

    const handleMouseUp = useCallback(() => {
        // pass all these in callback, so parent can feed them back in
        isPressed.current = false;
        delta.current = 0;
        onReorder(orderedItems.current);
       
        setState(currentState => ({
            ...currentState,
            isDragging: false
        }));	    

        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    },[]);

    const {mouse} = state;
    const {x: dragOffsetX, y: dragOffsetY} = dragOffset.current;

    const content = items.map((item,idx) => {

        const order = orderedItems.current;

        const motionStyle = lastPressed.current === item && isPressed.current
            ? {
                scale: spring(1.01, springConfig),
                shadow: spring(16, springConfig),
                x:0,
                y: mouse,
            }
            : (item === dragged.item && onTarget
                ? (dragging 
                    ? {
                        scale : spring(1.01, springConfig),
                        shadow: spring(16, springConfig),
                        x: dragOffsetX + mouseMoveX,
                        y: dragOffsetY + mouseMoveY
                    }
                    : { // Dropped onto target, slot into final resting place
                        scale: spring(1, springConfig),
                        shadow: spring(1, springConfig),
                        x: spring(0, springConfig),
                        y: spring(order.indexOf(idx) * 24, springConfig)
                    }
                )
                : { 
                    scale: spring(1, springConfig),
                    shadow: spring(1, springConfig),
                    x:0,
                    y: spring(order.indexOf(idx) * 24, springConfig),
            });
        return (
            <Motion style={motionStyle} key={item.name}>
                {({scale, shadow, x, y}) =>
                <div
                    onMouseDown={e => handleMouseDown(item, idx, y, e)}
                    className="ListItem demo8-item"
                    style={{
                        width: style.width,
                        height: 23,
                        boxShadow: `rgba(0, 0, 0, 0.2) 0px ${shadow}px ${2 * shadow}px 0px`,
                        transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
                        zIndex: item === lastPressed.current || item === dragged.item ? 99 : idx
                    }}>
                    <span>{`${order.indexOf(idx) + 1}  ${item.name}`}</span>
                    { dragging && item === dragged.item 
                        ? null 
                        : <div className="button remove" onClick={() => onItemRemoved(item)}>
                            <i className="material-icons">clear</i>
                        </div> }
                </div>
                }
            </Motion>
        )
    });

    if (dragged.item && !onTarget){

        const style2 = dragging 
        ? {
            scale : spring(1.01, springConfig),
            shadow: spring(16, springConfig),
            x: dragOffsetX + mouseMoveX,
            y: dragOffsetY + mouseMoveY
        }

        : { // No Drop - return to base - need to remove node at end
            scale: spring(1, springConfig),
            shadow: spring(1, springConfig),
            x: spring(dragOffsetX, springConfig),
            y: spring(dragOffsetY, springConfig)
        };

        content.push(			
            <Motion style={style2} key="dragged">
                {({scale,shadow,x,y}) => 
                    <div className="ListItem demo8-item"
                        style={{
                        width: style.width,
                        backgroundColor: dragging ? 'yellow' : 'white',
                        boxShadow: `rgba(0, 0, 0, 0.2) 0px ${shadow}px ${2 * shadow}px 0px`,
                        transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
                        zIndex: 99
                        }}>
                        {`${dragged.item.name}`}
                    </div>
                }
            </Motion>
        );
    }

    return (
        <div ref={el} className={cx('List',className)} style={style}>
            {content}
        </div>
    );

} 
export default List;

