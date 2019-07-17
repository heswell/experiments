import React, {useRef, useCallback} from 'react';

export default allProps => {
    const {
        component:Component,
        ...props
    } = allProps;

    const {onDrag, onDragStart, onDragEnd} = allProps;
    const position = useRef({x:0,y:0});
    const dragState = useRef(null);

    const handleMouseDown = e => {
        // what is dragState supposed to be exactly ?
        const newDragState = onDragStart(e);
        console.log(`handleMouseDown ${newDragState}`)
        if (newDragState === null && e.button !== 0) {
            return;
        }

        position.current.x = e.clientX;
        position.current.y = e.clientY;

        console.log(`REGISTER LISTENERS`)
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
        console.log(`onMouseMove ${dragState.drag}`)
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

        console.log(`drag by ${deltaX}`)
        onDrag(e, deltaX, deltaY);
    },[])

    const onMouseUp = useCallback(e => {
        console.log(`onMouseUp`)
        cleanUp();
        onDragEnd(e, dragState.drag);
        dragState.current = null;
    },[]);

    const cleanUp = () => {
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('mousemove', onMouseMove);
    }

    if (Component){
        return <Component onMouseDown={handleMouseDown} {...props}/>;
    } else {
        return <div onMouseDown={handleMouseDown} {...props}/>;
    }
}
