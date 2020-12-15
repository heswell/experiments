import React, { useState } from "react";
import { Flexbox, Tab, Tabstrip } from "@heswell/layout";
import "@heswell/layout/dist/index.css";
import "../assets/OpenSans.css";
import "../theme.css";
import "./layout.css";
import "./popup.css";
import "./drop-menu.css";

console.log(Tab, Tabstrip);
export default {
  title: "Layout/Tabstrip",
  component: Tabstrip,
};

export const EmptyTabstrip = ({ width = 500, height = 32 }) => (
  <Tabstrip
    title="Tye Boss"
    header
    value={0}
    style={{
      width,
      height,
      backgroundColor: "lightgrey",
    }}
  >
    <Tab
      // ariaControls={`${id}-${idx}-tab`}
      draggable
      // key={idx}
      // id={`${id}-${idx}`}
      label={`Tab 1`}
    />
  </Tabstrip>
);

export const Responsive = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [tabs, setTabs] = useState([
    "Tab 1",
    "Tab 2 has a longer title",
    "Tab 3 in between",
  ]);

  const handleAddTab = () => {
    setTabs((state) => state.concat([`Tab ${state.length + 1}`]));
  };

  return (
    <Flexbox
      style={{
        width: 600,
        height: 300,
        flexDirection: "row",
        border: "solid 1px lightgrey",
      }}
    >
      <Tabstrip
        enableAddTab
        resizeable
        onAddTab={handleAddTab}
        value={0}
        style={{
          flex: 1,
          height: 32,
        }}
      >
        {tabs.map((label, i) => (
          <Tab label={label} key={i} />
        ))}
      </Tabstrip>
      <div resizeable style={{ width: 0, backgroundColor: "white" }} />
    </Flexbox>
  );
};

const AddableTabs = (props) => {
  const [tabs, setTabs] = useState(["Tab 1", "Tab 2", "Tab 3"]);
  const handleAddTab = () => {
    setTabs((state) => state.concat([`Tab ${state.length + 1}`]));
  };

  return (
    <Tabstrip {...props} enableAddTab onAddTab={handleAddTab}>
      {tabs.map((label, i) => (
        <Tab label={label} key={i} />
      ))}
    </Tabstrip>
  );
};

export const Responsive2 = () => (
  <Flexbox
    style={{
      width: 600,
      height: 300,
      flexDirection: "row",
      border: "solid 1px lightgrey",
    }}
  >
    <AddableTabs resizeable value={0} style={{ flex: 1, height: 32 }} />
    <div resizeable style={{ width: 0, backgroundColor: "white" }} />
  </Flexbox>
);
