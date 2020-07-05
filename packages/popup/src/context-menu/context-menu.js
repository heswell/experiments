import React, {createElement, useEffect, useState} from 'react';
import cx from 'classnames';
import { PopupService } from '../popup-service.js';
import useStyles from './use-context-menu-style';

let subMenuTimeout = null;

export const MenuItem = (props) => {

    const hasChildMenuItems = props.children && props.children.length > 0;

    const handleClick = (e) => {
        e.preventDefault();
        if (props.disabled !== true) {
            props.doAction(props.action, props.data);
        }
    }

    const handleMouseOver = () => {
        props.onMouseOver(props.idx, hasChildMenuItems, props.submenuShowing);
    }

    const nestedMenu = props.submenuShowing
        ? createElement(ContextMenu, {doAction: props.doAction}, props.children)
        : null;

    const {classes} = props;    
    const className = cx(
        classes.MenuItem, {
            [classes.disabled]: props.disabled,
            [classes.root]: hasChildMenuItems,
            [classes.showing]: props.submenuShowing
        }
    );
     
    return createElement('li', {className},
        createElement('button', {tabIndex: -1, onClick: handleClick, onMouseOver: handleMouseOver},
            createElement('span', {className: classes.MenuLabel}, props.label),
            createElement('i', {className: 'material-icons'}, hasChildMenuItems ? 'arrow_right' : '')
        ),
        nestedMenu
    )
}

export const Separator = () => createElement('li', {className:'divider'});

export const ContextMenu = ({bottom='auto', left='100%', top=0, ...props}) => {

    const [state, setState] = useState({
        submenuShowing: false,
        submenuIdx: null
    })

    const handleMenuAction = (key, data) => {
        if (props.doAction) {
            props.doAction(key, data);
        } else if (props.onAction) {
            props.onAction(key, data);
        }
        close();
    }

    const handleMenuItemMouseOver = (idx, hasChildMenuItems) => {

        if (subMenuTimeout) {
            clearTimeout(subMenuTimeout);
            subMenuTimeout = null;
        }

        if (hasChildMenuItems) {
            if (state.submenuShowing !== true) {
                subMenuTimeout = setTimeout(() => showSubmenu(), 400);
            }
            setState(state => ({
                ...state,
                submenuIdx: idx
            }));
        } else if (state.submenuIdx !== null) {
            setState({
                submenuIdx: null,
                submenuShowing: false
            });
        }
    }

    const showSubmenu = () => {
        subMenuTimeout = null;
        setState(state => ({
            ...state,
            submenuShowing: true
        }));
    }

    const close = () => {
        PopupService.hidePopup();
    }

    const children = props.children;
    const style = { position: 'absolute', top, left, bottom };
    const submenuIdx = state.submenuShowing ? state.submenuIdx : -1;
    const classes = useStyles();

    const menuItems = children ? children.map((menuItem, idx) => React.cloneElement(menuItem, {
        classes,
        key: String(idx),
        idx,
        action: menuItem.props.action,
        doAction: handleMenuAction,
        onMouseOver: handleMenuItemMouseOver,
        submenuShowing: submenuIdx === idx

    })) : null;

    return createElement('ul', {className: classes.ContextMenu, style}, menuItems);

}
