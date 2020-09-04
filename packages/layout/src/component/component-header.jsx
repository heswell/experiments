import React, {useCallback} from 'react';
import useStyles from '../use-styles';

// import './component-header.css';

const NOOP = () => {}

export default function ComponentHeader({menu = true, style, title, onAction=NOOP, onMouseDown}){
    const menuClick = useCallback(e => onAction('menu', { left: e.clientX, top: e.clientY }),[onAction]);
    const mouseDown = e => e.stopPropagation();
    const {ComponentHeader} = useStyles();
    return (
        <header className={ComponentHeader} onMouseDown={onMouseDown} style={style}>
            <span className="title">{title}</span>
            {menu && (
                <button className="icon-menu" data-key="menu"
                    onClick={menuClick}
                    onMouseDown={mouseDown}>
                    <i className="material-icons">more_vert</i>
                </button>
            )}
        </header>
    );
};

