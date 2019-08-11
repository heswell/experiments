import React from 'react';
import ReactDOM from 'react-dom';
import cx from 'classnames';

var _dialogOpen = false;
var _popups = [];

function specialKeyHandler(e){

	if (e.keyCode === 27 /* ESC */){
		if (_popups.length){
			closeAllPopups();
			console.log('unmount the open popup(s)');
		}
		else if (_dialogOpen){
			console.log('unmount the open dialog');
			ReactDOM.unmountComponentAtNode(document.body.querySelector('.react-dialog'));
		}
	}
}

function outsideClickHandler(e){

	if (_popups.length){
		console.log(`Popup.outsideClickHandler`);
		var popupContainers = document.body.querySelectorAll('.react-popup');
		for (var i=0;i<popupContainers.length;i++){
			if (popupContainers[i].contains(e.target)){
				return;
			}
		}
		closeAllPopups();
	}
}

function closeAllPopups(){
	if (_popups.length){

		console.log(`closeAllPopups`);
		var popupContainers = document.body.querySelectorAll('.react-popup');
		for (var i=0;i<popupContainers.length;i++){
			console.log(`unmountComponentAtNode`);
			ReactDOM.unmountComponentAtNode(popupContainers[i]);
		}
		popupClosed('*');
	}	
}

function dialogOpened(){
	if (_dialogOpen === false){
		console.log('PopupService, dialog opened');
		_dialogOpen = true;
		window.addEventListener('keydown', specialKeyHandler, true);
	}
}

function dialogClosed(){
	if (_dialogOpen){
		console.log('PopupService, dialog closed');
		_dialogOpen = false;
		window.removeEventListener('keydown', specialKeyHandler, true);
	}
}

function popupOpened(name/*, group*/){
	if (_popups.indexOf(name) === -1){
		_popups.push(name);
		//onsole.log('PopupService, popup opened ' + name + '  popups : ' + _popups);
		if (_dialogOpen === false){
			window.addEventListener('keydown', specialKeyHandler, true);
			window.addEventListener('click', outsideClickHandler, true);
		}
	}
}

function popupClosed(name/*, group*/){
	if (_popups.length){

		if (name === '*'){
			_popups.length = 0;
		}
		else {
			var pos = _popups.indexOf(name);
			if (pos !== -1){
				_popups.splice(pos,1);
			}
		}
		//onsole.log('PopupService, popup closed ' + name + '  popups : ' + _popups);

		if (_popups.length === 0 && _dialogOpen === false){
			window.removeEventListener('keydown', specialKeyHandler, true);
			window.removeEventListener('click', outsideClickHandler, true);
		}

	}
}

export class PopupService {

	static showPopup({name, group/*, depth*/, position, left, top, width, component}){

		//onsole.log(`PopupService.showPopup ${name} in ${group} ${left} ${top} ${width}`);

		popupOpened(name || 'anon', group);

		var el;

		if (group){
			el = document.body.querySelector('.react-popup.' + group);
			if (el === null){
				el = document.createElement('div');
				el.className = "react-popup " + group;
				document.body.appendChild(el);
			}
		}
		else {
			el = document.body.querySelector('#react-popup');
			if (!el){
				el = document.createElement('div');
				el.id = "react-popup";
				el.className = 'react-popup';
				document.body.appendChild(el);
			}
		}

		var className = cx('popup-container', position);
		ReactDOM.render(
			<div className={className} style={{position:'absolute',left,top,width}}>{component}</div>, el, () => {
				keepWithinThePage(el);
			}
		);
	}

	static hidePopup(name, group){

		//onsole.log('PopupService.hidePopup name=' + name + ', group=' + group)

		name = name || 'anon';

		if (_popups.indexOf(name) !== -1){
			popupClosed(name || 'anon', group);
			var query = group ? `.react-popup.${group}` : '#react-popup';
			ReactDOM.unmountComponentAtNode(document.body.querySelector(query));
		}
		else {
			console.log('... no popup by that name here');
		}

	}
}

export class DialogService {

	static showDialog(dialog){

		var containerEl = '.react-dialog';

		var onClose = dialog.props.onClose; 

		dialogOpened();

		ReactDOM.render(React.cloneElement(dialog, {
				container: containerEl,
				onClose : () => {
					DialogService.closeDialog();
					if (onClose) onClose();
				}
			}),
			document.body.querySelector(containerEl)
		);

	}

	static closeDialog(){
		dialogClosed();
		ReactDOM.unmountComponentAtNode(document.body.querySelector('.react-dialog'));
	}
}

export class Popup extends React.Component {
	

	render(){
		return <div className="popup-proxy"></div>
	}

	componentDidMount(){

		var domNode = ReactDOM.findDOMNode(this);
		if (domNode){
			var boundingClientRect = domNode.parentNode.getBoundingClientRect();
		}
		
		//onsole.log(`%cPopup.componentDidMount about to call show`,'color:green');

		this.show(this.props, boundingClientRect);
	}

	componentWillUnmount(){
		PopupService.hidePopup(this.props.name, this.props.group);
	}

	componentWillReceiveProps(nextProps){

		var domNode = ReactDOM.findDOMNode(this);
		if (domNode){
			var boundingClientRect = domNode.parentNode.getBoundingClientRect();
		}

		//onsole.log(`%cPopup.componentWillReceiveProps about to call show`,'color:blue');

		this.show(nextProps, boundingClientRect);
	}

	show(props, boundingClientRect){

		var {name, group, depth, width} = props;

		var left, top/*, bottom*/;

		if (this.pendingTask){
			clearTimeout(this.pendingTask);
			this.pendingTask = null;
		}

		if (props.close === true){
			console.log('Popup.show hide popup name=' + name + ', group=' + group + ',depth=' + depth);
			PopupService.hidePopup(name, group);
		}
		else {
			var {position, children:component} = props;

			var {left:targetLeft,top:targetTop,width:clientWidth,/*height,*/bottom:targetBottom/*,right*/} = boundingClientRect;

			if (position === 'below'){
				left = targetLeft;
				top = targetBottom;
			}
			else if (position === 'above'){
				left = targetLeft;
				top = targetTop;				
			}	

			console.log('%cPopup.show about to setTimeout','color:red;font-weight:bold');
			this.pendingTask = setTimeout(() => {
				console.log(`%c...timeout fires`,'color:red;font-weight:bold');
				PopupService.showPopup({name, group, depth, position, left, top, width:width || clientWidth, component});
			},10);
		}

	}
}


function keepWithinThePage(el){

	//onsole.log(`PopupService.keepWithinThePage`);

	var container = el.querySelector('.popup-container');

	var {top, left, width, height} = container.firstChild.getBoundingClientRect();

	var w = window.innerWidth;
	var h = window.innerHeight;

	var overflowH = h - (top+height);
	if (overflowH < 0){
		container.style.top = (parseInt(container.style.top) + overflowH) + 'px';
	}	

	var overflowW = w - (left+width);
	if (overflowW < 0){
		container.style.left = (parseInt(container.style.left) + overflowW) + 'px';
	}	

}
