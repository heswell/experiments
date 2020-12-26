import React, { forwardRef } from "react";
import { useDensity } from "../theme";
import { useControlled } from "../utils";
import classnames from "classnames";

import "./Input.css";

const Input = forwardRef(
  (
    {
      className: classNameProp,
      defaultValue,
      density: densityProp,
      inputProps,
      style,
      value: valueProp,
      onBlur,
      onChange,
      onFocus,
      onKeyDown,
    },
    ref
  ) => {
    const density = useDensity(densityProp);
    const [focused, setFocused] = React.useState(false);

    const [value, setValue, isControlled] = useControlled({
      controlled: valueProp,
      default: defaultValue,
      name: "Input",
      state: "value",
    });

    const handleChange = (evt) => {
      const value = evt.target.value;
      if (!isControlled) {
        setValue(value);
      }
      onChange && onChange(evt, value);
    };

    const handleFocus = (event) => {
      if (onFocus) {
        onFocus(event);
      }
      // formcontrol logic required
      setFocused(true);
    };

    const handleBlur = (event) => {
      if (onBlur) {
        onBlur(event);
      }
      // formcontrol logic required
      setFocused(false);
    };

    const className = classnames(
      "Input",
      classNameProp,
      `Input-${density}Density`,
      {
        "Input-focused": focused,
      }
    );

    const inputClassName = classnames("Input-input", inputProps?.className);

    return (
      <div className={className} style={style}>
        <input
          {...inputProps}
          className={inputClassName}
          ref={ref}
          type="text"
          value={value}
          onBlur={handleBlur}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          onFocus={handleFocus}
        />
      </div>
    );
  }
);

export default Input;
