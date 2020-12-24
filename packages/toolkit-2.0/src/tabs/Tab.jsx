// TODO close button needs to be a butotn. Hence tab needs to include 2 buttons
import React, { forwardRef, useRef, useState } from "react";
import cx from "classnames";
import { useDensity } from "../theme";
import { useForkRef } from "../utils";
import { useViewAction } from "@heswell/layout";
import { Button } from "../button";
import { Icon } from "../icon";

import "./Tab.css";

const CloseTabButton = ({ small = false, tabIndex, title, ...rest }) => (
  <Button
    className="Tab-closeButton"
    component="div"
    tabIndex={tabIndex}
    title={title}
    variant="secondary"
    {...rest}
  >
    <Icon
      accessibleText="Close Tab (Delete or Backspace)"
      name={small ? "close-small" : "close"}
    />
  </Button>
);

const Tab = forwardRef(
  (
    {
      ariaControls,
      deletable,
      density: densityProp,
      draggable,
      selected,
      index,
      label,
      onClick,
      onDelete,
      onKeyDown,
      onKeyUp,
      ...props
    },
    ref
  ) => {
    const root = useRef(null);
    const setRef = useForkRef(ref, root);
    const [closeHover, setCloseHover] = useState(false);
    const dispatchViewAction = useViewAction();
    const density = useDensity(densityProp);

    const handleClick = (e) => {
      e.preventDefault();
      onClick(e, index);
    };
    const handleKeyDown = (e) => {
      onKeyDown(e, index);
    };
    const handleKeyUp = (e) => {
      switch (e.key) {
        case "Delete":
          if (deletable) {
            e.stopPropagation();
            onDelete(e, index);
          }
          break;
        default:
          onKeyUp(e, index);
      }
    };

    const handleCloseButtonClick = (e) => {
      e.stopPropagation();
      onDelete(e, index);
    };

    const handleCloseButtonEnter = () => {
      setCloseHover(true);
    };

    const handleCloseButtonLeave = () => {
      setCloseHover(false);
    };

    const handleMouseDown = (e) => {
      if (draggable) {
        // TODO don't bake this into tab
        dispatchViewAction({ type: "mousedown", index }, e);
      }
    };

    // TODO is it ok for the close button to be a span ?
    // button cannot be nested within button. toolkit
    // uses side-by-side buttons
    return (
      <button
        {...props}
        aria-controls={ariaControls}
        aria-selected={selected}
        className={cx("Tab", `Tab-${density}Density`, {
          "Tab-selected": selected,
          "Tab-closeable": deletable,
          "Tab-closeHover": closeHover,
        })}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onMouseDown={handleMouseDown}
        ref={setRef}
        role="tab"
        tabIndex={selected ? undefined : -1}
      >
        <span className="tab-text" data-text={label} role="button">
          {label}
        </span>
        {deletable ? (
          <CloseTabButton
            onClick={handleCloseButtonClick}
            onMouseEnter={handleCloseButtonEnter}
            onMouseLeave={handleCloseButtonLeave}
            small={density === "medium" || density === "high"}
          />
        ) : null}
      </button>
    );
  }
);

export default Tab;
