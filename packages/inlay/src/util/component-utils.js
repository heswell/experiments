import React from 'react';
import {uuid} from '@heswell/utils';

import shallowCloneObject from './shallowCloneObject';
import {isContainer} from '../componentRegistry';

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

//TODO components should be able to register props here
const LayoutProps = {
	resizeable: true,
	header: true,
	title: true,
	active: true,
	tabstripHeight: true,
	dragStyle: true
}

function layoutProps({props}){
	const results = {};
	Object.entries(props).forEach(([key, value]) => {
			if (LayoutProps[key]){
					results[key] = value;
			}
	})
	return results;
}


export const getLayoutModel = (component) => ({
	type: typeOf(component),
	$id: component.props.id || uuid(),
	...layoutProps(component),
	style: component.props.style,
	children: isLayout(component) ? getLayoutModelChildren(component) : []
})

function getLayoutModelChildren(component){
	var {children, contentModel=null} = component.props;
	// TODO don't recurse into children of non-layout
	if (React.isValidElement(children)){
			return [getLayoutModel(children)];
	} else if (Array.isArray(children)){
			return children.filter(child => child).map(child => getLayoutModel(child));
	} else if (contentModel !== null){
			return [contentModel];
	} else {
			return []; // is this safe ?
	}
}

export function isLayout(element){
	if (typeof element !== 'string'){
			element = (element.type && element.type.displayName) ||
					(element.constructor && element.constructor.displayName);
	}
	return isContainer(element);
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


	var json = { type, id: uuid(), flexDirection};

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
