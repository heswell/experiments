
import React from 'react';
import cx from 'classnames';

import './place-holder.css';

const PlaceHolder = ({className, onLayout, style}) => {

    const handleClose = () => {
        onLayout('remove');
    }

    return (
        <div 
            className={cx('PlaceHolder',className)} 
            style={style}>
            <div className="close icon-arrow" onClick={handleClose}>
                <span>Close</span>
            </div>
        </div>
    );
}

export default PlaceHolder;