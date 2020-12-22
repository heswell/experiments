import React, { forwardRef } from "react";
import PropTypes from "prop-types";
import classnames from "classnames";
import warning from "warning";

import { useDensity } from "../theme";
import JPMorganLogo from "./assets/JPMorganLogo";
import ChaseLogo from "./assets/ChaseLogo";
import JPMCompactLogo from "./assets/JPMCompactLogo";
import ChaseCompactLogo from "./assets/ChaseCompactLogo";

import "./Logo.css";

function isCompactVariant(variant) {
  return variant.indexOf("compact") !== -1;
}

const FirmLogo = forwardRef(function FirmLogo({ variant, ...rest }, ref) {
  switch (variant) {
    case "jpm":
    case "J.P. Morgan":
      return <JPMorganLogo {...rest} ref={ref} />;
    case "jpm-compact":
      return <JPMCompactLogo {...rest} ref={ref} />;
    case "chase":
    case "CHASE":
      return <ChaseLogo {...rest} ref={ref} />;
    case "chase-compact":
      return <ChaseCompactLogo {...rest} ref={ref} />;
    default:
      return <JPMorganLogo {...rest} ref={ref} />;
  }
});

FirmLogo.propTypes = {
  variant: PropTypes.string,
};

const RenderedLogo = forwardRef(function RenderedLogo(
  {
    alt,
    defaultClassName,
    densityClassName,
    density,
    width,
    height,
    src,
    variant,
    ...rest
  },
  ref
) {
  const mergedStyle = { ...rest.style, width, height };
  const logoClassNames = classnames(
    defaultClassName,
    rest.className,
    densityClassName
  );
  const LogoElement = src ? "img" : FirmLogo;
  const elementProps = src ? { alt: alt || "Logo" } : { variant };
  return (
    <LogoElement
      {...rest}
      className={logoClassNames}
      density={density}
      src={src}
      style={mergedStyle}
      {...elementProps}
      ref={ref}
    />
  );
});

RenderedLogo.propTypes = {
  alt: PropTypes.string,
  defaultClassName: PropTypes.string,
  density: PropTypes.oneOf(["touch", "low", "medium", "high"]),
  densityClassName: PropTypes.string,
  height: PropTypes.number,
  src: PropTypes.string,
  variant: PropTypes.string,
  width: PropTypes.number,
};

const Title = forwardRef(function Title(
  { label, defaultClassName, className, separatorClassname, ...rest },
  ref
) {
  const titleClassNames = classnames(defaultClassName, className);
  return label ? (
    <>
      <span className={separatorClassname} />
      <span className={titleClassNames} {...rest} ref={ref}>
        <span>{label}</span>
      </span>
    </>
  ) : null;
});

Title.propTypes = {
  className: PropTypes.string,
  defaultClassName: PropTypes.string,
  label: PropTypes.string,
  separatorClassname: PropTypes.string,
};

const Logo = forwardRef(function Logo(props, ref) {
  const contextDensity = useDensity();
  const classes = useStyles();
  const {
    appTitle,
    className,
    density = contextDensity,
    height,
    src,
    variant = "jpm",
    width,
    ImageProps,
    TitleProps,
    ...rest
  } = props;

  const densityClassName = `Logo-${density}Density`;

  return (
    <span
      className={classnames("Logo", className, densityClassName)}
      ref={ref}
      style={{
        height,
      }}
      {...rest}
    >
      <span
        className="Logo-wrapper"
        style={{
          height,
        }}
      >
        <RenderedLogo
          defaultClassName="Logo-logo"
          density={density}
          height={height}
          src={src}
          variant={variant}
          width={width}
          {...ImageProps}
        />
      </span>
      <Title
        defaultClassName="Logo-app-title"
        height={height}
        label={appTitle}
        separatorClassname={classnames("Logo-title-pipe", {
          "Logo-compact": isCompactVariant(variant),
        })}
        {...TitleProps}
      />
    </span>
  );
});

Logo.propTypes = {
  /**
   * props passed to the Logo
   */
  ImageProps: PropTypes.objectOf(PropTypes.any),
  /**
   * props passed to the Application Title if used.
   * If using a custom image then ImageProps.alt should be set to include a screen reader alternative text
   */
  TitleProps: PropTypes.objectOf(PropTypes.any),
  /**
   * used to provide application title
   */
  appTitle: PropTypes.string,
  /**
   * The className(s) of the component
   */
  className: PropTypes.string,
  /**
   * @external - material-ui
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.objectOf(PropTypes.string),
  /**
   * The density of a component affects the style of the layout.
   * A high density component uses minimal sizing and spacing to convey the intended UI design.
   * Conversely, a low density component, maximizes the use of space and size to convey the UI Design.
   */
  density: PropTypes.oneOf(["touch", "low", "medium", "high"]),
  /**
   * prop to set height on logo element
   */
  height: PropTypes.number,
  /**
   * set custom image for logo
   */
  src: PropTypes.string,
  /**
   * set the firm svg. Use `jpm`, `jpm-compact`, `chase` or `chase-compact`. Defaults to `jpm`.
   */
  variant: ((validator) => {
    let hasWarnedForJpm = false;
    let hasWarnedForChase = false;

    return (props, propName, ...args) => {
      const value = props[propName];

      if (value === "J.P. Morgan") {
        warning(
          hasWarnedForJpm,
          "The variant `J.P. Morgan` is deprecated. Please use `jpm` instead."
        );
        hasWarnedForJpm = true;
      }

      if (value === "CHASE") {
        warning(
          hasWarnedForChase,
          "The variant `CHASE` is deprecated. Please use `chase` instead."
        );
        hasWarnedForChase = true;
      }

      return validator(props, propName, ...args);
    };
  })(
    PropTypes.oneOf([
      "J.P. Morgan",
      "CHASE",
      "jpm",
      "jpm-compact",
      "chase",
      "chase-compact",
    ])
  ),
  /**
   * prop to set width on logo element
   */
  width: PropTypes.number,
};

export default Logo;
