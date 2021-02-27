import React from "react";

import {
  registerComponent,
  useLayoutContext,
  Close as CloseAction,
  Component,
  Flexbox,
  Stack,
  Toolbar,
  View,
  DraggableLayout,
} from "@heswell/layout";

import Builder from "../components/layout-builder/layout-builder";
import { Brown, Red } from "./sample-components";
import Palette from "../components/palette/Palette";

import "../assets/light-theme.css";
import "../story.css";
import "./DraggableLayout.stories.css";

export default {
  title: "Layout/DraggableLayout",
  component: Flexbox,
};

const StandardToolbar = () => (
  <Toolbar style={{ justifyContent: "flex-end" }} draggable showTitle>
    <CloseAction action="close" />
  </Toolbar>
);
registerComponent("StandardToolbar", StandardToolbar);

const Box = (props) => (
  <div
    style={{
      cursor: "pointer",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
    {...props}
  />
);

const DraggableBox = (props) => {
  const DraggableBoxBase = () => {
    const { dispatch, title } = useLayoutContext();
    const handleMouseDown = (e) => {
      // TODO should be able to just dispatch the event
      dispatch({ type: "mousedown" }, e);
    };
    return <Box onMouseDown={handleMouseDown}>{title}</Box>;
  };

  return (
    <View {...props}>
      <DraggableBoxBase />
    </View>
  );
};
registerComponent("DraggableBox", DraggableBox, "view");

export const SimpleNesting = () => (
  <DraggableLayout style={{ width: 800, height: 500 }}>
    <Flexbox style={{ width: "100%", height: "100%", flexDirection: "row" }}>
      <View header resizeable title="Test 1" style={{ width: 250 }}>
        <div style={{ backgroundColor: "yellow", height: "100%" }}>
          <input defaultValue="just a test 1" />
          <input defaultValue="just a test 2" />
        </div>
      </View>
      <Flexbox style={{ flex: 1, flexDirection: "column" }} resizeable>
        <Flexbox
          style={{ flex: 2, flexGrow: 1, flexShrink: 1, flexDirection: "row" }}
          resizeable
        >
          <View header resizeable title="Test 2" style={{ flex: 1 }}>
            <Component style={{ height: "100%", backgroundColor: "orange" }} />
          </View>
          <View header resizeable title="Test 4" style={{ flex: 1 }}>
            <Component
              style={{ height: "100%", backgroundColor: "rebeccapurple" }}
            />
          </View>
        </Flexbox>
        <View header resizeable title="Test 5" style={{ flex: 1 }}>
          <Component style={{ height: "100%", backgroundColor: "blue" }} />
        </View>
        <View header resizeable title="Test 6" style={{ flex: 1 }}>
          <Component style={{ height: "100%", backgroundColor: "pink" }} />
        </View>
      </Flexbox>
    </Flexbox>
  </DraggableLayout>
);

export const CustomDrag = () => (
  // <SelectionProvider>
  <DraggableLayout className="custom1" style={{ border: "solid 1px grey" }}>
    <Flexbox
      style={{ width: 800, height: 500, flexDirection: "row" }}
      splitterSize={1}
    >
      <DraggableBox title="Y Component" style={{ flex: 1 }} resizeable />
      <Flexbox
        style={{ flex: 1, flexDirection: "column" }}
        resizeable
        splitterSize={1}
      >
        <Flexbox
          style={{ flex: 2, flexGrow: 1, flexShrink: 1, flexDirection: "row" }}
          resizeable
          splitterSize={1}
        >
          <Flexbox
            style={{ flex: 1, flexDirection: "column" }}
            resizeable
            splitterSize={1}
          >
            <DraggableBox
              title="B Component"
              style={{ flex: 1, flexGrow: 1, flexShrink: 1 }}
              resizeable
            />
            <DraggableBox
              title="R Component"
              style={{ flex: 1, flexGrow: 1, flexShrink: 1 }}
              resizeable
            />
          </Flexbox>
          <DraggableBox title="T Component" style={{ flex: 1 }} resizeable />
        </Flexbox>
        <DraggableBox
          title="Q Component"
          style={{ flex: 1, flexGrow: 1, flexShrink: 1 }}
          resizeable
        />
        <DraggableBox
          title="Z Component"
          style={{ flex: 1, flexGrow: 1, flexShrink: 1 }}
          resizeable
        />
      </Flexbox>
    </Flexbox>
  </DraggableLayout>
);
// </SelectionProvider>

export const ComplexNestedLayout = () => (
  <DraggableLayout>
    <Flexbox column style={{ height: "90vh", width: "100vw" }}>
      <Flexbox style={{ flex: 1 }}>
        <Palette
          closeable
          header
          resizeable
          style={{ minWidth: 50, width: 200 }}
          title="View Palette"
        />
        <Flexbox resizeable column style={{ flex: 1 }}>
          <View header resizeable style={{ flex: 1 }} title="Brown Bear">
            <Toolbar
              id="palegoldenrod"
              tools={[
                "close",
                "close",
                "close",
                ["PaddingTop", "PaddingRight", "PaddingBottom", "PaddingLeft"],
                "close",
                "close",
                "close",
                "close",
                "close",
              ]}
            />
            <Brown style={{ height: "100%" }} />
          </View>
          <View header resizeable style={{ flex: 1 }} title="Red Panda">
            <Component style={{ backgroundColor: "red", height: "100%" }} />
          </View>

          <Flexbox resizeable style={{ flex: 1 }}>
            <Stack
              showTabs
              enableAddTab
              resizeable
              style={{ flex: 1 }}
              keyBoardActivation="manual"
            >
              <View removable header resizeable title="Home">
                <Component
                  style={{ backgroundColor: "white", height: "100%" }}
                />
              </View>
              <View title="Transactions">
                <Toolbar>
                  {/* <input type="text" className="tool-text" value="text 1" />
                  <input type="text" className="tool-text" value="text 2" />
                  <input type="text" className="tool-text" value="text 3" />
                  <input type="text" className="tool-text" value="text 4" /> */}
                  <CloseAction />
                </Toolbar>
                <Component style={{ backgroundColor: "yellow", flex: 1 }} />
              </View>
              <View removable header resizeable title="Loans">
                <Component
                  style={{ backgroundColor: "cream", height: "100%" }}
                />
              </View>
              <View removable header resizeable title="Checks">
                <Component
                  style={{ backgroundColor: "ivory", height: "100%" }}
                />
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
  </DraggableLayout>
);

export const NestedDragContainerWithPalette = () => <Builder />;
