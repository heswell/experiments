import React from 'react';
import { useComponentRegistry } from './component-registry';

export type ComponentRegistryProvider = React.FC;
export declare const ComponentRegistryProvider: ComponentRegistryProvider;

export type useComponentRegistry = (componentId: string, component?: React.FC) => React.RC | undefined;
declare const useComponentRegistry: useComponentRegistry;

