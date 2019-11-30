import React, {useRef, useCallback} from 'react';

const NOOP = () => {}

export default allProps => {
    const {
        component:Component,
        children: child,
        ...props
    } = allProps;

    const {onDrag, onDragStart=NOOP, onDragEnd=NOOP} = allProps;
    const position = useRef({x:0,y:0});
    const dragState = useRef(null);

    const handleMouseDown = e => {
        // what is dragState supposed to be exactly ?
        const newDragState = onDragStart(e);
        if (newDragState === null && e.button !== 0) {
            return;
        }

        position.current.x = e.clientX;
        position.current.y = e.clientY;

        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('mousemove', onMouseMove);

        dragState.current = newDragState;

        if (e.stopPropagation) {
            e.stopPropagation();
        }

        if (e.preventDefault) {
            e.preventDefault();
        }        
    }

    const onMouseMove = useCallback(e => {
        if (dragState.current === null) {
            return;
        }

        if (e.stopPropagation) {
            e.stopPropagation();
        }

        if (e.preventDefault) {
            e.preventDefault();
        }

        const x = e.clientX;
        const y = e.clientY;

        const deltaX = x - position.current.x;
        const deltaY = y - position.current.y;

        position.current.x = x;
        position.current.y = y;

        onDrag(e, deltaX, deltaY);
    },[])

    const onMouseUp = useCallback(e => {
        cleanUp();
        onDragEnd(e, dragState.drag);
        dragState.current = null;
    },[]);

    const cleanUp = () => {
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('mousemove', onMouseMove);
    }

    if (child && !Array.isArray(child)){
        return React.cloneElement(child, {...props, onMouseDown: handleMouseDown});
    } else if (Component){
        return <Component onMouseDown={handleMouseDown} {...props}/>;
    } else {
        return <div onMouseDown={handleMouseDown} {...props}/>;
    }
}
