import React, { useCallback, useRef, useState } from "react";
import cx from "classnames";
import "./Splitter.css";

const Splitter = React.memo(function Splitter({
  column,
  index,
  onDrag,
  onDragEnd,
  onDragStart,
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
  const className = cx("Splitter", { active, column });
  return (
    <div
      className={className}
      style={style}
      onMouseDown={handleMouseDown}
    ></div>
  );
});

export default Splitter;
