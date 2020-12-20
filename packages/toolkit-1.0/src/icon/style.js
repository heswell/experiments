import { createUseStyles } from "react-jss";

import { base } from "../style";

const defaultFontSize = 12;

export default createUseStyles(
  ({
    toolkit: {
      palette: { type, grey300, grey60 },
    },
  }) => ({
    /* Styles applied to the root element */
    root: {
      boxSizing: "border-box",
      lineHeight: 1,
      display: "inline-block",
      position: "relative",
      ...base.iconFont,
      color: type === "dark" ? grey60 : grey300,
    },
    /* Styles applied to the content element */
    content: {
      display: "block",
    },
    /* Styles applied to the root element if `size="small"` */
    small: {
      "& $content": {
        fontSize: defaultFontSize,
      },
    },
    /* Styles applied to the root element if `size="medium"` */
    medium: {
      "& $content": {
        fontSize: defaultFontSize * 2,
      },
    },
    /* Styles applied to the root element if `size="large"` */
    large: {
      "& $content": {
        fontSize: defaultFontSize * 2 * 2,
      },
    },
  }),
  { name: "Icon" }
);
