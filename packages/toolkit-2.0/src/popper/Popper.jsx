import React from "react";
import ReactDOM from "react-dom";

import { usePopper } from "react-popper";
const Popper = ({
  anchorEl,
  children,
  className,
  offsetY = 0,
  open,
  placement = "bottom-start",
}) => {
  const [popperElement, setPopperElement] = React.useState(null);
  const { styles, attributes } = usePopper(anchorEl, popperElement, {
    placement,
    modifiers: {
      name: "offset",
      options: {
        offset: [0, offsetY],
      },
    },
  });

  if (!open) {
    return null;
  }
  return ReactDOM.createPortal(
    <div
      className={className}
      ref={setPopperElement}
      style={{ ...styles.popper }}
      {...attributes.popper}
    >
      {children}
    </div>,
    document.body
    // document.querySelector('#destination')
  );
};

export default Popper;
