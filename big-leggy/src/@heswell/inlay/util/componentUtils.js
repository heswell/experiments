import React from 'react';

import shallowCloneObject from './shallowCloneObject';
const UUID = require('pure-uuid');

export function typeOf(element){

	var type;



	if (typeof element.type === 'function'){
		type = element.type.displayName || element.type.name; 
	}  
	else if (typeof element.type === 'string'){
		type = element.type;
	}
	else if (element.constructor){
		type = element.constructor.displayName; 
	}
	else {
		debugger;
	}

	return type;

}



export function JSONfromComponent(component, parent, ignoreChildren){

	var props = component.props;
	var type;
	var flexDirection;

	if (parent != null){
	
		// var parentType = (parent.type || parent.constructor).displayName;
		
		// var flexDirection = parent.props.flexDirection;

		// var dim = flexDirection === 'row' ? 'width' : 'height';

	}
	
	if (typeof component.type === 'function'){
		type = component.type.displayName || component.type.name; 
	}  
	else if (typeof component.type === 'string'){
		type = component.type;
	}
	else if (component.constructor){
		type = component.constructor.displayName; 
	}
	else {
		debugger;
	}


	var json = { type, id: new UUID(1), flexDirection};

	// var props = component.props;
	var propertyNames = Object.getOwnPropertyNames(props);

	propertyNames.forEach(property => {

		if (property === 'children' && ignoreChildren !== true){
			var content = json.content = [];
			React.Children.forEach(props.children, child => 
				content.push(JSONfromComponent(child,component))
			);
		}
		else if (property === 'style'){
			json.style = shallowCloneObject(props.style);
		}
		else if (isSimpleType(typeof props[property])){
			json[property] = props[property];
		}
		// EXPERIMENT
		else if (Array.isArray(props[property])){
			json[property] = props[property];
		}
		else if (typeof props[property] === 'function'){
			console.log('How do we deal with function props like ' + property);
			json[property] = props[property];
		}
	});

	return json;
}

function isSimpleType(type){
	return type === 'string' || type === 'number' || type === 'boolean';
}

// function isLayoutType(type){
// 	return type === 'FlexBox' || type === 'TabbedContainer';
// }
