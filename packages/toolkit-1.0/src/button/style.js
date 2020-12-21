import { createUseStyles } from "react-jss";
import { fade } from "@material-ui/core/styles";

const offsets = {
  touch: 4,
  low: 4,
  medium: 2,
  high: 2,
};

// TODO: I suspect there's a very basic default text characteristic we can refactor out of this to be reused here and elsewhere
const densityToTypeSizePaletteIndex = {
  touch: 70,
  low: 60,
  medium: 50,
  high: 40,
};

export default createUseStyles(
  ({ toolkit: toolkitTheme }) => {
    const {
      action: { getAction, actionVariants },
      disabled: { getDisabled },
      focusable: { getFocusable },
      spacing,
      size: { getSize },
      typography,
    } = toolkitTheme;

    const { opacity: disabledOpacity } = getDisabled();
    const { opacity: graphicalDisabledOpacity } = getDisabled("graphical");

    const createDensityStyle = (density) => {
      const fontSize = typography.size[densityToTypeSizePaletteIndex[density]];
      const spacingMixin = spacing[density].spacing;
      const { height } = getSize({ density });
      const padding = spacingMixin(1);
      return {
        fontSize,
        height,
        padding: [[0, padding]],
        "&$inputButton": {
          height: height - offsets[density] * 2,
          margin: offsets[density],
          padding: [[0, padding - offsets[density]]],
        },
      };
    };

    const createVariantStyle = (variant) => {
      const action = getAction({ variant });
      const {
        default: { icon: defaultIcon, ...defaultStyles },
        active: { icon: activeIcon, ...activeStyles },
        hover: { icon: hoverIcon, ...hoverStyles },
      } = action;

      const disabledBackgroundColor =
        action.default.background === "none"
          ? "none"
          : fade(action.default.background, graphicalDisabledOpacity);

      return {
        ...defaultStyles,
        ...typography.getFace(variant === "secondary" ? "semiBold" : "bold"),
        lineHeight: typography.lineHeight,
        letterSpacing: "0.6px",
        textTransform: "uppercase",
        "&:hover": {
          ...hoverStyles,
          "& $icon:not($:active)": {
            color: hoverIcon,
          },
        },
        "&:active, &.active": {
          ...activeStyles,
          "& $icon": {
            color: activeIcon,
          },
        },
        "&:visited": {
          color: defaultStyles.color,
        },
        "& $icon": {
          color: defaultIcon,
        },
        "&$disabled": {
          color: `${fade(action.default.color, disabledOpacity)} !important`,
          background: `${disabledBackgroundColor} !important`,
          "& $icon": {
            color: `${fade(
              action.default.color,
              graphicalDisabledOpacity
            )} !important`,
          },
        },
      };
    };

    return {
      disabled: {
        pointerEvents: "inherit !important",
      },
      regular: createVariantStyle(actionVariants.regular),
      cta: createVariantStyle(actionVariants.cta),
      secondary: createVariantStyle(actionVariants.secondary),
      touchDensity: createDensityStyle("touch"),
      lowDensity: createDensityStyle("low"),
      mediumDensity: createDensityStyle("medium"),
      highDensity: createDensityStyle("high"),
      /* Styles applied to the root element if used in an input CE */
      inputButton: {},
      /* Styles applied to the root element if keyboard focused */
      focusVisible: getFocusable(),
      /* Styles applied to the root element if `fullWidth={true}` */
      fullWidth: {},
      /* Styles applied to the icon element */
      icon: {
        color: "inherit",
        letterSpacing: 0,
      },
      /* Styles applied to the span element that wraps the children */
      label: {
        position: "relative",
        alignItems: "center",
        display: "flex",
        height: "100%",
        // Fixes IE11 CE. pre makes the button really wide.
        "&:not(.style-scope)": {
          whiteSpace: "pre",
        },
      },
      /* Styles applied to the root element */
      root: {
        borderRadius: 0,
        appearance: "none",
        minWidth: "0 !important",
        minHeight: 0,
        display: "inline-block",
        position: "relative",
        transition: "none",
        textAlign: "center",
        userSelect: "none",
        "&:not($focusVisible)": {
          outline: "1px solid transparent",
        },
        "&[href]": {
          display: "inline-flex",
        },
        "&::-moz-focus-inner": {
          padding: 0,
          border: 0,
        },
        "&$disabled": {
          cursor: "not-allowed",
        },
      },
    };
  },
  { name: "Button", index: 5 }
);
