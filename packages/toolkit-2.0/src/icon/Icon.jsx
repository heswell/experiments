import React, { forwardRef, useContext } from "react";
import PropTypes from "prop-types";
import classnames from "classnames";

import IconClassNameContext from "./IconClassNameContext";

import "./Icon.css";

const sizes = ["small", "medium", "large"];

// get the string passed as either the new accessibleText prop or
// as human readable name of the icon
const getAccessibleString = (accessibleText, name) => {
  if (typeof accessibleText === "boolean") {
    if (accessibleText) {
      return name;
    }
  } else {
    return accessibleText;
  }
};

// return the accessible text element with hiddenStyle props
const getAccessibleText = (accessibleText, brand, name) => {
  if (accessibleText) {
    return (
      <span className="accessibleText">
        {getAccessibleString(accessibleText, name)}
      </span>
    );
  }
};

getAccessibleText.propTypes = {
  accessibleText: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  brand: PropTypes.string,
  name: PropTypes.string,
};

const Icon = forwardRef(function Icon(
  {
    accessibleText,
    brand = "jpmuitk",
    className,
    classes,
    name,
    size: sizeProp = "small",
    ...rest
  },
  ref
) {
  const isSize = sizes.indexOf(sizeProp) !== -1;
  const classNameFromContext = useContext(IconClassNameContext);

  return (
    <span
      className={classnames(
        "Icon",
        `${brand}-wrap-icon`,
        className,
        isSize && sizeProp,
        classNameFromContext
      )}
      {...rest}
      ref={ref}
    >
      <span
        aria-hidden="true"
        className={classnames(`${brand}-icon-${name}`, "Icon-content")}
        style={!isSize ? { fontSize: `${sizeProp}px` } : undefined}
      />
      {getAccessibleText(accessibleText, brand, name)}
    </span>
  );
});

Icon.propTypes = {
  /**
   * Used to include HAT (hidden accessible text)
   * Defaults to icon name if used without value
   * will be set to custom HAT text if passed a string
   */
  accessibleText: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  /**
   * Prefix for icon classes
   */
  brand: PropTypes.string,
  /**
   * The className(s) of the component
   */
  className: PropTypes.string,
  /**
   * material-ui
   * Useful to extend the style applied to components.
   */
  classes: PropTypes.objectOf(PropTypes.string),
  /**
   * Name of the icon.
   * See go/uitoolkit -> Documentation -> Iconography
   */
  name: PropTypes.string.isRequired,
  /**
   * On click event handler
   */
  onClick: PropTypes.func,
  /**
   * Size of the icon, explicit size or small/medium/large
   */
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf(sizes)]),
};

export default Icon;
