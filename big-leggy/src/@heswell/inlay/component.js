import React from 'react';
import cx from 'classnames';

// need a layout prop and layout state. That way we can accept layout data both via json
// and vis managing Flexible container
export default class Component extends React.Component {

    static defaultProps = {
        style: {},
        position: {},
        _style: {},
        onClick: () => {}
    }

    render() {
        const className = cx('Component');
        const {children, id, flexible, onLayout, position, _style, onClick, ...props} = this.props;
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

function isHtmlType(element){
    const {type} = element;
    return typeof type === 'string' && type[0] === type[0].toLowerCase();
}
