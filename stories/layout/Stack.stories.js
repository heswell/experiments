import React from "react";

import { Component, Flexbox, Stack } from "@heswell/layout";
import "../story.css";

export default {
  title: "Layout/Stack",
  component: Stack,
};

export const FourTabs = () => (
  <Stack showTabs style={{ width: 800, height: 500 }} active={0} resizeable>
    <Component
      title="Rebecca"
      style={{ backgroundColor: "rebeccapurple" }}
      header
    />
    <Component title="Red" style={{ backgroundColor: "red" }} header />
    <Component title="Alice" style={{ backgroundColor: "aliceblue" }} header />
    <Component
      title="Cornflower"
      style={{ backgroundColor: "cornflowerblue" }}
      header
    />
  </Stack>
);

export const TabsWithinTabs = () => (
  <Stack showTabs style={{ width: 800, height: 500 }} active={0} resizeable>
    <Stack showTabs active={0} title="Substack 1">
      <Component
        title="Rebecca"
        style={{ backgroundColor: "rebeccapurple" }}
        header
      />
      <Component title="Red" style={{ backgroundColor: "red" }} header />
      <Component
        title="Alice"
        style={{ backgroundColor: "aliceblue" }}
        header
      />
    </Stack>
    <Flexbox title="Nested Substack" style={{ flexDirection: "column" }}>
      <Component
        title="Red"
        style={{ backgroundColor: "red", height: 100 }}
        header
      />
      <Stack showTabs active={0} title="Substack 2">
        <Component
          title="Alice"
          style={{ backgroundColor: "aliceblue" }}
          header
        />
        <Component title="Gordon" style={{ backgroundColor: "brown" }} header />
        <Component title="Jack" style={{ backgroundColor: "black" }} header />
      </Stack>
    </Flexbox>
    <Component
      title="Cornflower"
      style={{ backgroundColor: "cornflowerblue" }}
      header
    />
  </Stack>
);
