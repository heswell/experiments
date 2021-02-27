import React from "react";
import classnames from "classnames";

const Close = ({ className, ...props }) => (
  <button
    {...props}
    className={classnames("CloseButton", className)}
    title="Close View"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12">
      <rect fill="#ff13dc" opacity="0" width="12" height="12" /><path d="M11.69673,10.28266,7.41406,6l4.28267-4.28266A.9999.9999,0,1,0,10.28266.30327L6,4.58594,1.71734.30327A.9999.9999,0,1,0,.30327,1.71734L4.58594,6,.30327,10.28266a.9999.9999,0,1,0,1.41407,1.41407L6,7.41406l4.28266,4.28267a.9999.9999,0,1,0,1.41407-1.41407Z" />
    </svg>
</button>
);

export default Close;

