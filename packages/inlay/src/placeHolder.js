
import React from 'react';
import cx from 'classnames';

import './placeHolder.css';

// Maybe should share a common base with LayoutItem
export default class PlaceHolder extends React.Component {


    render() {

        var className = cx(
            "PlaceHolder",
            this.props.className
        );

        var style = {
            ...this.props.style,
            backgroundColor: 'rgb(60,60,60)'
        }


        return (
            <div className={className} style={style}>
                <div className="close icon-arrow" onClick={this.handleClose.bind(this)}>
                    <span>Close</span>
                </div>
            </div>
        );
    }

    handleClose() {
        this.props.onLayout('remove');
    }


}

PlaceHolder.defaultProps = {
    layout: { ready: false }
};
