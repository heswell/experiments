
import React from 'react';
import cx from 'classnames';

import './place-holder.css';

const PlaceHolder = ({className, onLayout, style}) => {

    const handleClose = () => {
        onLayout('remove');
    }

    const backgroundColor = 'rgb(60,60,60)';

    return (
        <div 
            className={cx('place-holder',className)} 
            style={{...style, backgroundColor}}>
            <div className="close icon-arrow" onClick={handleClose}>
                <span>Close</span>
            </div>
        </div>
    );
}

export default PlaceHolder;