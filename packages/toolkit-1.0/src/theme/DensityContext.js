import { createContext } from 'react';

const DEFAULT_DENSITY = 'medium';

const DensityContext = createContext(DEFAULT_DENSITY);

export const {
  Consumer: DensityConsumer,
  Provider: DensityProvider
} = DensityContext;

export default DensityContext;
