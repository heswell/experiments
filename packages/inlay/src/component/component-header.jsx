import React, {useCallback} from 'react';
import './component-header.css';

const NOOP = () => {}

export default ({menu = true, fixed, minimized, style, title, onAction=NOOP, onMouseDown}) => {
    const menuClick = useCallback(e => onAction('menu', { left: e.clientX, top: e.clientY }),[onAction]);
    const mouseDown = e => e.stopPropagation();
    return (
        <header className="ComponentHeader" onMouseDown={onMouseDown} style={style}>
            <span className="title">{title}</span>
            {fixed && !minimized ? <span className="icon-pushpin"></span> : null}
            {menu && (
                <button className="icon-menu" data-key="menu"
                    onClick={menuClick}
                    onMouseDown={mouseDown}>
                    <i className="material-icons">more_vert</i>
                </button>
            )}
        </header>
    );
}

