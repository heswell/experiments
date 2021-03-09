import React from "react";
import classnames from "classnames";
import { Action } from "./layout-action";
import ActionButton from "./ActionButton";
import { useLayoutDispatch } from "./LayoutContext";
import {CloseButton} from "./action-buttons";

import "./Header.css";

const Header = ({
  className: classNameProp,
  collapsed,
  expanded,
  closeable,
  orientation: orientationProp,
  style,
  tearOut,
  title,
}) => {
  const layoutDispatch = useLayoutDispatch();
  const handleAction = (evt, actionId) => layoutDispatch({ type: actionId });
  const handleClose = () => layoutDispatch({ type: Action.REMOVE });
  const classBase = "hwHeader";

  const handleMouseDown = (e) => {
    layoutDispatch({ type: 'mousedown' }, e);
  };

  const handleButtonMouseDown = (evt) => {
    // do not allow drag to be initiated
    evt.stopPropagation();
  };

  const className = classnames(
    classBase,
    classNameProp,
    `${classBase}-${orientation}`
  );

  const orientation = collapsed || orientationProp;

  return (
    <div
      className={className}
      style={style}
      orientation={orientation}
      onMouseDown={handleMouseDown}
      draggable
    >
      {title ? (
        <span className={`${classBase}-title`}>{title}</span>
      ) : null
      }  
      {collapsed === false ? (
        <ActionButton
          accessibleText="Minimize View"
          actionId={Action.MINIMIZE}
          iconName="minimize"
          onClick={handleAction}
          onMouseDown={handleButtonMouseDown}
        />
      ) : null}
      {collapsed ? (
        <ActionButton
          accessibleText="Restore View"
          actionId={Action.RESTORE}
          iconName="double-chevron-right"
          onClick={handleAction}
          onMouseDown={handleButtonMouseDown}
        />
      ) : null}
      {expanded === false ? (
        <ActionButton
          accessibleText="Maximize View"
          actionId={Action.MAXIMIZE}
          iconName="maximize"
          onClick={handleAction}
          onMouseDown={handleButtonMouseDown}
        />
      ) : null}
      {expanded ? (
        <ActionButton
          accessibleText="Restore View"
          actionId={Action.RESTORE}
          iconName="restore"
          onClick={handleAction}
          onMouseDown={handleButtonMouseDown}
        />
      ) : null}
      {tearOut ? (
        <ActionButton
          accessibleText="Tear out View"
          actionId={Action.TEAR_OUT}
          iconName="tear-out"
          onClick={handleAction}
          onMouseDown={handleButtonMouseDown}
        />
      ) : null}
      {closeable ? (
        <CloseButton
          UNSAFE_className={`${classBase}-button`}
          accessibleText="Close View"
          onPress={handleClose}
          onMouseDown={handleButtonMouseDown}
        />
      ) : null}
    </div>
  );
};

export default Header;
