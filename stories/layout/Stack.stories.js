import React, { useEffect, useRef, useState } from "react";

import { Component, Flexbox, Stack, View, useLayoutContext } from "@heswell/layout";
import "../story.css";

export default {
  title: "Layout/Stack",
  component: Stack,
};

export const FourTabs = () => {

  const createContent = (index) =>
    <Component title={`Tab ${index}`} style={{ backgroundColor: "green", height: "100%" }} header closeable />;


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
    <View style={{ flexGrow: 1, flexShrink: 0, flexBasis: 0 }} title={`Tab ${index}`} header closeable>
      <Component style={{ backgroundColor: "green", height: "100%" }} />
    </View>

  return (
    <Stack showTabs enableAddTab createNewChild={createContent} style={{ width: 800, height: 500 }} active={0} resizeable preserve>
      <View title="Rebecca" header>
        <Component style={{ backgroundColor: "rebeccapurple", height: '100%', width: '100%' }} />
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

const StatefulComponent = ({ initialState = "", style, stateKey }) => {

  const { loadState, saveState } = useLayoutContext();
  const state = useRef(loadState(stateKey) ?? initialState);
  const [value, setValue] = useState(state.current)

  const handleChange = e => {
    setValue(state.current = e.target.value);
  }

  useEffect(() => () => saveState(stateKey, state.current), [saveState])


  return (
    <textarea style={style} onChange={handleChange} value={value}/>
  )

}

export const SaveAndRestoreState = () => (
  <Stack showTabs style={{ width: 800, height: 500 }} active={0} resizeable>
    <View style={{ flexGrow: 1, flexShrink: 0, flexBasis: 0 }} title="Page 1">
      <StatefulComponent style={{backgroundColor:"yellow", flex: 1}} initialState={JSON.stringify({
        hello: "mum"
      })} />
    </View>
    <View style={{ flexGrow: 1, flexShrink: 0, flexBasis: 0 }} title="Page 2">
      <StatefulComponent  style={{backgroundColor:"#fdfdcb", flex: 1}}/>
    </View>
    <View style={{ flexGrow: 1, flexShrink: 0, flexBasis: 0}} title="Page 3">
        <StatefulComponent style={{flex: 1, backgroundColor: "yellow"}} stateKey="bill"/>
        <StatefulComponent style={{flex: 1, backgroundColor: "orange"}} stateKey="ben"/>
    </View>
  </Stack>
);
