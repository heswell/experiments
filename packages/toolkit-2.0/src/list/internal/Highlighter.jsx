import React from "react";
import escapeRegExp from "escape-string-regexp";

import "./Highlighter.css";

const Highlighter = (props) => {
  const { matchPattern, text = "" } = props;
  const matchRegex =
    typeof matchPattern === "string"
      ? new RegExp(`(${escapeRegExp(matchPattern)})`, "gi")
      : matchPattern;
  return (
    <>
      {text.split(matchRegex).map((part, index) =>
        part.match(matchRegex) ? (
          <strong className="Highlighter-highlight" key={`${index}-${part}`}>
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
