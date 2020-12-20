import { createUseStyles } from "react-jss";

import { fade } from "@material-ui/core/styles";

const createLightPalette = ({
  grey20,
  grey90,
  grey200,
  blue400,
  blue500,
  orange10,
  orange700,
  red10,
  white,
}) => ({
  controlContainer: {
    background: white,
    color: grey200,
  },
  activationIndicator: {
    color: grey90,
    default: {
      hover: blue400,
      focused: blue500,
    },
    warning: {
      hover: orange700,
      focused: orange700,
    },
  },
  filled: {
    default: {
      background: grey20,
    },
    error: {
      background: red10,
    },
    warning: { background: orange10 },
  },
  helperText: {
    color: grey200,
  },
});

const createDarkPalette = ({
  grey800,
  grey900,
  grey70,
  grey100,
  blue300,
  blue400,
  orange500,
  orange10,
  red10,
}) => ({
  controlContainer: {
    background: grey800,
    color: grey70,
  },
  activationIndicator: {
    color: grey100,
    default: {
      hover: blue300,
      focused: blue400,
    },
  },
  warning: {
    hover: orange500,
    focused: orange500,
  },
  filled: {
    default: {
      background: grey900,
    },
    error: {
      background: red10,
    },
    warning: { background: orange10 },
  },
  helperText: {
    color: grey70,
  },
});

const helperTextMarginTop = {
  touch: 4,
  low: 4,
  medium: 2,
  high: 2,
};

const captionFontSizeIndices = {
  touch: 50,
  low: 40,
  medium: 40,
  high: 30,
};

export default createUseStyles(
  ({ toolkit }) => {
    const {
      disabled: { getDisabled },
      focusable: { getFocusable },
      palette: { type, ...restPalette },
      statusNext: { getStatus, statusStates },
      spacing,
      typography,
    } = toolkit;
    const palette =
      type === "dark"
        ? createDarkPalette(restPalette)
        : createLightPalette(restPalette);

    const disabledStyle = getDisabled();
    const graphicalDisabled = getDisabled("graphical");

    const createValidationStateStyle = (state) => {
      const { status: color } = getStatus(state);
      const activationIndicatorPalette = palette.activationIndicator[state];
      const filledPalette = palette.filled[state];
      const disabledColor = fade(color, graphicalDisabled.opacity);

      return {
        "&$root:not($disabled)": {
          "&:hover $activationIndicator": {
            borderColor:
              (activationIndicatorPalette &&
                activationIndicatorPalette.hover) ||
              color,
          },
        },
        "& $activationIndicator ": {
          borderColor: color,
        },
        "& $activationIndicatorIcon": { fill: color },
        "& $focused": { outlineColor: color },
        "&$filledVariant": {
          "& $controlAreaBackground": {
            background: filledPalette.background,
          },
          "&$disabled": {
            "& $controlAreaBackground": {
              background: disabledColor,
            },
          },
        },
        "&$disabled": {
          "& $activationIndicator ": {
            borderColor: disabledColor,
          },
          "& $activationIndicatorIcon": { fill: disabledColor },
        },
      };
    };

    const createDensityStyle = (density) => {
      const fontSize = typography.size[captionFontSizeIndices[density]];
      const captionTypography = {
        letterSpacing: 0,
        lineHeight: typography.lineHeight,
        fontSize,
        minHeight: typography.getMinHeight(fontSize),
        ...typography.getFace(),
      };

      const spacingMixin = spacing[density].spacing;
      const translateY = {
        touch: 25,
        low: 22,
        medium: 17,
        high: 13,
      };

      return {
        "& $helperText": {
          ...captionTypography,
          paddingLeft: spacingMixin(1),
          paddingRight: spacingMixin(1),
          marginTop: `${helperTextMarginTop[density]}px`,
          color: palette.helperText.color,
        },
        "&$labelLeft $labelRoot": {
          paddingRight: spacingMixin(0.75),
          marginTop: `${helperTextMarginTop[density]}px`,
          transform: `translate(0px, ${translateY[density]}%)`,
        },
        "&$hasHelperText$labelLeft $labelRoot": {
          marginTop: 0,
        },
        "& $statusIndicatorMessage": {
          marginBottom: spacingMixin(0.5),
        },
      };
    };

    return {
      root: {
        boxSizing: "border-box",
        justifyContent: "flex-start",
        "&:hover $activationIndicator": {
          borderColor: palette.activationIndicator.default.hover,
        },
      },
      controlContainer: {
        display: "flex",
        position: "relative",
        justifyContent: "center",
        // for IE 11
        minHeight: 1,
      },
      controlAreaWrapper: {
        position: "relative",
        width: "100%",
        // for IE 11
        minHeight: 1,
      },
      controlArea: {
        position: "relative",
        width: "100%",
        lineHeight: typography.lineHeight,
      },
      controlAreaBackground: {
        height: "100%",
        left: 0,
        position: "absolute",
        top: 0,
        width: "100%",
        boxSizing: "border-box",
      },
      labelRoot: {},
      labelLeft: {
        "& $labelRoot": {
          display: "inline-flex",
          flexGrow: 1,
          flexShrink: 0,
        },
      },
      disabled: {
        cursor: disabledStyle.cursor,
        "& $activationIndicator": {
          borderColor: fade(
            palette.activationIndicator.color,
            graphicalDisabled.opacity
          ),
        },
        "&:hover $activationIndicator": {
          borderColor: fade(
            palette.activationIndicator.color,
            graphicalDisabled.opacity
          ),
        },
        "& $helperText": {
          opacity: disabledStyle.opacity,
        },
      },
      labelTop: {
        flexDirection: "column",
      },
      focused: {
        ...getFocusable(),
        outlineOffset: 0,
        "& $activationIndicator": {
          borderBottomWidth: 2,
          borderColor: palette.activationIndicator.default.focused,
        },
      },
      lowEmphasisFocus: {
        outline: "none",
      },
      helperText: {
        fontStyle: "italic",
      },
      hasHelperText: {},
      activationIndicator: {
        borderBottom: "1px",
        borderBottomStyle: "solid",
        position: "absolute",
        height: "auto",
        width: "100%",
        bottom: 0,
        left: 0,
        borderColor: palette.activationIndicator.color,
        color: palette.activationIndicator.color,
      },
      activationIndicatorIcon: {
        position: "absolute",
        bottom: 3,
        right: 2,
      },
      readOnly: {
        "& $activationIndicator": {
          opacity: 0.2,
        },
        "&:hover $activationIndicator": {
          borderColor: "inherit",
        },
      },
      error: createValidationStateStyle(statusStates.error),
      warning: createValidationStateStyle(statusStates.warning),
      touchDensity: createDensityStyle("touch"),
      lowDensity: createDensityStyle("low"),
      mediumDensity: createDensityStyle("medium"),
      highDensity: createDensityStyle("high"),
      themeVariant: {
        "& $controlAreaBackground": {
          background: palette.controlContainer.background,
        },
        "&$readOnly": {
          "& $controlAreaBackground": {
            background: "transparent",
          },
        },
        "&$disabled": {
          "& $controlAreaBackground": {
            background: fade(
              palette.controlContainer.background,
              graphicalDisabled.opacity
            ),
          },
        },
      },
      statusIndicatorMessage: { margin: 0 },
      statusIndicatorContainer: {
        padding: 0,
        margin: 0,
        "& $statusIndicatorMessage:last-child": {
          marginBottom: 0,
        },
      },
      filledVariant: {
        "& $controlAreaBackground": {
          background: palette.filled.default.background,
        },
        "&$disabled": {
          "& $controlAreaBackground": {
            background: fade(
              palette.filled.default.background,
              graphicalDisabled.opacity
            ),
          },
        },
      },
      transparentVariant: {
        "& $controlAreaBackground": {
          background: "transparent",
        },
      },
    };
  },
  { name: "FormField", index: 1 }
);
