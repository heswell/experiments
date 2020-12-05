import React, { useEffect, useRef } from "react";
import { registerComponent } from "../registry/ComponentRegistry";

import "./Icon.css";

const neverRerender = () => true;

// onClick is temporary until we have a proper Toolbar Field
const CloseIcon = ({ onClick }) => {
  const root = useRef(null);
  useEffect(() => {
    root.current.innerHTML = `
    <svg height="100%" viewBox="0 0 18 18" width="100%">
    <path class="icon-path" d="M13.2425,3.343,9,7.586,4.7575,3.343a.5.5,0,0,0-.707,0L3.343,4.05a.5.5,0,0,0,0,.707L7.586,9,3.343,13.2425a.5.5,0,0,0,0,.707l.707.7075a.5.5,0,0,0,.707,0L9,10.414l4.2425,4.243a.5.5,0,0,0,.707,0l.7075-.707a.5.5,0,0,0,0-.707L10.414,9l4.243-4.2425a.5.5,0,0,0,0-.707L13.95,3.343a.5.5,0,0,0-.70711-.00039Z" />
  </svg>`;
  }, []);

  return <span className="Icon close" ref={root} onClick={onClick} />;
};

export default React.memo(CloseIcon, neverRerender);

registerComponent("CloseIcon", CloseIcon);
