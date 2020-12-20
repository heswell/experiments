import React from "react";

import ErrorIndicator from "../assets/ErrorIndicator";
import WarningIndicator from "../assets/WarningIndicator";

const ActivationIndicatorIcon = ({ className, density, validationState }) =>
  validationState === "error" ? (
    <ErrorIndicator className={className} density={density} />
  ) : (
    <WarningIndicator className={className} density={density} />
  );

export default ActivationIndicatorIcon;
