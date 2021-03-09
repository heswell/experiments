import React from "react";
// import { TerraceAlignment } from "../components/alignment-tools/terrace-with-alignment";

import {
  Flexbox,
  Stack,
  View,
  Component,
  registerComponent,
} from "@heswell/layout";
import { Brown, Red } from "./sample-components";
import "../story.css";

export default {
  title: "Layout/Flexbox",
  component: Flexbox,
};

const StandardToolbar = () => (
  <Toolbar style={{ justifyContent: "flex-end" }} draggable showTitle>
  </Toolbar>
);
registerComponent("StandardToolbar", StandardToolbar);

export const Empty = () => (
  <Flexbox
    style={{
      width: 600,
      height: 300,
      flexDirection: "row",
      border: "2px solid black",
      backgroundColor: "#ccc",
    }}
  ></Flexbox>
);

export const SingleChild = () => (
  <Flexbox
    style={{
      width: 600,
      height: 300,
      flexDirection: "row",
      border: "2px solid black",
      backgroundColor: "#ccc",
    }}
  >
    <Component
      title="R Component"
      style={{
        flex: 1,
        backgroundColor: "red",
        margin: 10,
        border: "3px solid black",
      }}
    />
  </Flexbox>
);

export const SimpleTerrace = () => (
  <Flexbox
    style={{
      width: 600,
      height: 600,
      flexDirection: "column",
      border: "solid 1px lightgrey",
    }}
  >
    <Component resizeable style={{ height: 150 }} />
    <Component resizeable style={{ flex: 1 }} />
  </Flexbox>
);
export const TerraceWithBorderPaddingMargin = () => (
  <Flexbox
    style={{
      width: 600,
      height: 300,
      flexDirection: "row",
      border: "2px solid black",
      margin: 20,
      padding: "10px 30px",
      backgroundColor: "#ccc",
    }}
  >
    <Component
      title="Y Component"
      style={{
        flex: 1,
        backgroundColor: "yellow",
        border: "10px solid rgba(0,0,0,.4)",
      }}
    />
    <Component
      title="R Component"
      style={{ flex: 1, backgroundColor: "red" }}
    />
  </Flexbox>
);

export const TerraceAutoSizing = () => (
  <Flexbox
    style={{
      width: "80%",
      height: 300,
      flexDirection: "row",
      border: "2px solid black",
      margin: 20,
      padding: "10px 30px",
      backgroundColor: "#ccc",
    }}
  >
    <Component
      title="Y Component"
      style={{
        width: 200,
        minHeight: 200,
        maxHeight: 230,
        backgroundColor: "yellow",
        border: "10px solid rgba(0,0,0,.4)",
      }}
      resizeable
    />
    <Component
      title="R Component"
      style={{ width: 300, height: 300, backgroundColor: "red" }}
      resizeable
    />
  </Flexbox>
);

export const TerraceWithHeader = () => (
  <Flexbox
    title="Flexie"
    header={true}
    style={{
      width: 600,
      height: 300,
      flexDirection: "row",
      border: "2px solid black",
      margin: 20,
      padding: "10 30",
      backgroundColor: "#ccc",
    }}
  >
    <Component
      title="Y Component"
      style={{
        flex: 1,
        backgroundColor: "yellow",
        border: "10px solid rgba(0,0,0,.4)",
      }}
    />
    <Component
      title="R Component"
      style={{ flex: 1, backgroundColor: "red" }}
    />
  </Flexbox>
);

export const TowerWithinTerrace = () => (
  <Flexbox
    style={{
      width: 600,
      height: 300,
      flexDirection: "row",
      border: "solid 1px grey",
    }}
  >
    <Component title="Y Component" style={{ flex: 1 }} resizeable />
    <Flexbox style={{ flex: 1, flexDirection: "column" }} resizeable>
      <Component title="B Component" style={{ flex: 1 }} resizeable />
      <Component title="R Component" style={{ height: 100 }} resizeable />
    </Flexbox>
  </Flexbox>
);

//export const TerraceWithAlignment = () => <TerraceAlignment />;

export const QuadTerraceWithinTower = () => (
  <Flexbox style={{ flexDirection: "column", width: 500, height: 500 }}>
    <View header closeable seable title="W Component" style={{height: 100}}> 
    <Component style={{ height: '100%', backgroundColor: "rebeccapurple" }}
    />
    </View>
    <Flexbox style={{ flex: 1, flexDirection: "row" }}>
      <Component
        title="W Component"
        style={{ flex: 1, backgroundColor: "red" }}
        resizeable
        header
      />
      <Component
        title="Y Component"
        style={{ flex: 1, backgroundColor: "green" }}
        resizeable
        header
      />
      <Component
        title="ZY Component"
        style={{ flex: 1, backgroundColor: "blue" }}
        resizeable
        header
      />
      <Component
        title="R Component"
        style={{ flex: 1, backgroundColor: "yellow" }}
        resizeable
        header
      />
    </Flexbox>
  </Flexbox>
);

export const DeeperNesting = () => (
  <Flexbox style={{ width: 800, height: 500, flexDirection: "row" }}>
    <Component
      title="Y Component"
      style={{ flex: 1, backgroundColor: "yellow" }}
      header
      resizeable
    />
    <Flexbox style={{ flex: 1, flexDirection: "column" }} resizeable>
      <Flexbox
        style={{ flex: 2, flexGrow: 1, flexShrink: 1, flexDirection: "row" }}
        resizeable
      >
        <Flexbox style={{ flex: 1, flexDirection: "column" }} resizeable>
          <Component
            title="B Component"
            style={{
              flex: 1,
              flexGrow: 1,
              flexShrink: 1,
              backgroundColor: "orange",
            }}
            header
            resizeable
          />
          <Component
            title="R Component"
            style={{
              flex: 1,
              flexGrow: 1,
              flexShrink: 1,
              backgroundColor: "brown",
            }}
            header
            resizeable
          />
        </Flexbox>
        <Component
          title="R Component"
          style={{ flex: 1, backgroundColor: "rebeccapurple" }}
          header
          resizeable
        />
      </Flexbox>
      <Component
        title="B Component"
        style={{ flex: 1, flexGrow: 1, flexShrink: 1, backgroundColor: "blue" }}
        header
        resizeable
      />
      <Component
        title="R Component"
        style={{ flex: 1, flexGrow: 1, flexShrink: 1, backgroundColor: "red" }}
        header
        resizeable
      />
    </Flexbox>
  </Flexbox>
);

// export const DynamicContainerJSXContent = () =>
//   <Flexbox style={{ width: 600, height: 300, flexDirection: 'row', backgroundColor: '#666' }}>
//     <Component title='R Component' header={true} style={{ backgroundColor: 'yellow', width: 150 }} resizeable />
//     <DynamicContainer style={{ flex: 1 }} resizeable>
//       <TabbedContainer style={{ flex: 1 }} active={0} resizeable>
//         <Component title='Purple' style={{ backgroundColor: 'rebeccapurple' }} />
//         <Component title='Red' style={{ backgroundColor: 'red' }} />
//       </TabbedContainer>
//     </DynamicContainer>
//   </Flexbox>

// export const DynamicContainerJSONContent = () =>
//   <Flexbox style={{ width: 600, height: 300, flexDirection: 'row', backgroundColor: '#666' }}>
//     <Component title='R Component' header={true} style={{ backgroundColor: 'yellow', width: 150 }} resizeable />
//     <DynamicContainer style={{ flex: 1 }} resizeable contentModel={{
//       $id: 'TC1', type: 'TabbedContainer', active: 1, style: { flex: 1 }, children: [
//         { $id: 'c1', type: 'Component', title: 'Purple Rain', style: { backgroundColor: 'rebeccapurple' } },
//         { $id: 'c2', type: 'Component', title: 'Red Eye', style: { backgroundColor: 'red' } }
//       ]
//     }} />
//   </Flexbox>

export const ComplexNestedLayout = () => (
  <Flexbox column style={{ height: "90vh", width: "100vw" }}>
    <Flexbox style={{ flex: 1 }}>
      <View
        closeable
        header
        resizeable
        style={{ minWidth: 50, width: 200 }}
        title="View Palette"
      />
      <Flexbox resizeable column style={{ flex: 1 }}>
        <View header resizeable style={{ flex: 1 }} title="Brown Bear">
          <Brown style={{ height: "100%" }} />
        </View>
        <View header resizeable style={{ flex: 1 }} title="Red Panda">
          <Component style={{ backgroundColor: "red", height: "100%" }} />
        </View>

        <Flexbox resizeable style={{ flex: 1 }}>
          <Stack
            enableAddTab
            resizeable
            showTabs
            style={{ flex: 1 }}
            keyBoardActivation="manual"
          >
            <View removable header resizeable title="Home">
              <Component style={{ backgroundColor: "white", height: "100%" }} />
            </View>
            <View title="Transactions">
              <Component style={{ backgroundColor: "yellow", flex: 1 }} />
            </View>
            <View removable header resizeable title="Loans">
              <Component style={{ backgroundColor: "cream", height: "100%" }} />
            </View>
            <View removable header resizeable title="Checks">
              <Component style={{ backgroundColor: "ivory", height: "100%" }} />
            </View>
            <View removable header resizeable title="Liquidity">
              <Component
                style={{ backgroundColor: "lightgrey", height: "100%" }}
              />
            </View>
          </Stack>
          <Component
            resizeable
            style={{ backgroundColor: "green", width: 50 }}
          />
        </Flexbox>
      </Flexbox>
    </Flexbox>
    <Component style={{ backgroundColor: "grey", height: 32 }} />
  </Flexbox>
);
