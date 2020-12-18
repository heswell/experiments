import React, {useRef} from 'react';
import useActivationIndicator from "./useActivationIndicator";

const ActivationIndicator = ({tabRefs, value}) => {
    const rootRef = useRef(null);
    const style = useActivationIndicator(value, rootRef, tabRefs);
    return (
      <div className="ActiveIndicator-container" ref={rootRef}>
        <div className="ActiveIndicator"  style={style} />
      </div>
    )
  }

  export default ActivationIndicator;