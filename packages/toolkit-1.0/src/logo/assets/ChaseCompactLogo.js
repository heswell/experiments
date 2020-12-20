import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

const dimensionsForDensity = {
  high: { width: 13, height: 12 },
  medium: { width: 17, height: 18 },
  low: { width: 19, height: 18 },
  touch: { width: 21, height: 20 }
};

const ChaseCompactLogo = forwardRef(function ChaseCompactLogo(
  { className = 'chase-logo', density, ...rest },
  ref
) {
  return (
    <svg
      className={className}
      role="img"
      viewBox="0 0 1020 1025"
      x="0px"
      y="0px"
      {...dimensionsForDensity[density]}
      {...rest}
      aria-labelledby="chase-compact-logo-graphic"
      ref={ref}
    >
      <title id="chase-compact-logo-graphic">CHASE</title>
      <g>
        <path d="M384,71c-17.3,0-31.4,14-31.4,31.4v220h581.1L669.1,71L384,71z" />
        <path d="M955,388.9c0-17.3-14-31.4-31.4-31.4H703.7v581.1l251.2-264.7L955,388.9z" />
        <path d="M637,959.7c17.3,0,31.3-14,31.3-31.4V708.4H87.2l264.6,251.3L637,959.7z" />
        <path d="M66,641.9c0,17.3,14.1,31.4,31.4,31.4h220V92.2L66,356.8L66,641.9z" />
      </g>
    </svg>
  );
});

ChaseCompactLogo.propTypes = {
  className: PropTypes.string,
  density: PropTypes.oneOf(['touch', 'low', 'medium', 'high'])
};

export default ChaseCompactLogo;
