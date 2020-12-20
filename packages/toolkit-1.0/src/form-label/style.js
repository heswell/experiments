import { createUseStyles } from "react-jss";

const iconWidth = 15;

const topYOrigin = {
  touch: 11,
  low: 7,
  medium: 5,
  high: 3,
};

const labelYTranslation = {
  touch: 26,
  low: 23,
  medium: 20,
  high: 17,
};

const regularTypeSizePaletteIndices = {
  touch: 70,
  low: 60,
  medium: 50,
  high: 40,
};

const captionTypeSizePaletteIndices = {
  touch: 50,
  low: 40,
  medium: 40,
  high: 30,
};

export default createUseStyles(
  ({ toolkit: toolkitTheme }) => {
    const {
      disabled: { getDisabled },
      palette: { type, grey200, grey70 },
      size: { getSize },
      spacing,
      statusNext: { getStatus, statusStates },
      typography,
    } = toolkitTheme;

    const createStatusIndicatorVariantStyle = (variant) => {
      const { status: variantColor } = getStatus(variant);
      return {
        "&$statusIndicatorIconRoot": { color: variantColor },
      };
    };

    const createDensityStyle = ({ density }) => {
      const spacingMixin = spacing[density].spacing;
      const { height: formLabelMinHeight } = getSize({ density });

      const regularFontSize =
        typography.size[regularTypeSizePaletteIndices[density]];
      const regularTypography = {
        letterSpacing: 0,
        lineHeight: typography.lineHeight,
        fontSize: regularFontSize,
        minHeight: typography.getMinHeight(regularFontSize),
        ...typography.getFace(),
      };
      const captionFontSize =
        typography.size[captionTypeSizePaletteIndices[density]];
      const captionTypography = {
        letterSpacing: 0,
        lineHeight: typography.lineHeight,
        fontSize: captionFontSize,
        minHeight: typography.getMinHeight(captionFontSize),
        ...typography.getFace(),
      };

      return {
        paddingLeft: spacingMixin(1),
        paddingRight: spacingMixin(1),
        minHeight: formLabelMinHeight,
        "&$float": {
          ...regularTypography,
          minHeight: formLabelMinHeight,
          transform: `translate(0px, ${labelYTranslation[density]}px)`,
          transition: "transform 400ms cubic-bezier(0.0, 0, 0.2, 1) 0ms",
          "&$shrink": {
            ...captionTypography,
            transform: `translate(0px, ${topYOrigin[density]}px)`,
            transition: "transform 400ms cubic-bezier(0.0, 0, 0.2, 1) 0ms",
            paddingRight: spacingMixin(1),
          },
          "&$hasStartAdornment": {
            paddingLeft: spacingMixin(2) + iconWidth,
            "&$shrink": {
              transform: `translate(${-(spacingMixin(1) + iconWidth)}px, ${
                topYOrigin[density]
              }px)`,
            },
          },
          "&$hasEndAdornment": {
            paddingRight: spacingMixin(2) + iconWidth,
          },
        },
        "&$labelTop": {
          ...captionTypography,
          top: topYOrigin[density],
        },
        "&$labelLeft": {
          ...regularTypography,
          paddingLeft: 0,
          paddingRight: spacingMixin(0.75),
          "& $statusIndicatorIconRoot": {
            marginLeft: density === "high" ? "3px" : "6px",
          },
          "& $statusIndicatorTooltipRoot": {
            marginLeft: density === "high" ? "3px" : "6px",
          },
        },
      };
    };

    const color = type === "dark" ? grey70 : grey200;

    return {
      /* Styles applied to the root element */
      root: {
        boxSizing: "border-box",
        width: "100%",
        color,
        "&.Mui-focused": {
          color,
        },
        "&.Mui-disabled": {
          color,
        },
        display: "flex",
      },
      textContainer: {
        flexShrink: 1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      },
      /* Styles applied to float the label */
      float: {},
      /* Styles applied to the label when the related component has an end adornment */
      hasEndAdornment: {},
      /* Styles applied to the label when the related component has a start adornment */
      hasStartAdornment: {},
      /* Styles applied to shrink the label */
      shrink: {},
      /* Styles applied to place the label left */
      labelLeft: {
        position: "static",
        width: "auto",
      },
      /* Styles applied to the necessity indicator */
      necessityIndicator: {
        fontStyle: "italic",
        marginLeft: "1ch",
      },
      /* Styles applied to the status indicator */
      statusIndicatorTooltipRoot: {
        marginLeft: "6px",
      },
      statusIndicatorIconRoot: {
        marginLeft: "6px",
        height: 13,
      },
      statusIndicatorStateIconError: createStatusIndicatorVariantStyle(
        statusStates.error
      ),
      statusIndicatorStateIconInfo: createStatusIndicatorVariantStyle(
        statusStates.info
      ),
      statusIndicatorStateIconSuccess: createStatusIndicatorVariantStyle(
        statusStates.success
      ),
      statusIndicatorStateIconWarning: createStatusIndicatorVariantStyle(
        statusStates.warning
      ),
      statusIndicatorStateIconContainer: {
        flexShrink: 0,
      },
      /* Styles applied to place the label top */
      labelTop: {},
      /* Styles applied to the root element if disabled */
      disabled: getDisabled(),
      /* Styles applied to the root element if read-only */
      readOnly: {},
      /* Styles applied to the root element if `density="touch"` */
      touchDensity: createDensityStyle({ density: "touch" }),
      /* Styles applied to the root element if `density="low"` */
      lowDensity: createDensityStyle({ density: "low" }),
      /* Styles applied to the root element if `density="medium"` */
      mediumDensity: createDensityStyle({ density: "medium" }),
      /* Styles applied to the root element if `density="high"` */
      highDensity: createDensityStyle({ density: "high" }),
    };
  },
  { name: "FormLabel" }
);
