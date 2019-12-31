import React from 'react';
import cx from 'classnames';

import './component.css';

// need a layout prop and layout state. That way we can accept layout data both via json
// and vis managing Flexible container
export default class Component extends React.Component {

    render() {
        const className = cx('Component');
        const {children, id, flexible, onLayout, onClick, ...props} = this.props;
        return (
            <div className={className} style={this.props.style} onClick={onClick}>
                {children &&
                    React.isValidElement(children) && !isHtmlType(children)
                    ? React.cloneElement(children, { ...props })
                    : children
                }
            </div>

        );
    }
}

Component.defaultProps = {
    onClick: () => {}
}


function isHtmlType(element){
    const {type} = element;
    return typeof type === 'string' && type[0] === type[0].toLowerCase();
}
