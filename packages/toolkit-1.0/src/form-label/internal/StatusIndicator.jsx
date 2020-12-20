import React from "react";
import classnames from "classnames";
import { Icon } from "../../icon";
import { Tooltip } from "../../tooltip";

const getStateIconClass = (state, classes) => {
  switch (state) {
    case "error": {
      return classes.iconError;
    }
    case "warning": {
      return classes.iconWarning;
    }
    case "success": {
      return classes.iconSuccess;
    }
    default: {
      return classes.iconInfo;
    }
  }
};

const icons = {
  error: "error-solid",
  success: "tick",
  warning: "warning-solid",
  info: "info-solid"
};

const getStateIcon = (state) => (state ? icons[state] : icons.info);

const StatusIndicator = (props) => {
  const {
    TooltipComponent = Tooltip,
    hasTooltip = false,
    classes,
    TooltipProps,
    IconProps,
    state,
    style
  } = props;

  const icon = (
    <span style={{ height: 0, ...style }}>
      <Icon
        classes={{
          root: classnames(classes.iconRoot, getStateIconClass(state, classes))
        }}
        name={getStateIcon(state)}
        {...IconProps}
      />
    </span>
  );
  return hasTooltip ? (
    <TooltipComponent
      PopperProps={{
        modifiers: {
          flip: { enabled: false }
        }
      }}
      classes={{
        tooltipRoot: classes.tooltipRoot,
        stateIcon: classes.stateIcon,
        stateIconContainer: classes.stateIconContainer
      }}
      hasIcon={false}
      placement="top"
      state={state}
      {...TooltipProps}
    >
      <span>{icon}</span>
    </TooltipComponent>
  ) : (
    icon
  );
};

export default StatusIndicator;
