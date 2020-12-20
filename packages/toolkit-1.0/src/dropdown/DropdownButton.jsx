import React, { forwardRef } from "react";
import PropTypes from "prop-types";
import classnames from "classnames";
import { refType } from "../utils";
import { Button } from "../button";
import { useFormFieldProps } from "../form-field";
import { Icon } from "../icon";

import useStyles from "./style";

const DropdownButton = forwardRef(function DropdownButton(
  {
    ariaHideOptionRole,
    className,
    density = "medium",
    disabled,
    iconName,
    iconSize,
    isOpen,
    label,
    labelId,
    // inField is needed for custom element only
    // eslint-disable-next-line react/prop-types
    inField,
    fullWidth,
    ...rest
  },
  ref
) {
  const classes = useStyles();
  const { inFormField } = useFormFieldProps();
  const focusVisibleClassName =
    inFormField || inField ? classes.formField : undefined;
  return (
    <Button
      className={classnames(
        classes[`${density}Density`],
        classes.button,
        className,
        { [classes.fullWidth]: fullWidth }
      )}
      classes={{
        focusVisible: focusVisibleClassName,
      }}
      // We don't want the 'button' tag to be shown in the DOM to trigger some accessability testing
      // tool's false alarm on role of 'listbox'
      component="div"
      data-jpmui-test="dropdown-button"
      density={density}
      disabled={disabled}
      ref={ref}
      variant="secondary"
      {...rest}
    >
      <div className={classes.content}>
        <span
          // 'hidden' so that screenreader won't be confused the additional 'option' which is just a label
          aria-hidden={ariaHideOptionRole ? "true" : undefined}
          aria-selected="false"
          className={classes.buttonLabel}
          id={labelId}
          // 'option' role here is to suppress accessibility testing tool warning about 'listbox' missing children role.
          role="option"
        >
          {label}
        </span>
        <Icon className={classes.icon} name={iconName} size={iconSize} />
      </div>
    </Button>
  );
});

DropdownButton.propTypes = {
  ariaHideOptionRole: PropTypes.bool,
  buttonRef: refType,
  className: PropTypes.string,
  classes: PropTypes.objectOf(PropTypes.string).isRequired,
  density: PropTypes.oneOf(["touch", "high", "medium", "low"]),
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
  iconName: PropTypes.string.isRequired,
  iconSize: PropTypes.number,
  inFormField: PropTypes.bool,
  isOpen: PropTypes.bool,
  label: PropTypes.string,
  /**
   * Id for the label. This is needed for ARIA attributes.
   */
  labelId: PropTypes.string,
  onBlur: PropTypes.func,
  onFocus: PropTypes.func,
  onKeyDown: PropTypes.func,
  onKeyUp: PropTypes.func,
};

export default DropdownButton;
