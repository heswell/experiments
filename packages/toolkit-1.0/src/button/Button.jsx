import React, { forwardRef, useState } from "react";
import MuiButton from "@material-ui/core/Button";
import classnames from "classnames";
import { mergeStyles } from "../utils";
// Style injection is based on source order, see:
// https://github.com/mui-org/material-ui/blob/89ebedc24f97d6bc7ca2e34a00efcdd47ca16812/packages/material-ui-styles/src/makeStyles/indexCounter.js#L5-L13
// This implicit child relationship is not known when Icons are children.
import "../icon/Icon";
import { IconClassNameProvider } from "../icon/internal/IconClassNameContext";

import useStyles from "./style";

/**
 * Button component, provides the user a simple way to trigger an event. It supports text and/or an icon.
 */
const Button = forwardRef(function Button(props, ref) {
  const contextDensity = "medium";

  const {
    children,
    classes: classesProp,
    className,
    density = contextDensity,
    hasInputParent,
    onBlur,
    onKeyDown,
    onKeyUp,
    variant,
    ...rest
  } = props;

  const classes = mergeStyles(useStyles(), classesProp);
  const [active, setActive] = useState(false);
  const handleKeyDown = (event) => {
    if (["Enter", "Space"].indexOf(event.key) >= 0) {
      setActive(true);
    }
    if (onKeyDown) {
      onKeyDown(event);
    }
  };

  const handleKeyUp = (event) => {
    setActive(false);
    if (onKeyUp) {
      onKeyUp(event);
    }
  };

  const handleBlur = (event) => {
    setActive(false);
    if (onBlur) {
      onBlur(event);
    }
  };

  return (
    <MuiButton
      className={classnames(
        className,
        classes[`${density}Density`],
        { active },
        classes[variant],
        {
          [classes.inputButton]: hasInputParent,
        }
      )}
      classes={{
        disabled: classes.disabled,
        root: classes.root,
        label: classes.label,
        focusVisible: classes.focusVisible,
      }}
      focusVisibleClassName={classes.focusVisible}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      ref={ref}
      {...rest}
    >
      <IconClassNameProvider value={classes.icon}>
        {children}
      </IconClassNameProvider>
    </MuiButton>
  );
});

Button.defaultProps = {
  disableFocusRipple: true,
  disableRipple: true,
  focusRipple: false,
  variant: "regular",
};

export default Button;
