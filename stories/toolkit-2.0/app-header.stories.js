import React from "react";

import { Flexbox } from "@heswell/layout";
import {
  AppHeader,
  Button,
  Icon,
  Logo,
  Tab,
  Tabstrip,
  Toolbar,
} from "@heswell/toolkit-2.0";

export default {
  title: "Toolkit 2.0/AppHeader",
  component: AppHeader,
};

const ToolbarButton = ({ iconName, ...props }) => (
  <Button variant="secondary" tabIndex={0} {...props}>
    <Icon name={iconName} />
  </Button>
);

export const DefaultAppHeader = () => {
  return (
    <Flexbox
      style={{
        width: "100%",
        height: 400,
        flexDirection: "row",
        border: "solid 1px lightgrey",
      }}
    >
      <AppHeader resizeable>
        <Logo
          appTitle="Toolkit"
          variant="jpm"
          data-index={0}
          data-priority={1}
        />
        <Tabstrip data-index={1} data-priority={2}>
          <Tab label="Home" />
          <Tab label="Transactions" />
          <Tab label="FX" />
          <Tab label="Checks" />
          <Tab label="Loans" />
          <Tab label="Savings" />
          <Tab label="Investments" />
        </Tabstrip>
        <Toolbar data-index={2} data-priority={1}>
          <ToolbarButton iconName="message" />
          <ToolbarButton iconName="search" />
          <ToolbarButton iconName="filter" />
          <ToolbarButton iconName="user" />
          <ToolbarButton iconName="group" />
        </Toolbar>
      </AppHeader>
      <div data-resizeable style={{ width: 0, backgroundColor: "white" }} />
    </Flexbox>
  );
};
