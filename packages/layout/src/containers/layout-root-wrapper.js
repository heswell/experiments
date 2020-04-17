import React from 'react';
import { ComponentRegistryProvider } from '../registry/component-registry';
// import defaultComponents from './default-components';
import defaultComponents from './mui-components';

import { LayoutRoot } from './layout-root';

const rootWrapper = (LayoutComponent, props) => {
  const PureLayout = React.memo(LayoutComponent);
  return (
    <ComponentRegistryProvider components={defaultComponents}>
      <LayoutRoot><PureLayout {...props} /></LayoutRoot>
    </ComponentRegistryProvider>

  ) 
  
}

export default rootWrapper;
