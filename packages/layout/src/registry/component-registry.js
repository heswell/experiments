
import React from 'react';

//TODO how do we make all this dynamic

const registry = new Map();

const Registry = {
  registerAll(components){
    components.forEach(([componentId, component]) => {
      this.register(componentId, component);
    })
  },

  register(componentId, component){
    if (registry.has(componentId)){
      console.log(`componentId ${componentId} already registered`);
    } else {
      registry.set(componentId, component)
    }
  },

  get(componentId){
    return registry.get(componentId);
  }
}

const ComponentRegistryContext = React.createContext(null);

/** @type {ComponentRegistryProvider} */
export const ComponentRegistryProvider = ({components=[], children}) => {
  Registry.registerAll(components);
  return React.createElement(ComponentRegistryContext.Provider,{ value: Registry }, children);
}

export const useComponentRegistry = (componentId, component) => {
  const context = React.useContext(ComponentRegistryContext);
  if (context === undefined){
    throw new Error('useComponentRegistry must be used within a ComponentRegistryContext');
  }
  if (component !== undefined){
    context.register(componentId, component);
  } else {
    const c = context.get(componentId);
    if (c === undefined){
      throw new Error(`no component for componentId ${componentId} in ComponentRegistry`);
    } else {
      return c;
    }
  }
}
