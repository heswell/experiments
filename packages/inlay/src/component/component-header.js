import React from 'react';
// import Icon from 'react-icons/lib/fa/ellipsis-v';
import './component-header.css';

export default class ComponentHeader extends React.Component {

    render() {

        var { style, fixed, minimized, onMouseDown, menu = true } = this.props;

        return (
            <header className="ComponentHeader" onMouseDown={onMouseDown} style={style}>
                <span className="title">{this.props.title}</span>
                {fixed && !minimized ? <span className="icon-pushpin"></span> : null}
                {menu && <button className="icon-menu" data-key="menu"
                    onClick={e => this.handleMenuClick(e)}>
                    {/* <Icon /> */}
                </button>}
            </header>
        );
    }

    handleMenuClick(e){
        if (this.props.onAction) {
            this.props.onAction('menu', { left: e.clientX, top: e.clientY });
        }
    }

}
