import { createUseStyles } from "react-jss";
// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable line-comment-position */
const createLightPalette = ({ grey900, white }) => ({
  color: grey900,
  background: white,
});

const createDarkPalette = ({ grey800, white }) => ({
  color: white,
  background: grey800,
});

const getPalette = (palette) =>
  palette.type === "dark"
    ? createDarkPalette(palette)
    : createLightPalette(palette);

const generateArrowStyle = (
  centerToEdge,
  alignToEdge,
  fillBorder,
  widthBorder,
  background,
  border
) => ({
  [alignToEdge]: -11,
  [centerToEdge]: "calc(50% - 5px)",
  [fillBorder]: border,
  "&::after": {
    position: "absolute",
    [alignToEdge]: -4,
    [centerToEdge]: "calc(50% - 5px)",
    [fillBorder]: border,
    content: "''",
    [fillBorder]: background,
    [widthBorder]: 5,
  },
});

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
      elevation: { getElevation },
      overlayable,
      palette,
      spacing,
      statusNext: { getStatus, statusStates },
      typography,
    } = toolkitTheme;

    const { color, background } = getPalette(palette);

    const createVariantStyle = (variant) => {
      const { status: variantColor } = getStatus(variant);
      const shadowVariant = variant === "info" ? "blue" : "black";
      return {
        "& $stateIcon": { color: variantColor },
        "&$tooltipRoot": {
          border: `1px solid ${variantColor}`,
          "&$top": {
            marginBottom: 8,
            "& $arrow": {
              borderTopColor: variantColor,
              bottom: -11,
            },
          },
          ...getElevation(4, shadowVariant),
          "&$bottom": {
            marginTop: 8,
            "& $arrow": {
              borderBottomColor: variantColor,
              top: -11,
            },
          },
          "&$left": {
            marginRight: 8,
            "& $arrow": {
              borderLeftColor: variantColor,
              right: -11,
            },
          },
          "&$right": {
            marginLeft: 8,
            "& $arrow": {
              borderRightColor: variantColor,
              left: -11,
            },
          },
        },
      };
    };

    const createDensityStyle = (density) => {
      const spacingMixin = spacing[density].spacing;

      const fontSize = typography.size[densityToTypeSizePaletteIndex[density]];
      const minHeight = typography.getMinHeight(fontSize);

      const iconPositionAdjustment = {
        high: 1,
        medium: 1,
        touch: 4,
      };

      return {
        "&$tooltipRoot": {
          padding: spacingMixin(1),
          letterSpacing: 0, // TODO: Why do we need to define this?
          ...typography.getFace(),
          lineHeight: typography.lineHeight,
          fontSize,
          minHeight,
        },
        "& $stateIcon": {
          top: iconPositionAdjustment[density] || 2,
          verticalAlign: "top",
        },
        "& $title": {
          // WARNING: DIRTY HACK
          // title class has overflow=hidden, causing it to have extra height based on current font size, as explained here:
          // https://stackoverflow.com/questions/25818199/why-does-overflow-hidden-add-additional-height-to-an-inline-block-element/25818809
          // we compensate for this by offsetting by .27ems, which seems to be more or less the extra height allocated to descenders in
          // OpenSans, and ultimately nets us the pixel values we're looking for.
          // IF WE CHANGE FONTS, WE NEED TO RE-EVALUATE WHETHER OR NOT THIS NEEDS ADJUSTING - I'm not sure how much descender lengths vary
          marginBottom: `calc(${spacingMixin(0.5)}px - 0.27em)`,
          top: spacingMixin(0.3),
          color, // TODO: Remove; unneeded as redundant to color specified in tooltipRoot, below
          letterSpacing: 0, // TODO: Why do we need to define this?
          ...typography.getFace("semiBold"),
          lineHeight: typography.lineHeight,
          fontSize,
          minHeight,
        },
      };
    };

    return {
      root: {},
      popper: {
        height: 0,
        overflow: "hidden",
        ...overlayable.tooltip,
        "&[x-placement]": {
          height: "auto",
          overflow: "visible",
        },
      },
      tooltipRoot: {
        color,
        background,
        borderRadius: 0,
        fontSize: 12,
        lineHeight: "1.33333333em",
        maxWidth: 230,
        minHeight: 16,
        opacity: 1,
        position: "relative",
        textAlign: "left",
      },
      tooltipContentRoot: {
        position: "relative",
        display: "flex",
      },
      medium: {
        padding: "12px 16px",
      },
      small: {
        padding: "6px 12px",
      },
      stateIcon: {
        marginRight: 6,
      },
      stateIconContent: {
        verticalAlign: "middle",
      },
      stateIconContainer: {},
      left: {
        "& $arrow": {
          ...generateArrowStyle(
            "top",
            "right",
            "borderLeftColor",
            "borderRightWidth",
            background
          ),
        },
      },
      right: {
        "& $arrow": {
          ...generateArrowStyle(
            "top",
            "left",
            "borderRightColor",
            "borderLeftWidth",
            background
          ),
        },
      },
      top: {
        "& $arrow": {
          ...generateArrowStyle(
            "left",
            "bottom",
            "borderTopColor",
            "borderBottomWidth",
            background
          ),
        },
      },
      bottom: {
        "& $arrow": {
          ...generateArrowStyle(
            "left",
            "top",
            "borderBottomColor",
            "borderTopWidth",
            background
          ),
        },
      },
      body: {},
      title: {
        display: "block",
        fontSize: 14,
        lineHeight: "1.21428571em",
        margin: 0,
        // if we ever change overflow: hidden, we'll also need to
        // adjust the compensation logic in createDensityStyle
        overflow: "hidden",
        padding: 0,
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      },
      arrow: {
        border: "5px solid transparent",
        boxSizing: "border-box",
        position: "absolute",
        "&::after": {
          border: "5px solid transparent",
          content: "''",
          position: "absolute",
        },
      },
      error: createVariantStyle(statusStates.error),
      info: createVariantStyle(statusStates.info),
      success: createVariantStyle(statusStates.success),
      warning: createVariantStyle(statusStates.warning),
      touchDensity: createDensityStyle("touch"),
      lowDensity: createDensityStyle("low"),
      mediumDensity: createDensityStyle("medium"),
      highDensity: createDensityStyle("high"),
    };
  },
  { name: "Tooltip" }
);
