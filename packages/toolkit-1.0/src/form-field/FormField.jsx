import React, { forwardRef, useState } from "react";
import clsx from "clsx";
import { FormControl, FormHelperText } from "@material-ui/core";

import { FormLabel } from "../form-label";
import { useId, a11yContext } from "../utils";
import { Tooltip } from "../tooltip";

import FormFieldContext from "./internal/FormFieldContext";
import ActivationIndicator from "./internal/ActivationIndicator";
//import AriaAnnouncer from "./internal/AriaAnnouncer";
import StatusIndicatorMessage from "./internal/StatusIndicatorMessage";
import useIsHoveredOrFocused from "./internal/useIsHoveredOrFocused";
import useFormFieldProps from "./useFormFieldProps";
import useStyles from "./style";

const callAll = (...handlers) => (eventArg) =>
  handlers.forEach((handler) => handler && handler(eventArg));

const combineMethodsAndProps = (methods, props) =>
  Object.entries(methods)
    .map(([prop, fn]) => [prop, callAll(fn, props[prop])])
    .reduce((acc, [prop, fn]) => {
      acc[prop] = fn;
      return acc;
    }, {});

const FormFieldLabel = ({
  disabled,
  hasStatusIndicator,
  StatusIndicatorProps,
  label,
  LabelComponent,
  classes,
  density,
  labelId,
  labelPlacement,
  required,
  LabelProps
}) =>
  label ? (
    <LabelComponent
      StatusIndicatorProps={StatusIndicatorProps}
      classes={{ root: classes.labelRoot }}
      density={density}
      disabled={disabled}
      hasStatusIndicator={hasStatusIndicator}
      id={labelId}
      labelPlacement={labelPlacement}
      required={required}
      {...LabelProps}
    >
      {label}
    </LabelComponent>
  ) : null;

const ControlContainer = ({
  LabelComponent,
  HelperTextComponent,
  classes,
  density,
  disabled,
  hasStatusIndicator,
  StatusIndicatorProps,
  helperText,
  helperTextId,
  HelperTextProps,
  required,
  label,
  labelId,
  LabelProps,
  labelPlacement,
  lowEmphasisFocus,
  children,
  validationState,
  variant,
  ...rest
}) => {
  const { focusVisible, focused } = useFormFieldProps();
  const isLabelLeft = labelPlacement === "left";
  const applyFocusClass = focusVisible && focused;
  return (
    <>
      <div
        className={clsx(classes.controlContainer, {
          [classes.labelTop]: labelPlacement === "top",
          [classes.focused]: applyFocusClass && !isLabelLeft,
          [classes.lowEmphasisFocus]: lowEmphasisFocus
        })}
        {...rest}
      >
        {!isLabelLeft && <div className={classes.controlAreaBackground} />}
        <FormFieldLabel
          LabelComponent={LabelComponent}
          LabelProps={LabelProps}
          StatusIndicatorProps={StatusIndicatorProps}
          classes={classes}
          density={density}
          disabled={disabled}
          hasStatusIndicator={hasStatusIndicator}
          label={label}
          labelId={labelId}
          labelPlacement={labelPlacement}
          required={required}
        />
        <div className={classes.controlAreaWrapper}>
          <div
            className={clsx(classes.controlArea, {
              [classes.focused]: applyFocusClass && isLabelLeft
            })}
          >
            {isLabelLeft && <div className={classes.controlAreaBackground} />}
            {children}
            <ActivationIndicator
              classes={classes}
              density={density}
              enabled={focusVisible}
              hasIcon={!hasStatusIndicator}
              validationState={validationState}
            />
          </div>
          {isLabelLeft && helperText && (
            <HelperTextComponent
              classes={{ root: classes.helperText }}
              disabled={disabled}
              id={helperTextId}
              {...HelperTextProps}
            >
              {helperText}
            </HelperTextComponent>
          )}
        </div>
      </div>
      {!isLabelLeft && helperText && (
        <HelperTextComponent
          classes={{ root: classes.helperText, disabled: classes.disabled }}
          disabled={disabled}
          id={helperTextId}
          {...HelperTextProps}
        >
          {helperText}
        </HelperTextComponent>
      )}
    </>
  );
};

const getStatusIndicatorProps = ({
  TooltipProps,
  statusIndicatorContent,
  tooltipIsOpen,
  density,
  helperTextPlacement,
  helperText,
  validationState: state,
  statusIndicatorId,
  classes
}) => {
  const hasTooltip =
    !!(helperTextPlacement === "tooltip" && helperText) ||
    !!(statusIndicatorContent && statusIndicatorContent.length);

  const statusIndicatorTitle = statusIndicatorContent && (
    <div
      className={clsx(
        classes.statusIndicatorContainer,
        classes[`${density}Density`]
      )}
      id={statusIndicatorId}
    >
      {statusIndicatorContent.map((message) => (
        <StatusIndicatorMessage
          className={classes.statusIndicatorMessage}
          key={message}
        >
          {message}
        </StatusIndicatorMessage>
      ))}
    </div>
  );

  const title = statusIndicatorTitle || (hasTooltip && helperText);

  return {
    hasTooltip,
    TooltipProps: {
      open: tooltipIsOpen,
      title,
      ...TooltipProps
    },
    state
  };
};

const getHasStatusIndicator = ({
  hasStatusIndicator,
  validationState,
  helperTextPlacement,
  helperText
}) =>
  hasStatusIndicator &&
  !!(validationState || (helperTextPlacement === "tooltip" && helperText));

const getA11yValue = ({
  label,
  ariaLabelledBy,
  ariaDescribedBy,
  helperText,
  helperTextId,
  labelId,
  hasStatusIndicator,
  statusIndicatorContent,
  statusIndicatorId,
  required,
  disabled,
  readOnly
}) => {
  const hasStatusIndicatorMessage =
    hasStatusIndicator &&
    statusIndicatorContent &&
    statusIndicatorContent.length;
  const hasAriaLabelledBy = label || ariaLabelledBy;
  const hasAriaDescribedBy =
    helperText || ariaDescribedBy || hasStatusIndicatorMessage;

  return {
    "aria-labelledby": hasAriaLabelledBy
      ? clsx(ariaLabelledBy, labelId)
      : undefined,
    "aria-describedby": hasAriaDescribedBy
      ? clsx(
          ariaDescribedBy,
          helperTextId,
          hasStatusIndicatorMessage && statusIndicatorId
        )
      : undefined,
    "aria-required": required,
    disabled,
    readOnly
  };
};

const FormField = forwardRef(function FormField(
  {
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": ariaDescribedBy,
    children,
    className,
    density: densityProp,
    disabled,
    fullWidth = true,
    hasStatusIndicator = false,
    helperText,
    HelperTextComponent = FormHelperText,
    helperTextPlacement = "bottom",
    HelperTextProps,
    label,
    LabelComponent = FormLabel,
    labelPlacement = "top",
    LabelProps,
    lowEmphasisFocus,
    TooltipComponent = Tooltip,
    TooltipProps,
    readOnly,
    required = false,
    statusIndicatorContent,
    statusIndicatorId: statusIndicatorIdOverride,
    validationState,
    variant = "theme",
    StatusIndicatorProps: StatusIndicatorOverrides,
    ...rest
  },
  ref
) {
  const classes = useStyles();
  const density = densityProp || "medium";
  const labelId = useId(LabelProps && LabelProps.id);
  const helperTextId = useId(HelperTextProps && HelperTextProps.id);
  const statusIndicatorId = useId(statusIndicatorIdOverride);
  const [tooltipIsOpen, hoveredOrFocusedMethods] = useIsHoveredOrFocused();
  const [focusVisible, setFocusVisible] = useState(true);

  const combinedHoveredOrFocusedMethods = combineMethodsAndProps(
    hoveredOrFocusedMethods,
    rest
  );

  const StatusIndicatorProps = {
    ...getStatusIndicatorProps({
      TooltipProps,
      classes,
      density,
      tooltipIsOpen,
      statusIndicatorContent,
      validationState,
      helperTextPlacement,
      helperText,
      statusIndicatorId
    }),
    TooltipComponent,
    ...StatusIndicatorOverrides
  };

  const formControlClasses = {
    root: clsx(
      classes.root,
      classes[`${density}Density`],
      {
        [classes.labelLeft]: labelPlacement === "left",
        [classes.error]: validationState === "error",
        [classes.warning]: validationState === "warning",
        [classes.disabled]: disabled,
        [classes.readOnly]: readOnly,
        [classes.themeVariant]: variant === "theme",
        [classes.transparentVariant]: variant === "transparent",
        [classes.filledVariant]: variant === "filled",
        [classes.hasHelperText]: helperText !== undefined
      },
      className
    )
  };

  return (
    <FormControl
      {...rest}
      classes={formControlClasses}
      disabled={disabled}
      fullWidth={fullWidth}
      {...combinedHoveredOrFocusedMethods}
      ref={ref}
    >
      <FormFieldContext.Provider
        value={{
          focusVisible,
          setFocusVisible,
          labelPlacement,
          variant
        }}
      >
        <a11yContext.Provider
          value={getA11yValue({
            label,
            ariaLabelledBy,
            ariaDescribedBy,
            helperText,
            helperTextId,
            labelId,
            hasStatusIndicator,
            statusIndicatorId,
            statusIndicatorContent,
            required,
            disabled,
            readOnly
          })}
        >
          <ControlContainer
            HelperTextComponent={HelperTextComponent}
            HelperTextProps={HelperTextProps}
            LabelComponent={LabelComponent}
            LabelProps={LabelProps}
            StatusIndicatorProps={StatusIndicatorProps}
            classes={classes}
            density={density}
            disabled={disabled}
            hasStatusIndicator={getHasStatusIndicator({
              hasStatusIndicator,
              validationState,
              helperTextPlacement,
              helperText
            })}
            helperText={
              helperTextPlacement !== "tooltip" ? helperText : undefined
            }
            helperTextId={helperTextId}
            label={label}
            labelId={labelId}
            labelPlacement={labelPlacement}
            lowEmphasisFocus={lowEmphasisFocus}
            required={required}
            validationState={validationState}
            variant={variant}
          >
            {helperTextPlacement === "tooltip" && !hasStatusIndicator ? (
              <TooltipComponent
                id={helperTextId}
                state={validationState}
                title={helperText}
                {...TooltipProps}
              >
                {children}
              </TooltipComponent>
            ) : (
              children
            )}
          </ControlContainer>
          {/* <AriaAnnouncer text={validationState ? validationState : ""} /> */}
        </a11yContext.Provider>
      </FormFieldContext.Provider>
    </FormControl>
  );
});

export default FormField;
