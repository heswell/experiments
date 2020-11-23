
import React, { useCallback, useEffect, useRef } from 'react';
import cx from 'classnames';

const useLatestHandler = (handler) => {
    const latestHandler = useRef(handler);
    useEffect(() => {
        latestHandler.current = handler;
    }, [handler]);
    return latestHandler;
}

const MIN_GRIP_SIZE = 10;
const DEFAULT_GRIP = {top:0, right:0, bottom:0, left: 0};
const getGripStyle = ({width, height}, direction) => {
    if (direction === 'vertical'){
        if (height < MIN_GRIP_SIZE){
            const diff = MIN_GRIP_SIZE - height;
            return {
                top: -Math.ceil(diff/2),
                right: 0,
                bottom: -Math.ceil(diff/2),
                left: 0 
            }
        }
    } else {
        if (width < MIN_GRIP_SIZE){
            const diff = MIN_GRIP_SIZE - width;
            return {
                top: 0,
                right: -Math.ceil(diff/2),
                bottom: 0,
                left: -Math.ceil(diff/2) 
            };
        }
    }

    return DEFAULT_GRIP;
}

const Splitter = ({ absIdx, className, direction, layoutModel, onDrag, onDragEnd, onDragStart }) => {

    const root = useRef(null);
    const lastPos = useRef(null);

    const handleDrag = useLatestHandler(onDrag);
  
    const handleMouseMove = useCallback(evt => {
        const clientPos = direction === 'vertical' ? "clientY" : "clientX";
        const pos = evt[clientPos];
        const diff = pos - lastPos.current;
        // we seem to get a final value of zero
        if (pos && (pos !== lastPos.current)) {
            handleDrag.current(diff);
        }
        lastPos.current = pos;
    }, [])

    const handleMouseUp = useCallback(e => {
        window.removeEventListener("mousemove", handleMouseMove, false);
        window.removeEventListener("mouseup", handleMouseUp, false);
        onDragEnd();
    }, [onDragEnd])

    const handleMouseDown = useCallback(e => {
        lastPos.current = direction === "vertical" ? e.clientY : e.clientX;
        onDragStart(absIdx);

        window.addEventListener("mousemove", handleMouseMove, false);
        window.addEventListener("mouseup", handleMouseUp, false);
        e.preventDefault();

    }, [absIdx, onDragStart]);

    // WHy do we assign the mouseDown listener like this ?
    useEffect(() => {
        root.current.addEventListener('mousedown', handleMouseDown, false);
        return () => {
            root.current.removeEventListener('mousedown', handleMouseDown, false);
        }
    }, [])

    const { computedStyle: style } = layoutModel
    var className = cx(
        'Splitter',
        className
    );

    const gripStyle = getGripStyle(style, direction); 
    return (
        <div className={className} ref={root} style={{...style, overflow: 'visible'}}>
            <div className="splitter-handle" style={{position: 'absolute', ...gripStyle, backgroundColor: 'rgba(0,0,0,.01)', zIndex: 1}}/>
        </div>
    )

}

export default Splitter;
