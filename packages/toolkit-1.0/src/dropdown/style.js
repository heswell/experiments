import { createUseStyles } from "react-jss";

const iconTopMargin = {
  touch: 3,
  low: 2,
  medium: 2,
  high: 2,
};

const densityToTypeSizePaletteIndex = {
  touch: 70,
  low: 60,
  medium: 50,
  high: 40,
};

export default createUseStyles(({ toolkit, zIndex }) => {
  const {
    palette: { type, white, grey300, grey60, grey900 },
    spacing,
    typography,
  } = toolkit;

  const buttonBackgroundColor = "transparent";
  const buttonTextColor = type === "dark" ? white : grey900;
  const iconColor = type === "dark" ? grey60 : grey300;

  const createDensityStyle = ({ density }) => {
    const spacingMixin = spacing[density].spacing;
    const fontSize = typography.size[densityToTypeSizePaletteIndex[density]];

    return {
      "& $buttonLabel": {
        letterSpacing: 0,
        lineHeight: typography.lineHeight,
        fontSize,
        minHeight: typography.getMinHeight(fontSize),
        ...typography.getFace(),
      },
      "& $icon": {
        marginTop: `${iconTopMargin[density]}px`,
        boxSizing: "content-box",
        paddingLeft: spacingMixin(1),
      },
    };
  };

  return {
    /* Styles applied to the root element */
    root: {
      lineHeight: 0,
      position: "relative",
      display: "inline-block",
      boxSizing: "border-box",
    },
    /* Styles applied to a disabled list */
    disabled: {},
    /* Styles applied to the button element */
    button: {
      "&:hover": {
        backgroundColor: buttonBackgroundColor,
        "& $icon": {
          color: iconColor,
        },
      },
      "&:active, &.active": {
        backgroundColor: buttonBackgroundColor,
        color: buttonTextColor,
        "& $icon": {
          color: buttonTextColor,
        },
      },
    },
    /* Styles applied to the button label element */
    buttonLabel: {
      display: "inline-block",
      overflow: "hidden",
      textOverflow: "ellipsis",
      width: "100%",
      textAlign: "left",
      textTransform: "none",
    },
    /* Styles applied to the content container */
    content: {
      display: "flex",
      flex: 1,
      whiteSpace: "nowrap",
      width: "100%",
      "& $icon": {
        color: iconColor,
      },
    },
    /* Styles applied to the root element if keyboard focused */
    focusVisible: {},
    /* Styles applied to the root element when navigating the list with the keyboard */
    formField: {
      outline: "none",
    },
    fullWidth: {
      width: "100%",
    },
    /* Styles applied to the icon element */
    icon: {
      alignSelf: "center",
    },
    /* Styles applied to the root popper */
    popper: {
      zIndex: zIndex.tooltip - 1,
    },
    /* Styles applied to the root element if `density="low"` */
    touchDensity: createDensityStyle({ density: "touch" }),
    /* Styles applied to the root element if `density="low"` */
    lowDensity: createDensityStyle({ density: "low" }),
    /* Styles applied to the root element if `density="medium"` */
    mediumDensity: createDensityStyle({ density: "medium" }),
    /* Styles applied to the root element if `density="high"` */
    highDensity: createDensityStyle({ density: "high" }),
  };
});
