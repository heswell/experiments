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

export function typeOf(element){

	let type;
	
	if (element){
		if (typeof element.type === 'function' || typeof element.type === 'object'){
			type = element.type.displayName || element.type.name; 
		} else if (typeof element.type === 'string'){
			type = element.type;
		}else if (element.constructor){
			type = element.constructor.displayName; 
		} else {
			debugger;
		}	
	}

	return type;

}

export function isLayout(element){
	if (typeof element !== 'string'){
			element = (element.type && element.type.name) ||
					(element.type && element.type.displayName) ||
					(element.constructor && element.constructor.displayName);
	}
	return isContainer(element);
}

const EMPTY_OBJECT = {};

export function getDefaultProps({type}){
	if (typeof type === 'function' && type.prototype.isReactComponent){
		return type.defaultProps;
	}
	return EMPTY_OBJECT;
}
