'use strict';

var React			= require('react');
var ReactDOM		= require('react-dom');
var cx				= require('classnames');
var PopupService	= require('react-services').PopupService;

var subMenuTimeout = null;

var MenuItem = React.createClass({

	render(){

		var nestedMenu = this.props.submenuShowing ? 
			<ContextMenu doAction={this.props.doAction}>{this.props.children}</ContextMenu> :
			null;

		var className = cx(
			'menu-item',
			this.props.disabled ? 'disabled' : null,
			this.state.hasChildMenuItems ? 'root' : null,
			this.props.submenuShowing ? 'showing' : null
		);

		return (
			<li className={className}>
				<button tabIndex="-1"
					onClick={this.handleClick}
					onMouseOver={this.handleMouseOver}>{this.props.label}</button>
				{nestedMenu}
			</li>
		);

	},

	getDefaultProps(){
		return {
			data : null
		}
	},

	getInitialState(){
		return {
			hasChildMenuItems: this.props.children && this.props.children.length > 0
		};
	},

	handleClick(e, dispatchId){
		e.preventDefault();
		if (this.props.disabled !== true){
			this.props.doAction(this.props.action, this.props.data);
		}
	},

	handleMouseOver(){
		this.props.onMouseOver(this.props.idx, this.state.hasChildMenuItems, this.state.submenuShowing);
	}

});

var Separator = React.createClass({
	render(){
		return <li className="divider"></li>;
	}
});

var ContextMenu = React.createClass({

	render(){
		
		var children = this.props.children;

		var style = {
			position : 'absolute',
			top: this.state.top,
			left: this.state.left,
			bottom: this.state.bottom
		};

		var submenuIdx = this.state.submenuShowing ? this.state.submenuIdx : -1;

		var menuItems = children ? children.map((menuItem, idx) => React.cloneElement(menuItem, {
			key : String(idx),
			idx,
			action: menuItem.props.action,
			doAction: this.handleMenuAction,
			onMouseOver : this.handleMenuItemMouseOver,
			submenuShowing : submenuIdx === idx

		})) : null;

		return <ul className="popup-menu" style={style}>{menuItems}</ul>;

	},

	getDefaultProps(){
		return {
			left: "100%",
			top: 0,
			bottom: 'auto'
		};
	},

	getInitialState(){
		return {
			left : this.props.left,
			top: this.props.top,
			bottom: this.props.bottom,
			right: this.props.right,
			submenuShowing: false,
			submenuIdx : null
		}
	},

	componentWillMount(){
		this.setState({
			submenuShowing: false,
			submenuIdx: null
		});
	},

	componentDidMount(){
		window.addEventListener('keydown',this.specialKeyHandler, true);
		// Note: the click handler fires in capture phase. This is important. We want this
		// to fire *before* a local click handler that might call popup.open on another
		// popup.
		document.addEventListener('click',this.handleClickAway, true);

		this.keepWithinThePage(this.state.left, this.state.top);
	},

	componentWillUnmount(){
		window.removeEventListener('keydown',this.specialKeyHandler, true);
		document.removeEventListener('click',this.handleClickAway, true);
	},

	componentWillReceiveProps(nextProps){

		if (nextProps.left !== '100%' && nextProps.top !== 0){

			if (nextProps.left !== this.state.left || nextProps.top !== this.state.top){

				this.setState({
					left: nextProps.left,
					top: nextProps.top,
					submenuShowing: false,
					submenuIdx: null
				});

				this.keepWithinThePage(nextProps.left, nextProps.top);
			}
		}
	},

	handleMenuAction(key, data){
		if (this.props.doAction){
			this.props.doAction(key, data);
		}
		else if (this.props.onAction){
			this.props.onAction(key, data);
		}
		this.close();
	},

	handleClickAway(e){
		var node = ReactDOM.findDOMNode(this);
		if (!node.contains(e.target)){
			this.close();
		}	
	},

	handleMenuItemMouseOver(idx, hasChildMenuItems, submenuShowing){

		if (subMenuTimeout){
			clearTimeout(subMenuTimeout);
			subMenuTimeout = null;
		}

		if (hasChildMenuItems){
			if (this.state.submenuShowing !== true){
				subMenuTimeout = setTimeout(this.showSubmenu, 400);
			}
			this.setState({
				submenuIdx: idx
			});
		}
		else if (this.state.submenuIdx){
			this.setState({
				submenuIdx: null,
				submenuShowing: false
			});
		}
	},

	showSubmenu(){
		subMenuTimeout = null;
		this.setState({
			submenuShowing: true
		});
	},

	specialKeyHandler(e){

		if (e.keyCode === 27 /* ESC */){
			this.close();
		}

	},

	keepWithinThePage(menuLeft, menuTop){

		var {top, left, width, height} = this.getDOMNode().getBoundingClientRect();
		var w = window.innerWidth;
		var h = window.innerHeight;

		var left1 = menuLeft === "100%" ? left : menuLeft;
		var  top1 = menuTop === 0 ? top : menuTop;

		var newLeft = left1;
		var newTop = top1;

		if (left1 + width > w){
			newLeft = w - (width + 6);
		}

		if (top1 + height > h){
			newTop = h - (height + 6);
		}

		if (newLeft !== left1 || newTop !== top1){

			if (menuLeft === "100%" && menuTop === 0){

				this.setState({
					left: newLeft !== left1 ? (newLeft - left1) : menuLeft,
					top: newTop !== top1 ? (newTop - top1) : menuTop
				});
			}
			else {
				this.setState({left: newLeft, top: newTop});
			}
		}

	},

	close(){
		PopupService.hidePopup();
	}


});

module.exports = {ContextMenu, MenuItem, Separator};