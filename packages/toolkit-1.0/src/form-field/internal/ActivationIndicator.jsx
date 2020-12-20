import React from "react";

import ActivationIndicatorIcon from "./ActivationIndicatorIcon";

const ActivationIndicator = ({
  classes,
  density,
  enabled,
  validationState,
  hasIcon
}) =>
  enabled ? (
    <>
      <div className={classes.activationIndicator} />
      {validationState && hasIcon && (
        <ActivationIndicatorIcon
          className={classes.activationIndicatorIcon}
          density={density}
          validationState={validationState}
        />
      )}
    </>
  ) : null;

export default ActivationIndicator;
