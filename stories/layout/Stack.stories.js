import React, {useEffect, useRef} from "react";

import { Component, Flexbox, Stack, View, useLayoutContext } from "@heswell/layout";
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

const StatefulComponent = ({ backgroundColor,initialState=""}) => {

  const {loadState, saveState} = useLayoutContext();
  const state = useRef(loadState() ?? initialState);

  const handleChange = e => {
    console.log(`handle change ${e.target.value}`)
    state.current = e.target.value;
  }

  useEffect(() => () => saveState(state.current) ,[saveState])


  return (
    <textarea style={{width: '100%', height: '100%', backgroundColor}} onChange={handleChange}>
      {state.current}
    </textarea>
  )

}

export const SaveAndRestoreState = () => (
  <Stack showTabs style={{ width: 800, height: 500 }} active={0} resizeable>
    <View style={{flexGrow: 1, flexShrink: 0, flexBasis: 0}} title="Page 1">
      <StatefulComponent backgroundColor="yellow" initialState={JSON.stringify({
        hello: "mum"
      })}/>
    </View>
    <View style={{flexGrow: 1, flexShrink: 0, flexBasis: 0}} title="Page 2">
      <StatefulComponent backgroundColor="#fdfdcb" />
    </View>
  </Stack>
);
