import React from "react";

export const Necessity = {
  OPTIONAL: "optional",
  REQUIRED: "required"
};

export const NecessityStyle = {
  FULL: "full",
  ABBREVIATED: "abbreviated"
};

const NecessityIndicator = ({
  required,
  necessityStyle,
  displayedNecessity,
  className
}) => {
  let necessityText = "";

  if (required && displayedNecessity === Necessity.REQUIRED) {
    necessityText = `(${
      necessityStyle === NecessityStyle.ABBREVIATED ? "Req" : "Required"
    })`;
  } else if (!required && displayedNecessity === Necessity.OPTIONAL) {
    necessityText = `(${
      necessityStyle === NecessityStyle.ABBREVIATED ? "Opt" : "Optional"
    })`;
  }

  if (necessityText) {
    return (
      <span className={className} data-jpmui-test="necessity-indicator">
        {necessityText}
      </span>
    );
  }
  return null;
};

export default NecessityIndicator;
