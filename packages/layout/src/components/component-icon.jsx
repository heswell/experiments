import React, {Component} from 'react'
import cx from 'classnames';
import {registerType} from '../component-registry';

export default class ComponentIcon extends Component {

	render(){
		const {color, text, style} = this.props;
		const className = cx('ComponentIcon', this.props.className);
		console.log(`ComponentIcon color=${color}`);

		return (
			<div className={className}
				style={{...style,backgroundColor:color}}>
				<span>{text}</span>
				{this.props.children}
			</div>
		);
	}
}

registerType('ComponentIcon', ComponentIcon);
