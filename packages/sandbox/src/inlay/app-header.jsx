import React from 'react';
import cx from 'classnames';
import { registerClass } from '@heswell/inlay';

export class AppHeader extends React.Component {

	render(){

		var className = cx(
			"AppHeader",
			this.props.className
		);


		var {children, path, layoutModel: {computedStyle}, dispatch} = this.props;

		var children = children === null ? [] : Array.isArray(children) ? children : [children];
		var childs = children.map((child,idx) => 
			typeof child.type === 'string'  && child.type[0].match(/[a-z]/)
			// careful not to pass invalid props to simple html elements
			? React.cloneElement(child, {key:idx})

			: React.cloneElement(child, {
				key:idx,
				path : path + '.' + idx,
				dispatch
			}));

		return (
			<div className={className} style={computedStyle}>{childs}</div>
		);
	}

}

export class CustomAppHeader extends React.Component {
	render(){
		return (
			<AppHeader style={this.props.style}>
				<button onClick={this.handleNavigation.bind(this,'BWD')}>Back</button>
				<button onClick={this.handleNavigation.bind(this,'FWD')}>Forward</button>
			</AppHeader>
		);
	}

	handleNavigation(direction){
		this.props.onLayout('navigate',{direction});
	}
}

export function Footer({style={}}){
	return <div className="AppStatus rect-component" style={style}/>;
}

registerClass('AppHeader', AppHeader, true);

