import React, { forwardRef } from "react";
import classnames from "classnames";
import { FormLabel as MuiFormLabel } from "@material-ui/core";

import {
  NecessityIndicator as DefaultNecessityIndicator,
  Necessity,
  NecessityStyle,
  StatusIndicator
} from "./internal";
import useStyles from "./style";

const FormLabel = forwardRef(function FormLabel(props, ref) {
  const contextDensity = "medium";

  const {
    className,
    children,
    density = contextDensity,
    float = true,
    hasEndAdornment,
    hasStartAdornment,
    hasStatusIndicator = false,
    StatusIndicatorProps,
    labelPlacement = "float",
    readOnly,
    shrink = true,
    required = false,
    necessityStyle = NecessityStyle.FULL,
    NecessityIndicator = DefaultNecessityIndicator,
    displayedNecessity = Necessity.REQUIRED,
    ...rest
  } = props;
  const classes = useStyles();
  return (
    <MuiFormLabel
      className={classnames(
        className,
        classes.root,
        classes[`${density}Density`],
        {
          [classes.float]: float,
          [classes.hasEndAdornment]: hasEndAdornment,
          [classes.hasStartAdornment]: hasStartAdornment,
          [classes.readOnly]: readOnly,
          [classes.shrink]: shrink,
          [classes.labelLeft]: labelPlacement === "left",
          [classes.labelTop]: labelPlacement === "top"
        }
      )}
      classes={{
        disabled: classes.disabled
      }}
      ref={ref}
      {...rest}
    >
      <div className={classes.textContainer}>{children}</div>
      <NecessityIndicator
        className={classes.necessityIndicator}
        displayedNecessity={displayedNecessity}
        necessityStyle={necessityStyle}
        required={required}
      />
      {hasStatusIndicator && (
        <StatusIndicator
          className={classes.statusIndicator}
          classes={{
            tooltipRoot: classes.statusIndicatorTooltipRoot,
            iconRoot: classes.statusIndicatorIconRoot,
            iconError: classes.statusIndicatorStateIconError,
            iconInfo: classes.statusIndicatorStateIconInfo,
            iconSuccess: classes.statusIndicatorStateIconSuccess,
            iconWarning: classes.statusIndicatorStateIconWarning,
            iconContainer: classes.statusIndicatorStateIconContainer
          }}
          hasTooltip
          {...StatusIndicatorProps}
        />
      )}
    </MuiFormLabel>
  );
});

export default FormLabel;
