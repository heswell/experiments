import React, { useRef } from "react";
import classnames from "classnames";
import useActivationIndicator from "./useActivationIndicator";

import "./ActivationIndicator.css";

const ActivationIndicator = ({ orientation = "horizontal", tabRef }) => {
  const rootRef = useRef(null);
  const style = useActivationIndicator(rootRef, tabRef, orientation);

  return (
    <div
      className={classnames(
        "ActivationIndicator-container",
        `ActivationIndicator-${orientation}`
      )}
      ref={rootRef}
    >
      <div className="ActivationIndicator" style={style} />
    </div>
  );
};

export default ActivationIndicator;
