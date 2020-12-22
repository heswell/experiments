import { createUseStyles } from "react-jss";

const densityToTypeSizePaletteIndex = {
  touch: 70,
  low: 60,
  medium: 50,
  high: 40,
};

const pipeHeight = {
  high: 12,
  medium: 14,
  low: 16,
  touch: 18,
};

/**
 * The logo uses no standard sizes.
 * These values modify the size of the logo to meet UX spec
 */
const sizeAdjustment = {
  high: -5,
  medium: -8,
  low: -10,
  touch: -12,
};

export default createUseStyles(
  ({
    toolkit: {
      palette: { type, grey300, grey60, grey70, grey400 },
      size: { getSize },
      spacing,
      typography,
    },
  }) => {
    const createDensityStyle = (density) => {
      const spacingMixin = spacing[density].spacing;
      const { height: heightFromTheme } = getSize({ density });

      const height = heightFromTheme + sizeAdjustment[density];

      return {
        "&$root": {
          height,
        },
        "& $logoWrapper": {
          height,
        },
        "& $titlePipe": {
          margin: spacingMixin(0, 2),
          height: pipeHeight[density],
          "&$compact": {
            margin: spacingMixin(0, 1.5),
          },
        },
        fontSize: typography.size[densityToTypeSizePaletteIndex[density]],
      };
    };
    const color = type === "light" ? grey300 : grey70;
    const pipeColor = type === "light" ? grey60 : grey400;
    return {
      root: {
        display: "inline-flex",
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
        "& img": {
          maxHeight: "100%",
        },
        "& svg": {
          maxHeight: "100%",
          maxWidth: "100%",
        },
      },
      logo: {
        fill: color,
        stroke: "none !important",
        margin: "auto",
        textAlign: "center",
      },
      titlePipe: {
        borderRight: `1px solid ${pipeColor}`,
        height: "100%",
      },
      appTitle: {
        color,
        alignSelf: "center",
        position: "relative",
      },
      logoWrapper: {
        display: "inline-flex",
        position: "relative",
        height: "100%",
      },
      defaultLogo: {},
      compact: {},
      highDensity: createDensityStyle("high"),
      mediumDensity: createDensityStyle("medium"),
      lowDensity: createDensityStyle("low"),
      touchDensity: createDensityStyle("touch"),
    };
  },
  { name: "Logo" }
);
