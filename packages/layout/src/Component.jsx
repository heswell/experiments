import React from "react";
import { registerComponent } from "./registry/ComponentRegistry";

import "./Component.css";

const Component = function Component({ id, isChanged, style, name }, ref) {
  console.log(`render Component ${name}`)
  return <div className="Component" id={id} style={style} />;
};
Component.displayName = "Component";

export default Component;

registerComponent("Component", Component);
