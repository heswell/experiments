import React from 'react';
import { ComponentRegistryProvider } from '../registry/component-registry';
// import defaultComponents from './default-components';
import defaultComponents from './mui-components';

import { LayoutRoot } from './layout-root';

const rootWrapper = (LayoutComponent, props) => {
  /// ANTIPATTERN this caused a new Component to be created every render, which caused
  // children to be unmounted and recreated
  // const PureLayout = React.memo(LayoutComponent);
  return (
    <ComponentRegistryProvider components={defaultComponents}>
      <LayoutRoot><LayoutComponent {...props} /></LayoutRoot>
    </ComponentRegistryProvider>

  ) 
  
}

export default rootWrapper;
