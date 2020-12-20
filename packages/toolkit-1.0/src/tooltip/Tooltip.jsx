import React, { forwardRef, useCallback } from "react";
import classnames from "classnames";
import MuiTooltip from "@material-ui/core/Tooltip";
import { base } from "../style";
import { Popper } from "../popper";

import useStyles from "./style";
import getIconForState from "./getIconForState";
import State from "./State";

// Keep in order of preference. First items are used as default
const PLACEMENT_PRIORITY = ["right", "top", "left", "bottom"];
const Size = Object.freeze({
  medium: "medium",
  small: "small",
});

const Tooltip = forwardRef(function Tooltip(props, ref) {
  const contextDensity = "medium";
  const {
    accessibleText,
    PopperProps = {},
    children,
    className,
    density = contextDensity,
    disableArrow,
    hasIcon = true,
    placement,
    render,
    size,
    state = "info",
    title,
    ...rest
  } = props;

  const classes = useStyles();
  const getPopperProps = useCallback(
    () => ({
      keepMounted: true,
      ...PopperProps,
      className: classnames(
        classes.popper,
        size,
        state,
        className,
        PopperProps.className
      ),
    }),
    [PopperProps, className, classes, size, state]
  );

  const getIconProps = useCallback(
    ({ className: iconClassName, ...iconRest } = {}) => ({
      classes: {
        root: classnames(iconClassName, classes.stateIcon, state),
        content: classes.stateIconContent,
      },
      size: 12,
      ...iconRest,
    }),
    [classes, state]
  );

  const getIcon = useCallback(
    (passedProps) => {
      if (!hasIcon) {
        return null;
      }
      const icon = getIconForState(state);
      return icon ? icon(getIconProps(passedProps)) : null;
    },
    [state, getIconProps, hasIcon]
  );

  const getTitleProps = useCallback(
    ({ className: titleClassName, ...titleRest } = {}) => ({
      className: classnames(classes.title, titleClassName),
      ...titleRest,
    }),
    [classes]
  );

  const getTitle = useCallback(() => {
    if (!render && !title) {
      return "";
    }

    return (
      <>
        <div
          className={classnames(classes.tooltipContentRoot, {
            [classes.stateIconContainer]: state,
          })}
        >
          {render ? (
            render({
              Icon: (passedProps) => getIcon(passedProps),
              getIconProps,
              getTitleProps,
            })
          ) : (
            <>
              {getIcon()}
              <span className={classes.body}>{title}</span>
              <span style={base.accessibleText}>{accessibleText}</span>
            </>
          )}
        </div>
        {!disableArrow && <div className={classes.arrow} x-arrow="" />}
      </>
    );
  }, [
    render,
    title,
    classes.tooltipContentRoot,
    classes.stateIconContainer,
    classes.body,
    classes.arrow,
    state,
    getIconProps,
    getTitleProps,
    getIcon,
    accessibleText,
    disableArrow,
  ]);

  const densityClassName = classes[`${density}Density`];
  return (
    <MuiTooltip
      PopperComponent={Popper}
      PopperProps={getPopperProps()}
      classes={{
        tooltip: classnames(
          classes.tooltipRoot,
          classes[size || Size.medium],
          classes[state],
          densityClassName
        ),
        tooltipPlacementLeft: classes.left,
        tooltipPlacementRight: classes.right,
        tooltipPlacementBottom: classes.bottom,
        tooltipPlacementTop: classes.top,
      }}
      placement={placement || PLACEMENT_PRIORITY[0]}
      ref={ref}
      title={getTitle()}
      {...rest}
    >
      {children}
    </MuiTooltip>
  );
});

Tooltip.defaultProps = {
  state: State.DEFAULT,
  size: Size.MEDIUM,
};

export default Tooltip;
