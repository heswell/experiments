import React from "react";
import { createUseStyles } from "react-jss";
import escapeRegExp from "escape-string-regexp";

export const useStyles = createUseStyles(
  (theme) => {
    const { typography } = theme.toolkit;
    return {
      highlight: typography.getFace("bold"),
    };
  },
  { name: "Highlighter" }
);

const Highlighter = (props) => {
  const { matchPattern, text = "" } = props;
  const classes = useStyles();
  const matchRegex =
    typeof matchPattern === "string"
      ? new RegExp(`(${escapeRegExp(matchPattern)})`, "gi")
      : matchPattern;
  return (
    <>
      {text.split(matchRegex).map((part, index) =>
        part.match(matchRegex) ? (
          <strong className={classes.highlight} key={`${index}-${part}`}>
            {part}
          </strong>
        ) : (
          part
        )
      )}
    </>
  );
};

export default Highlighter;
