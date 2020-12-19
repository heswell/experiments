import React, {forwardRef} from 'react';
import cx from "classnames";

import "./Button.css";

const Button = forwardRef(function Button({children, className, density="medium", variant, ...props}, ref) {
    return (
        <button className={cx("Button", className, variant, `${density}Density`)} {...props} ref={ref}>
            {children}
        </button>
    );
})

export default Button;