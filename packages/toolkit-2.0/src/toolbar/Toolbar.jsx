import React, { useCallback, useRef, useState } from "react";
import cx from "classnames";

import { useLayoutContext } from "@heswell/layout";
import { OverflowMenu, useOverflowObserver } from "../responsive";
import { useDensity } from "../theme";

import * as icon from "@heswell/layout/src/icons";
import { registerComponent } from "@heswell/layout/src/registry/ComponentRegistry";

import "./Toolbar.css";

const capitalize = (str) => str[0].toUpperCase() + str.slice(1);

export const Tooltray = ({ align = "left", children, className }) => {
  return <span className={cx("ToolTray", className, align)}>{children}</span>;
};

const Toolbar = ({
  children,
  className,
  density: densityProp,
  draggable,
  id,
  maxRows: _1,
  orientation = "horizontal",
  showTitle,
  style,
  tools,
  stops,
  getTools = () => tools || React.Children.toArray(children),
  ...rootProps
}) => {
  const root = useRef(null);
  const overflowButton = useRef(null);
  //TODO path is purely  alayout concern
  const { title, dispatch: dispatchViewAction } = useLayoutContext();
  const density = useDensity(densityProp);

  const [innerContainerRef, overflowedItems] = useOverflowObserver(
    orientation,
    "Toolbar"
  );

  const handleOverflowChange = (e, tab) => {
    console.log(`handleOverflowChange`, tab);
  };

  const renderTools = useCallback(
    (items = getTools()) => {
      const tools = items.map((tool, index) => {
        if (Array.isArray(tool)) {
          return (
            <span className="ToolTray" key={index}>
              {renderTools(tool)}
            </span>
          );
        } else if (React.isValidElement(tool)) {
          return React.cloneElement(tool, {
            "data-index": index,
            "data-priority": 2,
            onClick: tool.props.action
              ? () => {
                  dispatchViewAction(tool.props.action);
                }
              : tool.props.onClick,
          });
        } else {
          const Icon = icon[`${capitalize(tool)}Icon`];
          return <Icon key={index} />;
        }
      });

      return tools.concat(
        <OverflowMenu
          className="Toolbar-overflowMenu"
          data-priority={1}
          data-index={tools.length - 1}
          data-overflow-indicator
          key="overflow"
          onChange={handleOverflowChange}
          ref={overflowButton}
          source={overflowedItems}
        />
      );
    },
    [dispatchViewAction, getTools]
  );

  const renderTitle = () => {
    return <span className="toolbar-title">{title}</span>;
  };

  // useDraggable
  const handleMouseDown = (e) => {
    if (draggable) {
      console.log(`Toolbar handleMouseDown`);
      dispatchViewAction({ type: "mousedown" }, e);
    }
  };

  return (
    <div
      {...rootProps}
      id={id}
      // breakPoints={stops}
      className={cx(
        "Toolbar",
        `Toolbar-${density}Density`,
        `Toolbar-${orientation}`,
        className
      )}
      ref={root}
      onMouseDown={handleMouseDown}
      // onResize={setSize}
      style={style}
    >
      <div className="Toolbar-inner" ref={innerContainerRef}>
        {showTitle ? renderTitle() : null}
        {renderTools()}
      </div>
    </div>
  );
};

export default Toolbar;

registerComponent("Toolbar", Toolbar);
