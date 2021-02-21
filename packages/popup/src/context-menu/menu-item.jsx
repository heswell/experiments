import React, { createElement, useCallback } from "react";
import cx from 'classnames';
import ContextMenu from "./context-menu";
import "./menu-item.css"

const MenuItem = ({
  action,
  children,
  className,
  data,
  disabled,
  doAction,
  label,
  onMouseEnter,
  onMouseLeave,
  path,
  submenuShowing
}) => {
  const hasChildMenuItems = children && children.length > 0;

  const handleClick = useCallback((e) => {
    e.preventDefault();
    if (disabled !== true) {
      doAction && doAction(action, data);
    }
  }, [disabled, doAction, data]);

  const handleMouseEnter = useCallback(() => {
    onMouseEnter(path, hasChildMenuItems, submenuShowing);
  }, [path, hasChildMenuItems, submenuShowing]);

  const handleMouseLeave = useCallback(() => {
    onMouseLeave(path, hasChildMenuItems, submenuShowing);
  }, [path, hasChildMenuItems, submenuShowing]);

  return (
    <li className={cx("MenuItem", className, { "MenuItem-disabled": disabled})} 
      data-path={path} 
      role="menuitem" 
      aria-haspopup={hasChildMenuItems} 
      aria-expanded={submenuShowing}>
      <button tabIndex={-1} onClick={handleClick} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} >
        <span className="MenuItem-label">{label}</span>
        <i className="material-icons">{hasChildMenuItems ? "navigate_next" : ""}</i>
      </button>
      {submenuShowing
        ? <ContextMenu doAction={doAction} path={path}>{children}</ContextMenu>
        : null}
    </li>
  );
};

export default MenuItem;