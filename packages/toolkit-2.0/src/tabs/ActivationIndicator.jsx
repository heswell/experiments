import React, { useRef } from "react";
import useActivationIndicator from "./useActivationIndicator";

import "./ActivationIndicator.css";

const ActivationIndicator = ({ tabRef }) => {
  const rootRef = useRef(null);
  const style = useActivationIndicator(rootRef, tabRef);

  return (
    <div className="ActivationIndicator-container" ref={rootRef}>
      <div className="ActivationIndicator" style={style} />
    </div>
  );
};

export default ActivationIndicator;
