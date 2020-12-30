import React, { useState } from "react";

import { Flexbox, Stack, View } from "@heswell/layout";
import {
  AppHeader,
  Button,
  DensityProvider,
  Dropdown,
  Icon,
  Logo,
  Tabstrip,
  Tab,
  Toolbar,
} from "@heswell/toolkit-2.0";

import "../story.css";
import "@heswell/toolkit-2.0/dist/theme.css";

export default {
  title: "Layout/ApplicationLayout",
  component: AppHeader,
};

const ToolbarButton = ({ iconName, ...props }) => (
  <Button variant="secondary" tabIndex={0} {...props}>
    <Icon name={iconName} />
  </Button>
);

export const DefaultAppHeader = () => {
  const [density, setDensity] = useState("medium");
  const [tabIndex, setTabIndex] = useState(0);
  const handleChange = (e, tabIndex) => {
    setTabIndex(tabIndex);
  };

  const handleChangeDensity = (e, value) => {
    setDensity(value);
  };
  return (
    <DensityProvider value={density}>
      <Flexbox column style={{ height: "100vh" }}>
        <AppHeader appTitle="Toolkit">
          <Logo
            appTitle="Toolkit"
            variant="jpm"
            data-index={0}
            data-priority={1}
          />
          <Tabstrip value={tabIndex} onChange={handleChange}>
            <Tab label="Page 1" />
            <Tab label="Page 2" />
            <Tab label="Page 3" />
          </Tabstrip>
          <Toolbar>
            <Dropdown
              initialSelectedItem="medium"
              onChange={handleChangeDensity}
              source={["touch", "low", "medium", "high"]}
            />

            <ToolbarButton iconName="message" />
            <ToolbarButton iconName="search" />
            <ToolbarButton iconName="filter" />
            <ToolbarButton iconName="user" />
            <ToolbarButton iconName="group" />
          </Toolbar>
        </AppHeader>
        <Stack active={tabIndex} style={{ flex: 1 }}>
          <Flexbox style={{ flexDirection: "column" }}>
            <div style={{ height: 90, borderBottom: "solid 1px grey" }} />
            <Flexbox style={{ flex: 1 }}>
              <View header resizeable title="Page 1" style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    height: "100%",
                    justifyContent: "center",
                  }}
                >
                  <span>Page 1</span>
                </div>
              </View>
              <Flexbox resizeable style={{ flex: 1, flexDirection: "column" }}>
                <View header resizeable title="Section 2" style={{ flex: 1 }}>
                  <div style={{ height: "100%" }} />
                </View>
                <Stack resizeable showTabs style={{ height: 150 }}>
                  <View title="Section 3">
                    <div style={{ height: "100%" }} />
                  </View>
                  <View title="Section 4">
                    <div style={{ height: "100%" }} />
                  </View>
                  <View title="Section 5">
                    <div style={{ height: "100%" }} />
                  </View>
                </Stack>
              </Flexbox>
            </Flexbox>
          </Flexbox>
          <div
            title="Page 2"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span>Page 2</span>
          </div>
          <div
            title="Page 3"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span>Page 3</span>
          </div>
        </Stack>
        <div style={{ height: 32, backgroundColor: "lightgrey" }} />
      </Flexbox>
    </DensityProvider>
  );
};
