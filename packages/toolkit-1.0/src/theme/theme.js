const blue30 = "#A4D5F4";
const blue400 = "#2D81BD";
const blue500 = "#2670A9";
const blue700 = "#00477B";
const grey20 = "#EAEDEF";
const grey40 = "#D9DDE3";
const grey60 = "#C5C9D0";
const grey70 = "#B4B7BE";
const grey80 = "#9FA3AA";
const grey90 = "#84878E";
const grey200 = "#61656E";
const grey300 = "#4C505B";
const grey500 = "#3B3F46";
const grey900 = "#161616";
const red10 = "#FFE3E0";
const red500 = "#E32B16";
const green500 = "#24874B";
const orange10 = "#FFE8BF";
const orange700 = "#D65513";

const white = "#ffffff";

const lineHeight = 1.3;

const FONT_SIZE = {
  "10": 8, // TODO: This isn't in the ramp. Validate that it's used
  "20": 9, // TODO: This isn't in the ramp. Validate that it's used
  "30": 10,
  "40": 11, // TODO: This isn't in the ramp. Validate that it's used
  "50": 12,
  "60": 14,
  "70": 16,
  "80": 18,
  "90": 20, // TODO: This isn't in the ramp. Validate that it's used
  "100": 22,
  "110": 24, // TODO: This isn't in the ramp. Validate that it's used
  "120": 26, // TODO: This isn't in the ramp. Validate that it's used
  "130": 30,
  "140": 32, // TODO: This isn't in the ramp. Validate that it's used
  "150": 36, // TODO: This isn't in the ramp. Validate that it's used
  "160": 38, // TODO: 38 is in the ramp but unused. Determine what should happen
  "170": 40, // TODO: This isn't in the ramp. Validate that it's used
  "180": 44,
  "190": 48, // TODO: This isn't in the ramp. Validate that it's used
  "200": 50, // TODO: This isn't in the ramp. Validate that it's used
  "210": 56,
  "220": 58, // TODO: This isn't in the ramp. Validate that it's used
  "230": 60, // TODO: This isn't in the ramp. Validate that it's used
  "240": 64,
  "250": 68, // TODO: This isn't in the ramp. Validate that it's used
};

const spacingValues = (multiplier, args) => {
  if (Array.isArray(args)) {
    return args.map((arg) => arg * multiplier);
  }
};

const roundToEvenNumber = (value) => 2 * Math.round(value / 2);

const ICON_SIZE = {
  large: { height: 48 },
  medium: { height: 24 },
  small: { height: 12 },
};
const SIZE = {
  touch: {
    regular: { height: 44 },
    stackable: { height: 60 },
  },
  low: {
    regular: { height: 36 },
    stackable: { height: 48 },
  },
  medium: {
    regular: { height: 28 },
    stackable: { height: 36 },
  },
  high: {
    regular: { height: 20 },
    stackable: { height: 24 },
  },
};

const STATUS_NEXT = {
  info: {
    icon: "info",
    status: blue500,
  },
  error: {
    icon: "error",
    status: red500,
  },
  warning: {
    icon: "warning",
    status: orange700,
  },
  success: {
    icon: "tick",
    status: green500,
  },
};

const DISABLED_STYLE = {
  regular: {
    cursor: "not-allowed",
    opacity: 0.7,
  },
  graphical: {
    cursor: "not-allowed",
    opacity: 0.4,
  },
};
const SELECTION_STYLES = {
  default: {
    background: white,
    color: grey900,
    textAlign: "left",
  },
  active: {
    background: blue30,
  },
  selected: {
    background: blue500,
    color: white,
  },
};

const CONTAINER_STYLES = {
  container1: {
    background: white,
    borderColor: grey60,
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: 0,
  },
  container2: {
    background: white,
    borderColor: grey60,
    borderWidth: "1px",
    borderBottomWidth: "2px",
    borderStyle: "solid",
    borderRadius: 0,
  },
};

export default {
  toolkit: {
    action: {
      actionVariants: {
        regular: "regular",
        secondary: "secondary",
        cta: "cta",
      },
      getAction({ variant, density = "medium" }) {
        return {
          active: { background: "none", color: "#000" },
          default: { background: "none", color: "#000" },
          hover: { background: "none", color: "#000" },
        };
      },
    },
    container: {
      getContainer(variant = "container1") {
        return CONTAINER_STYLES[variant];
      },
    },
    disabled: {
      getDisabled(variant = "regular") {
        return DISABLED_STYLE[variant];
      },
    },
    focusable: {
      getFocusable() {
        return {
          outlineStyle: "dotted",
          outlineOffset: 0,
          outlineWidth: 2,
        };
      },
    },
    palette: {
      type: "light",
      blue30,
      blue400,
      blue500,
      blue700,
      grey20,
      grey40,
      grey60,
      grey70,
      grey80,
      grey90,
      grey200,
      grey300,
      grey500,
      grey900,
      orange10,
      orange700,
      red10,
      white,
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
    },
    selectable: {
      getSelectable(state) {
        return SELECTION_STYLES[state];
      },
      selectableStates: {
        default: "default",
        active: "active",
        selected: "selected",
      },
    },
    size: {
      getSize({ density = "medium", variant = "regular", iconSize = "small" }) {
        return variant === "icon"
          ? ICON_SIZE[iconSize]
          : SIZE[density][variant];
      },
    },
    spacing: {
      touch: {
        spacing(...args) {
          return spacingValues(16, args);
        },
      },
      low: {
        spacing(...args) {
          return spacingValues(12, args);
        },
      },
      medium: {
        spacing(...args) {
          return spacingValues(8, args);
        },
      },
      high: {
        spacing(...args) {
          return spacingValues(4, args);
        },
      },
    },
    statusNext: {
      getStatus: (status) => STATUS_NEXT[status],
      statusStates: {
        info: "info",
        error: "error",
        warning: "warning",
        success: "success",
      },
    },
    typography: {
      size: FONT_SIZE,
      getFace(variant) {
        if (variant === "bold") {
          return {
            fontWeight: "bold",
          };
        } else {
          return {};
        }
      },
      getMinHeight: (fontSize) => roundToEvenNumber(fontSize * lineHeight),
    },
  },
  zIndex: {
    tooptip: 1000,
  },
};
