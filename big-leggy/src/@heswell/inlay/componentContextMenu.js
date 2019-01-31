import React from 'react';
import {ContextMenu, MenuItem, Separator} from './contextMenu';

export default class ComponentContextMenu extends React.Component {

	render(){

		return (
			<ContextMenu doAction={this.props.doAction}>
				{this.menuItems()}
			</ContextMenu>
		);

	}

	menuItems(){

		var {state, children:targetComponent} = this.props.component.props; // state is too vague
		var minimized = state === 1;
		var maximized = state === 2;;
		var normal = !(maximized || minimized);

		console.log(`ComponentContextMenu.menuItems minimized=${minimized}`)


		var menuItems = [];

		// menuItems.push(	<MenuItem action="pin" label="Fix Size"/> );
		menuItems.push(	<MenuItem key="remove" action="remove" label="Remove"/> );
		if (normal){
			menuItems.push( 
				<MenuItem key="minimize" action="minimize" label="Minimize"/> ,
				<MenuItem key="maximize" action="maximize" label="Maximize"/> );
		}
		else {
			menuItems.push( <MenuItem key="restore" action="restore" label="Restore"/> );
		} 	

		var {contextMenuItems=[]} = targetComponent.props;
		const componentMenuItems = contextMenuItems.map(({text, action}) =>
			<MenuItem key={action} action={action} label={text}/>
		); 
		if (componentMenuItems.length){
			menuItems.push(	<Separator key="1"/>, ...componentMenuItems );
		}

		menuItems.push(	
			<Separator key="1"/>, 
			<MenuItem key="settings" action="settings" label="Settings"/> );

		return menuItems;
	}


}

