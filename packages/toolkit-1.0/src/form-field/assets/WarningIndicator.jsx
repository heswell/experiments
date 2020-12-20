import React from "react";

const sizeByDensity = {
  high: 3,
  medium: 5,
  low: 5,
  touch: 7
};

const WarningIndicator = ({ className, density }) => {
  const size = sizeByDensity[density];

  // e.g. medium = 0,5 5,5 5,0
  const points = `0,${size} ${size},${size} ${size},0`;
  return (
    <svg className={className} focusable={false} height={size} width={size}>
      <polygon points={points} />
    </svg>
  );
};

export default WarningIndicator;
