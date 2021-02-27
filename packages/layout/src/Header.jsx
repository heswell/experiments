import React from "react";
import classnames from "classnames";
import { Action } from "./layout-action";
import ActionButton from "./ActionButton";
import { useLayoutDispatch } from "./LayoutContext";

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

  const handleMouseDown = (evt) => {
    // do not allow drag to be initiated
    evt.stopPropagation();
  };

  const className = classnames(
    "Header",
    classNameProp
  );

  const orientation = collapsed || orientationProp;

  return (
    <div
      className={className}
      style={{
        justifyContent: orientation === "vertical" ? "flex-start" : "flex-end",
      }}
      orientation={orientation}
      draggable
      showTitle
    >
      {collapsed === false ? (
        <ActionButton
          accessibleText="Minimize View"
          actionId={Action.MINIMIZE}
          iconName="minimize"
          onClick={handleAction}
          onMouseDown={handleMouseDown}
        />
      ) : null}
      {collapsed ? (
        <ActionButton
          accessibleText="Restore View"
          actionId={Action.RESTORE}
          iconName="double-chevron-right"
          onClick={handleAction}
          onMouseDown={handleMouseDown}
        />
      ) : null}
      {expanded === false ? (
        <ActionButton
          accessibleText="Maximize View"
          actionId={Action.MAXIMIZE}
          iconName="maximize"
          onClick={handleAction}
          onMouseDown={handleMouseDown}
        />
      ) : null}
      {expanded ? (
        <ActionButton
          accessibleText="Restore View"
          actionId={Action.RESTORE}
          iconName="restore"
          onClick={handleAction}
          onMouseDown={handleMouseDown}
        />
      ) : null}
      {tearOut ? (
        <ActionButton
          accessibleText="Tear out View"
          actionId={Action.TEAR_OUT}
          iconName="tear-out"
          onClick={handleAction}
          onMouseDown={handleMouseDown}
        />
      ) : null}
      {closeable ? (
        <ActionButton
          accessibleText="Close View"
          actionId={Action.REMOVE}
          iconName="close"
          onClick={handleAction}
          onMouseDown={handleMouseDown}
        />
      ) : null}
    </div>
  );
};

export default Header;
