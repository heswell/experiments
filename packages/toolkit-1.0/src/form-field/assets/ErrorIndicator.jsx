import React from "react";

const sizeByDensity = {
  high: 3,
  medium: 5,
  low: 5,
  touch: 7
};

const ErrorIndicator = ({ className, density = "medium" }) => {
  const size = sizeByDensity[density];
  const circleSize = size / 2;

  return (
    <svg className={className} focusable={false} height={size} width={size}>
      <circle cx={circleSize} cy={circleSize} r={circleSize} />
    </svg>
  );
};

export default ErrorIndicator;
