import React, { createElement, useCallback, useLayoutEffect, useRef, useState } from "react";
import { PopupService } from "../popup-service.js";

import "./context-menu.css";

let subMenuTimeout = null;
let recentlyVacatedMenuPath = null;
let closeTimeout = null;

export const Separator = () => <li className="MenuItem-divider" />;

const ContextMenu = ({
  bottom = "auto",
  left = "100%",
  path,
  right = "auto",
  top = 0,
  ...props
}) => {
  const rootEl = useRef(null);
  const [flipped, flipPlacement] = useState(false);
  const menuState = useRef({
    submenuShowing: false,
    submenuIdx: null,
  })
  const [state, setState] = useState(menuState.current);
  const setMenuState = (arg) => {
    const newState = typeof arg === "function"
      ? arg(menuState.current)
      : arg;
    setState(menuState.current = newState);
  }

  const handleMenuAction = (key, data) => {
    if (props.doAction) {
      props.doAction(key, data);
    } else if (props.onAction) {
      props.onAction(key, data);
    }
    close();
  };

  const handleMenuItemMouseEnter = useCallback((path, hasChildMenuItems) => {
    const keys = path.split('.');
    const idx = parseInt(keys.pop());
    const {submenuIdx, submenuShowing} = menuState.current;
    if (closeTimeout) {
      if (path.startsWith(recentlyVacatedMenuPath)) {
        clearTimeout(closeTimeout);
        closeTimeout = null;
        recentlyVacatedMenuPath = null;
      }
    }

    if (subMenuTimeout) {
      clearTimeout(subMenuTimeout);
      subMenuTimeout = null;
    }

    if (hasChildMenuItems) {
      if (submenuShowing !== true) {
        subMenuTimeout = setTimeout(() => showSubmenu(), 400);
      }
      setMenuState((state) => ({
        ...state,
        submenuIdx: idx,
      }));
    } else if (submenuIdx !== null) {
      setMenuState({
        submenuIdx: null,
        submenuShowing: false,
      });
    }
  }, []);

  const handleMenuItemMouseLeave = useCallback((menuItemPath, hasChildMenuItems) => {
    const keys = menuItemPath.split('.');
    const idx = parseInt(keys.pop());
    const {submenuIdx} = menuState.current;
    if (submenuIdx === idx) {
      recentlyVacatedMenuPath = menuItemPath;
      closeTimeout = setTimeout(() => {
        recentlyVacatedMenuPath = null;
        closeTimeout = null;
        setMenuState((state) =>
          state.submenuIdx === idx ? {
            submenuIdx: null,
            submenuShowing: false,
          } : state
        );
      }, 200)
    }
  }, []);

  const showSubmenu = () => {
    subMenuTimeout = null;
    setMenuState((state) => ({
      ...state,
      submenuShowing: true,
    }));
  };

  const close = () => {
    PopupService.hidePopup();
  };


  useLayoutEffect(() => {
    const { left, right } = rootEl.current.getBoundingClientRect();
    const { clientWidth } = document.body;
    if (right > clientWidth) {
      flipPlacement(true);
    }

  }, [])


  const children = props.children;

  const placement = flipped
    ? { right: '100%', left: 'auto' }
    : { right: 'auto', left: '100%' }
  const style = { position: "absolute", bottom, top, ...placement };
  const submenuIdx = state.submenuShowing ? state.submenuIdx : -1;

  const menuItems = React.Children.map(children,
    (menuItem, idx) =>
      React.cloneElement(menuItem, {
        key: String(idx),
        idx,
        path: `${path ? path + '.' : ''}${idx}`,
        action: menuItem.props.action,
        doAction: handleMenuAction,
        onMouseEnter: handleMenuItemMouseEnter,
        onMouseLeave: handleMenuItemMouseLeave,
        submenuShowing: submenuIdx === idx,
      })
  );

  return (
    <ul className="ContextMenu" role="menu" style={style} tabIndex={0} ref={rootEl}>
      {menuItems}
    </ul>
  )
};

export default ContextMenu;