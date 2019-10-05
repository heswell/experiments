import React from 'react';
import cx from 'classnames';

export class AppHeader extends React.Component {

	render(){

		var className = cx(
			"AppHeader",
			this.props.className
		);

		var style ={
			backgroundColor: 'rgb(90,90,90)',
			height: this.props.height
		};

		var {children, path} = this.props;

		var children = children === null ? [] : Array.isArray(children) ? children : [children];
		var childs = children.map((child,idx) => 
			typeof child.type === 'string'  && child.type[0].match(/[a-z]/)
			// careful not to pass invalid props to simple html elements
			? React.cloneElement(child, {key:idx})

			: React.cloneElement(child, {
				key:idx,
				path : path + '.' + idx,
				dragContainer: this.props.dragContainer,
				onLayout : child.props.onLayout || this.props.onLayout
			}));

		return (
			<div className={className} style={style}>{childs}</div>
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

