import React from "react";
import { Component, registerComponent } from "@heswell/layout";

const Red = ({ style }) => {
  return <Component style={{ ...style, backgroundColor: "red" }} />;
};

export default Red;

registerComponent("Red", Red);
