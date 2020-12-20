import React, { forwardRef, useContext } from "react";
import classnames from "classnames";
import { capitalize } from "../utils";
import { base, icon } from "../style";
import useStyles from "./style";

import IconClassNameContext from "./internal/IconClassNameContext";

const sizes = ["small", "medium", "large"];

/*
  this component relies on the foundation (<brand>.css) file from
  the style package to get the fonticon set.
  however, all applications should be including this
  by default, something to check if nothing is being displayed
  The list of available icons is available on the toolkit site
*/

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
      <span style={base.accessibleText}>
        {getAccessibleString(accessibleText, name)}
      </span>
    );
  }
};

// returns the style tag for character code
const getIconCharStyle = (brand, name, iconStyleName) => {
  if (icon[iconStyleName]) {
    return (
      <style>
        {`.${brand}-icon-${name}:before { content: ${icon[iconStyleName]["&:before"].content}}`}
      </style>
    );
  }
};

const Icon = forwardRef(function Icon(
  {
    accessibleText,
    brand = "jpmuitk",
    className,
    name,
    onClick,
    size: sizeProp = "small",
    ...rest
  },
  ref
) {
  const classes = useStyles();
  const classNameFromContext = useContext(IconClassNameContext);
  const isSize = sizes.indexOf(sizeProp) !== -1;

  // this looks strange but seemed to be the easiest way to achieve the firstUpper
  const iconStyleName = `icon-${name}`.split("-").map(capitalize).join("");

  return (
    <span
      className={classnames(
        `${brand}-wrap-icon`,
        classes.root,
        className,
        isSize && classes[sizeProp],
        classNameFromContext
      )}
      onClick={onClick}
      {...rest}
      ref={ref}
    >
      {getIconCharStyle(brand, name, iconStyleName)}
      <span
        aria-hidden="true"
        className={classnames(`${brand}-icon-${name}`, classes.content)}
        style={!isSize ? { fontSize: `${sizeProp}px` } : undefined}
      />
      {getAccessibleText(accessibleText, brand, name)}
    </span>
  );
});

export default Icon;
