import React from "react";
import { Flexbox } from "@heswell/layout";
import { CloseIcon as CloseAction } from "@heswell/layout";
import { Button, Icon, Toolbar } from "@heswell/toolkit-2.0";
{
}

import "@heswell/layout/dist/index.css";
import "@heswell/toolkit-2.0/dist/OpenSans.css";
import "@heswell/toolkit-2.0/dist/theme.css";

export default {
  title: "Toolkit 2.0/Toolbar",
  component: Toolbar,
};

const ToolbarButton = ({ iconName, ...props }) => (
  <Button variant="secondary" tabIndex={0} {...props}>
    <Icon name={iconName} />
  </Button>
);

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

export const SimpleToolbar = () => (
  <Flexbox
    style={{
      width: 600,
      height: 300,
      flexDirection: "row",
      border: "solid 1px lightgrey",
    }}
  >
    <Toolbar data-resizeable style={{ flex: 1 }}>
      <ToolbarButton iconName="message" />
      <ToolbarButton iconName="search" />
      <ToolbarButton iconName="filter" />
      <ToolbarButton iconName="user" />
      <ToolbarButton iconName="group" />
    </Toolbar>
    <div data-resizeable style={{ width: 0, backgroundColor: "white" }} />
  </Flexbox>
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
