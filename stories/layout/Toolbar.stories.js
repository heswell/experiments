import React from "react";
import { Flexbox, Toolbar } from "@heswell/layout";
import { CloseIcon as CloseAction } from "@heswell/layout";

import "@heswell/layout/dist/index.css";
import "@heswell/toolkit-2.0/dist/OpenSans.css";
import "@heswell/toolkit-2.0/dist/theme.css";
import "./layout.css";
import "./popup.css";
import "./drop-menu.css";

export default {
  title: "Layout/Toolbar",
  component: Toolbar,
};

export const EmptyToolbar = ({ width = 500, height = 32 }) => (
  <Toolbar
    title="Tye Boss"
    header
    value={0}
    style={{
      width,
      height,
      backgroundColor: "lightGrey",
    }}
  ></Toolbar>
);

export const SimpleToolbar = ({ width = 500, height = 32 }) => (
  <Toolbar
    title="Tye Boss"
    header
    value={0}
    style={{
      width,
      height,
      backgroundColor: "lightGrey",
    }}
  >
    <CloseAction />
  </Toolbar>
);

export const ResponsiveToolbar = ({ width = 500, height = 32 }) => (
  <Flexbox
    style={{
      width: 600,
      height: 300,
      flexDirection: "row",
      border: "solid 1px lightgrey",
    }}
  >
    <Toolbar
      maxRows={1}
      resizeable
      value={0}
      style={{
        flex: 1,
        height,
      }}
    >
      <CloseAction />
      <CloseAction />
      <CloseAction />
      <CloseAction />
    </Toolbar>
    <div data-resizeable style={{ width: 0, backgroundColor: "white" }} />
  </Flexbox>
);
