import React, { useCallback } from 'react';
import useStyles from '../use-styles';

const NOOP = () => { }

export function renderHeader(props, {dispatch, onAction, onMouseDown}, layoutModel = props.layoutModel) {
    const { header } = layoutModel;
    if (header) {
        const {header: {component: Component}, title} = props;
        // TODO ComponentRegistry ?
        const Header = Component || ComponentHeader;
        return (
            <Header
                dispatch={dispatch}
                // should we really be doing this - it's really just for the design time header, maybe Context ?
                layoutModel={layoutModel}
                title={`${title}`}
                onAction={onAction}
                onMouseDown={onMouseDown}
                style={header.style}
                menu={header.menu} />
        )

    } else {
        return null;
    }
}


export default function ComponentHeader({ menu = true, style, title, onAction = NOOP, onMouseDown }) {
    const menuClick = useCallback(e => onAction('menu', { left: e.clientX, top: e.clientY }), [onAction]);
    const mouseDown = e => e.stopPropagation();
    const { ComponentHeader } = useStyles();
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

