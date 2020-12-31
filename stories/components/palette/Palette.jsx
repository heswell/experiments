import React, { useState } from "react";
import { uuid } from "@heswell/utils";
import {
  Action,
  applyLayoutProps,
  Component,
  registerComponent,
  useLayoutContext,
  View,
} from "@heswell/layout";

import "./Palette.css";

// const header = true;
// const resizeable = true;

const getDefaultComponents = (dispatchViewAction) =>
  [
    {
      label: "Blue Monday",
      component: (
        <View header resizeable title="Blue Monday">
          <Component
            style={{
              backgroundColor: "rgba(0,0,255,0.2)",
              height: "100%",
            }}
          />
        </View>
      ),
    },
    {
      caption: "Transmission",
      component: (
        <View header resizeable title="Transmission">
          <Component
            style={{
              backgroundColor: "rgba(0,255,255,0.2)",
              height: "100%",
            }}
          />
        </View>
      ),
    },
    {
      caption: "Shot by both sides",
      component: (
        <View header resizeable title="Shot by both sides">
          <Component
            style={{
              backgroundColor: "rgba(255,255,0,0.2)",
              height: "100%",
            }}
          />
        </View>
      ),
    },
  ].map((item) => ({
    ...item,
    component: applyLayoutProps(item.component, dispatchViewAction),
  }));

const ComponentIcon = ({
  children,
  color,
  backgroundColor,
  idx,
  text,
  onMouseDown,
}) => {
  const handleMouseDown = (evt) => onMouseDown(evt, idx);
  return (
    <div className="ComponentIcon" onMouseDown={handleMouseDown}>
      <span>{text}</span>
      {children}
    </div>
  );
};

const PaletteList = ({ items }) => {
  const { dispatch } = useLayoutContext();
  const [paletteItems] = useState(items || getDefaultComponents(dispatch));

  function handleMouseDown(evt, idx) {
    console.log(`[Palette] mouseDown ${idx}`);
    const { component } = paletteItems[idx];
    const { left, top, width } = evt.currentTarget.getBoundingClientRect();

    const id = uuid();
    dispatch({
      type: Action.DRAG_START,
      evt,
      path: "*",
      component: React.cloneElement(component, { id, key: id }),
      instructions: {
        DoNotRemove: true,
        DoNotTransform: true,
        dragThreshold: 0,
      },
      dragRect: {
        left,
        top,
        right: left + width,
        bottom: top + 150,
        width,
        height: 100,
      },
    });
  }

  return (
    <div className="PaletteList">
      {paletteItems.map(({ component }, idx) => (
        <ComponentIcon
          key={idx}
          idx={idx}
          text={component.props.title}
          color={component.props.iconColor || "#000"}
          backgroundColor={component.props.iconBg || "#333"}
          component={component}
          onMouseDown={handleMouseDown}
        ></ComponentIcon>
      ))}
    </div>
  );
};

export default function Palette({ components, ...props }) {
  return (
    <View className="Palette" {...props}>
      <PaletteList items={components} />
    </View>
  );
}

registerComponent("Palette", Palette, "view");
