import * as React from 'react';
import cx from 'classnames';
import { PopupService } from '../popup-service.jsx';
import './context-menu.css';

let subMenuTimeout = null;

export class MenuItem extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            hasChildMenuItems: props.children && props.children.length > 0
    };
    }

    render() {

        const nestedMenu = this.props.submenuShowing ?
            <ContextMenu doAction={this.props.doAction}>{this.props.children}</ContextMenu> :
            null;

        const className = cx(
            'menu-item',
            this.props.disabled ? 'disabled' : null,
            this.state.hasChildMenuItems ? 'root' : null,
            this.props.submenuShowing ? 'showing' : null
        );

        return (
            <li className={className}>
                <button tabIndex={-1} onClick={e => this.handleClick(e)}
                    onMouseOver={() => this.handleMouseOver()}>{this.props.label}</button>
                {nestedMenu}
            </li>
        );
    }

    handleClick(e){
        e.preventDefault();
        if (this.props.disabled !== true) {
            this.props.doAction(this.props.action, this.props.data);
        }
    }

    handleMouseOver() {
        this.props.onMouseOver(this.props.idx, this.state.hasChildMenuItems, this.props.submenuShowing);
    }

}

export const Separator = () => <li className='divider'></li>;

export class ContextMenu extends React.Component {


    constructor(props){
        super(props);
        this.state = {
            left: props.left,
            top: props.top,
            bottom: props.bottom,
            submenuShowing: false,
            submenuIdx: null
        };
    }

    render() {

        const {top, left, bottom} = this.state;
        const children = this.props.children;
        const style = { position: 'absolute', top, left, bottom };
        const submenuIdx = this.state.submenuShowing ? this.state.submenuIdx : -1;
        const menuItems = children ? children.map((menuItem, idx) => React.cloneElement(menuItem, {
            key: String(idx),
            idx,
            action: menuItem.props.action,
            doAction: (key, data) => this.handleMenuAction(key, data),
            onMouseOver: (idx, hasChildMenuItems) => this.handleMenuItemMouseOver(idx, hasChildMenuItems),
            submenuShowing: submenuIdx === idx

        })) : null;

        return <ul className='popup-menu' style={style}>{menuItems}</ul>;

    }

    componentWillReceiveProps(nextProps) {

        if (nextProps.left !== '100%' && nextProps.top !== 0) {

            if (nextProps.left !== this.state.left || nextProps.top !== this.state.top) {

                this.setState({
                    left: nextProps.left,
                    top: nextProps.top,
                    submenuShowing: false,
                    submenuIdx: null
                });

            }
        }
    }

    handleMenuAction(key, data){
        if (this.props.doAction) {
            this.props.doAction(key, data);
        } else if (this.props.onAction) {
            this.props.onAction(key, data);
        }
        this.close();
    }

    handleMenuItemMouseOver(idx, hasChildMenuItems){

        if (subMenuTimeout) {
            clearTimeout(subMenuTimeout);
            subMenuTimeout = null;
        }

        if (hasChildMenuItems) {
            if (this.state.submenuShowing !== true) {
                subMenuTimeout = setTimeout(() => this.showSubmenu(), 400);
            }
            this.setState({
                submenuIdx: idx
            });
        } else if (this.state.submenuIdx !== null) {
            this.setState({
                submenuIdx: null,
                submenuShowing: false
            });
        }
    }

    showSubmenu(){
        subMenuTimeout = null;
        this.setState({
            submenuShowing: true
        });
    }

    close() {
        PopupService.hidePopup();
    }


}

ContextMenu.defaultProps = {
    left: '100%',
    top: 0,
    bottom: 'auto'
};
