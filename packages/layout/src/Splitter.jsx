import React, { useCallback, useRef, useState } from "react";
import cx from "classnames";
import { Action } from "./layout-action";

import "./Splitter.css";

const Splitter = React.memo(function Splitter({
  column,
  dispatch,
  index,
  onDrag,
  onDragEnd,
  onDragStart,
  // We only need the layout path, so it can be reported with the focus events
  path,
  style
}) {
  const lastPos = useRef(null);
  const [active, setActive] = useState(false);

  const handleMouseMove = useCallback(
    (e) => {
      const pos = e[column ? "clientY" : "clientX"];
      const diff = pos - lastPos.current;
      // we seem to get a final value of zero
      if (pos && pos !== lastPos.current) {
        onDrag(index, diff);
      }
      lastPos.current = pos;
    },
    [column, index, onDrag]
  );

  const handleMouseUp = useCallback(
    (e) => {
      window.removeEventListener("mousemove", handleMouseMove, false);
      window.removeEventListener("mouseup", handleMouseUp, false);
      onDragEnd();
      setActive(false);
    },
    [handleMouseMove, onDragEnd, setActive]
  );

  const handleMouseDown = useCallback(
    (e) => {
      lastPos.current = column ? e.clientY : e.clientX;
      onDragStart(index);
      window.addEventListener("mousemove", handleMouseMove, false);
      window.addEventListener("mouseup", handleMouseUp, false);
      e.preventDefault();
      setActive(true);
    },
    [column, handleMouseMove, handleMouseUp, index, onDragStart, setActive]
  );

  const handleKeyDown = ({key, shiftKey}) => {
    // TODO calc max distance
    const distance = shiftKey ? 10 : 1;
    if (column && key === 'ArrowDown'){
      onDrag(index, distance);
    } else if (column && key === 'ArrowUp'){
      onDrag(index, -distance);
    } else if (!column && key === 'ArrowLeft'){
      onDrag(index, -distance);
    } else if (!column && key === 'ArrowRight'){
      onDrag(index, distance);
    }
  }

  const handleFocus = (e) => {
    // THis might be overkill - maybe wait until drag actually starts
    onDragStart(index);
    dispatch({
      type: Action.FOCUS_SPLITTER,
      path,
      index
    });
  }

  const handleBlur = (e) => {
    dispatch({
      type: Action.BLUR_SPLITTER,
      relatedTarget: e.relatedTarget
    });
  }

  const className = cx("Splitter", { active, column });
  return (
    <div
      className={className}
      role="separator"
      style={style}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      onMouseDown={handleMouseDown}
      tabIndex={0}
    ></div>
  );
});

export default Splitter;
