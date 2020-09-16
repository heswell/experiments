
import React from 'react';
import defaultComponents from '../containers/default-components';

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
  if (context){
    if (component !== undefined){
      context.register(componentId, component);
    } else {
      const c = context.get(componentId);
      if (c){
        return c;
      }
    }
  }

  const defaultComponent = defaultComponents[componentId];
  if (defaultComponent){
    return defaultComponent;
  }

  if (context){
    throw new Error(`no default component for componentId ${componentId} and no such component registered with ComponentRegistry context`);
  } else {
    throw new Error(`no default component for componentId ${componentId} and no ComponentRegistry context`);
  }

}
