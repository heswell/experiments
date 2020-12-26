import React, { useState } from "react";
import { Flexbox } from "@heswell/layout";
import { Tab, Tabstrip } from "@heswell/toolkit-2.0";
import "@heswell/toolkit-2.0/dist/OpenSans.css";
import "@heswell/toolkit-2.0/dist/ToolkitIcons.css";
import "@heswell/toolkit-2.0/dist/theme.css";
import "@heswell/layout/dist/index.css";

export default {
  title: "Toolkit 2.0/Tabstrip",
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

  const handleChange = (e, tabIndex) => {
    setTabIndex(tabIndex);
  };

  const handleAddTab = () => {
    setTabs((state) => state.concat([`Tab ${state.length + 1}`]));
  };

  console.log("%cTabstrip Example render", "color:red;font-weight: bold;");

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
        onChange={handleChange}
        value={tabIndex}
        style={{
          flex: 1,
        }}
      >
        {tabs.map((label, i) => (
          <Tab label={label} key={i} />
        ))}
      </Tabstrip>
      <div data-resizeable style={{ width: 0, backgroundColor: "white" }} />
    </Flexbox>
  );
};

const AddableTabs = ({ deletable, editable, vertical, ...props }) => {
  const [tabs, setTabs] = useState([
    "Tab 1",
    "Tab 2 has a longer title",
    "Tab 3 in between",
  ]);
  const [tabIndex, setTabIndex] = useState(0);
  const handleAddTab = () => {
    setTabs((state) => state.concat([`Tab ${state.length + 1}`]));
  };
  const handleDeleteTab = (e, tabIndex) => {
    setTabs((state) => state.filter((_, i) => i !== tabIndex));
  };
  const handleChange = (e, tabIndex) => {
    setTabIndex(tabIndex);
  };

  return (
    <Tabstrip
      {...props}
      enableAddTab
      onAddTab={handleAddTab}
      onChange={handleChange}
      onDeleteTab={handleDeleteTab}
      orientation={vertical ? "vertical" : "horizontal"}
      value={tabIndex}
    >
      {tabs.map((label, i) => (
        <Tab deletable={deletable} editable={editable} label={label} key={i} />
      ))}
    </Tabstrip>
  );
};

export const ResponsiveComponent = () => (
  <Flexbox
    style={{
      width: 600,
      height: 300,
      flexDirection: "row",
      border: "solid 1px lightgrey",
    }}
  >
    <AddableTabs resizeable value={0} style={{ flex: 1 }} />
    <div data-resizeable style={{ width: 230, backgroundColor: "white" }} />
  </Flexbox>
);

export const DeletableTabs = () => (
  <Flexbox
    style={{
      width: 600,
      height: 300,
      flexDirection: "row",
      border: "solid 1px lightgrey",
    }}
  >
    <AddableTabs resizeable value={0} style={{ flex: 1 }} deletable />
    <div data-resizeable style={{ width: 0, backgroundColor: "white" }} />
  </Flexbox>
);

export const EditableTabs = () => (
  <Flexbox
    style={{
      width: 600,
      height: 300,
      flexDirection: "row",
      border: "solid 1px lightgrey",
    }}
  >
    <AddableTabs resizeable value={0} style={{ flex: 1 }} editable />
    <div data-resizeable style={{ width: 0, backgroundColor: "white" }} />
  </Flexbox>
);

export const VerticalTabs = () => (
  <Flexbox
    style={{
      width: 600,
      height: 500,
      flexDirection: "column",
      border: "solid 1px lightgrey",
    }}
  >
    <AddableTabs resizeable value={0} style={{ flex: 1 }} editable vertical />
    <div data-resizeable style={{ height: 0, backgroundColor: "white" }} />
  </Flexbox>
);
