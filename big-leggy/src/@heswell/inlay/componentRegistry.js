const _containers = {};

export const ComponentRegistry = {};

export function isContainer(className){
    return _containers[className] === true;
}

export function registerClass(className, component, isContainer){
    ComponentRegistry[className] = component;

    if (isContainer){
        _containers[className] = true;
    }
}
