import React, { useLayoutEffect, useRef, useState } from "react";
import classnames from "classnames";
import { useDensity } from "../theme";
import { Input } from "../input";

import "./EditableLabel.css";

const EditableLabel = ({
  className: classNameProp,
  density: densityProp,
  onEnterEditMode,
  onExitEditMode,
  value: valueProp,
}) => {
  const inputRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const isEditing = useRef(false);
  const [value, setValue] = useState(valueProp);
  const density = useDensity(densityProp);

  useLayoutEffect(() => {
    if (editing) {
      inputRef.current.select();
      inputRef.current.focus();
    }
  }, [editing, inputRef]);

  const className = classnames(
    "EditableLabel",
    classNameProp,
    `EditableLabel-${density}Density`
  );

  const enterEditMode = (evt) => {
    if (!isEditing.current) {
      setEditing((isEditing.current = true));
      onEnterEditMode && onEnterEditMode(evt);
    }
  };

  const exitEditMode = (evt) => {
    if (isEditing.current) {
      setEditing((isEditing.current = false));
      onExitEditMode && onExitEditMode(evt, value);
    }
  };

  const handleChange = (evt) => {
    setValue(evt.target.value);
  };

  const handleDoubleClick = (evt) => {
    enterEditMode(evt);
  };

  const handleBlur = (evt) => {
    exitEditMode(evt);
  };

  const handleKeyDown = (evt) => {
    if (evt.key === "Enter") {
      exitEditMode(evt);
    } else if (evt.key === "ArrowRight" || evt.key === "ArrowLeft") {
      evt.stopPropagation();
    } else if (evt.key === "Escape") {
      // TODO restore original value
      exitEditMode(evt);
    }
  };

  return editing ? (
    <Input
      className={classnames(className, "EditableLabel-editing")}
      inputProps={{ className: "EditableLabel-input" }}
      value={value}
      onBlur={handleBlur}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      ref={inputRef}
      style={{ padding: 0 }}
    />
  ) : (
    <span className={className} onDoubleClick={handleDoubleClick}>
      {value}
    </span>
  );
};

export default EditableLabel;
