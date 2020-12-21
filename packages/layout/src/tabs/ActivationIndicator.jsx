import React, { useRef } from "react";
import useActivationIndicator from "./useActivationIndicator";

const ActivationIndicator = ({ tabRef }) => {
  const rootRef = useRef(null);
  const style = useActivationIndicator(rootRef, tabRef);

  return (
    <div className="ActiveIndicator-container" ref={rootRef}>
      <div className="ActiveIndicator" style={style} />
    </div>
  );
};

export default ActivationIndicator;
