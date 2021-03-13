import React from "react";

import { Component, Flexbox, Stack, View } from "@heswell/layout";
import "../story.css";

export default {
  title: "Layout/Stack",
  component: Stack,
};

export const FourTabs = () => {

  const createContent = (index) => 
    <Component title={`Tab ${index}`} style={{ backgroundColor: "green", height: "100%" }} header closeable/>;
  

  return (
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
  )
  };

  export const EnableAddTab = () => {

  const createContent = (index) =>
    <View style={{flexGrow: 1, flexShrink: 0, flexBasis: 0}} title={`Tab ${index}`}  header closeable>
     <Component style={{ backgroundColor: "green", height: "100%" }}/>
    </View>

  return (
  <Stack showTabs enableAddTab createNewChild={createContent} style={{ width: 800, height: 500 }} active={0} resizeable preserve>
    <View title="Rebecca" header>
      <Component style={{ backgroundColor: "rebeccapurple", height: '100%', width: '100%' }}  />
    </View>
  </Stack>
  )
  };

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
