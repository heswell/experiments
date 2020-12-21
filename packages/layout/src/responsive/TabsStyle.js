import { createUseStyles } from "react-jss";

import { fade } from "@material-ui/core/styles";

function createLightPalette({
  blue30,
  grey60,
  grey20,
  grey200,
  grey400,
  grey90,
  grey900,
  orange700,
  white,
}) {
  return {
    active: {
      bar: orange700,
      color: grey900,
      overflow: {
        background: grey200,
        color: white,
      },
    },
    barColor: grey60,
    color: grey400,
    hover: {
      background: grey20,
      bar: grey90,
    },
    selection: fade(blue30, 0.99),
  };
}

function createDarkPalette({
  blue700,
  grey40,
  grey400,
  grey600,
  grey80,
  grey90,
  grey900,
  orange500,
  white,
}) {
  return {
    active: {
      bar: orange500,
      color: white,
      overflow: {
        background: grey80,
        color: grey900,
      },
    },
    barColor: grey400,
    color: grey40,
    hover: {
      background: grey600,
      bar: grey90,
    },
    selection: fade(blue700, 0.99),
  };
}

function getPalette({ type, ...palette }) {
  if (type === "dark") {
    return createDarkPalette(palette);
  }
  return createLightPalette(palette);
}

const overflowButtonOffset = {
  high: -3,
  medium: 4,
  low: 6,
  touch: 8,
};

const closeButtonOffset = {
  high: 1,
  medium: 1,
  low: 0,
  touch: 0,
};

const tabWrapperOffset = {
  high: -1,
  medium: 0,
  low: -1,
  touch: 0,
};

const densityToTypeSizeIndex = {
  touch: 70,
  low: 60,
  medium: 50,
  high: 40,
};

export default createUseStyles(
  ({ toolkit: toolkitTheme }) => {
    const {
      disabled: { getDisabled },
      focusable: { getFocusable },
      palette: toolkitPalette,
      spacing,
      size: { getSize },
      typography,
    } = toolkitTheme;

    const createDensityStyle = (density) => {
      const { height } = getSize({ variant: "stackable", density });
      const buttonSize = getSize({ density });
      const spacingMixin = spacing[density].spacing;
      const fontSize = typography.size[densityToTypeSizeIndex[density]];

      return {
        "&$root": {
          height,
        },
        "& $controls": {
          marginTop: overflowButtonOffset[density],
        },
        "& $tabButton": {
          height: "100%",
          paddingLeft: spacingMixin(1),
          paddingRight: spacingMixin(1),
          zIndex: 1,
          "& + $closeButton": {
            top: closeButtonOffset[density],
          },
        },
        "& $closeable $tabButton": {
          borderRight: `solid transparent ${spacingMixin(1)}px`,
        },
        "& $closeButton": {
          height: buttonSize.height,
          padding: [[spacingMixin(0.5), 0]],
          width: buttonSize.height,
          "& .jpmuitk-wrap-icon": {
            display: "inline-block",
          },
        },
        "& $tabWrapper": {
          fontSize,
          top: tabWrapperOffset[density],
        },
        "& $tab": {
          marginRight: spacingMixin(1),
        },
        "& $dropdown, $add": {
          marginLeft: spacingMixin(1),
        },
      };
    };

    const { active, barColor, color, hover, selection } = getPalette(
      toolkitPalette
    );

    return {
      root: {
        alignItems: "center",
        boxSizing: "border-box",
        display: "flex",
        position: "relative",
        "&:before": {
          background: barColor,
          bottom: 0,
          content: '""',
          height: 1,
          left: 0,
          position: "absolute",
          width: "100%",
        },
      },
      base: {
        display: "flex",
        height: "100%",
      },

      overflow: {
        paddingRight: 38.5,
        position: "relative",
        "&$addTab": {
          paddingRight: 77,
        },
      },
      addTab: {
        paddingRight: 38.5,
      },
      button: {},
      indicatorTabs: {
        backgroundColor: active.bar,
        height: "2px",
        "&:before": {
          position: "absolute",
          content: '""',
          left: 0,
          top: 0,
          width: "100%",
          height: "0px",
          borderBottom: "2px solid transparent",
        },
      },
      flexContainerCentered: {
        justifyContent: "center",
      },
      flexContainer: {
        flexWrap: "wrap",
        height: "100%",
      },
      tabs: {
        minHeight: 0,
        overflow: "visible",
        position: "relative",
        height: "100%",
        "& $tab": {
          textDecoration: "none",
        },
      },
      tabsNoBorder: {
        "& $tab": {
          "&:hover, &:focus": {
            borderBottomWidth: "2px",
          },
        },
        "& $indicatorTabs": {
          height: "2px",
        },
        "&$root": {
          "&:before": {
            display: "none",
          },
        },
        "&:before": {
          display: "none",
        },
      },
      tab: {
        boxSizing: "border-box",
        color,
        flex: "0 0 auto",
        ...typography.getFace(),
        height: "100%",
        minWidth: "40px",
        minHeight: 0,
        letterSpacing: "-0.1px",
        opacity: 1,
        outline: "2px solid transparent",
        padding: [[0, 0, 2, 0]],
        position: "relative",
        transition: "opacity .3s ease-in",
        "-webkit-font-smoothing": "antialiased",
        "&:before": {
          background: hover.bar,
          bottom: 0,
          color: barColor,
          content: '""',
          height: 2,
          left: 0,
          opacity: 0,
          position: "absolute",
          right: 0,
        },
        "&:hover:not($tabCloseHover)": {
          backgroundColor: hover.background,
        },
        "&:hover, &:focus": {
          "&:before": {
            opacity: 1,
          },
        },
        "& span": {
          position: "relative",
        },
        "& a": {
          "&:hover": {
            textDecoration: "none",
          },
        },
        "&.adding": {
          opacity: 0,
          transition: "opacity 0s ease-in",
        },
        "&:first-child": {
          marginLeft: 0,
        },
      },
      focusVisible: {
        backgroundColor: hover.background,
        "&::after": {
          backgroundColor: "transparent",
          content: '""',
          display: "block",
          position: "absolute",
          right: 2,
          bottom: 4,
          left: 2,
          top: 2,
          ...getFocusable(),
          outlineOffset: 0,
        },
        "& $closeButton:hover": {
          backgroundColor: "transparent",
        },
      },
      tabButton: {
        color,
        background: "transparent",
        border: 0,
        cursor: "pointer",
        fontFamily: "OpenSans-Regular",
        fontWeight: 500,
        letterSpacing: "-0.1px",
        overflow: "hidden",
        padding: "0",
        textDecoration: "none",
        "&:hover": {
          color,
        },
        "&:focus": {
          outline: "none",
        },
        "& .label-wrapper": {
          maxWidth: 144,
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          "&:before": {
            content: "attr(data-text)",
            display: "block",
            fontFamily: "OpenSans-SemiBold",
            height: 0,
            visibility: "hidden",
          },
        },
      },
      tabSelected: {
        color: `${active.color} !important`,
        fontFamily: "OpenSans-SemiBold",
      },
      currentViewTab: {},
      tabDisabled: {
        ...getDisabled(),
        pointerEvents: "auto",
      },
      tabWrapper: {
        display: "inline-block",
        textTransform: "none",
        verticalAlign: "middle",
        whiteSpace: "nowrap",
        padding: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        width: "100%",
      },
      tabScroller: {
        overflowY: "hidden",
        height: "100%",
      },
      controls: {
        display: "block",
        left: "100%",
        position: "absolute",
        top: 0,
        whiteSpace: "nowrap",
      },
      dropdown: {},
      add: {
        opacity: 1,
        transition: "opacity .3s ease-in",
        "& .jpmuitk-wrap-icon": {
          marginBottom: 1,
        },
      },
      closeButton: {
        color,
        margin: 0,
        display: "inline-block",
        zIndex: 1,
      },
      closeable: {},
      adding: {
        opacity: 0,
        pointerEvents: "none",
        transition: "opacity .3s ease-out",
      },
      input: {
        left: 0,
        margin: 0,
        outline: "0 !important",
        position: "absolute",
        textTransform: "none",
        top: "3px",
        width: "100%",
        zIndex: 1,
        textAlign: "center",
        fontSize: typography.size[50],
        ...typography.getFace(),
        background: "transparent",
        color: active.color,
        border: 0,
        padding: 0,
        "&::-ms-clear": {
          display: "none",
        },
        "&::selection": {
          backgroundColor: selection,
        },
      },
      inputWrapper: {
        display: "block",
        position: "relative",
      },
      tabCloseHover: {},
      tabPlaceholder: {
        margin: 0,
        pointerEvents: "none",
        zIndex: 0,
      },
      overflowMenuOpen: {
        backgroundColor: active.overflow.background,
        "& $overflowIcon": {
          color: active.overflow.color,
        },
      },
      overflowIcon: {},
      highDensity: createDensityStyle("high"),
      mediumDensity: createDensityStyle("medium"),
      lowDensity: createDensityStyle("low"),
      touchDensity: createDensityStyle("touch"),
    };
  },
  { name: "Tabs" }
);
