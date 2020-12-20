import { useContext } from 'react';

import DensityContext from './DensityContext';

/**
 * `useDensity` merges density value from 'DensityContext` with the one from component's props.
 *
 * @param {string} density
 */
export default function useDensity(density) {
  const densityFromContext = useContext(DensityContext);
  return density || densityFromContext;
}
