import React from "react";
import { Icon } from "../icon";

import State from "./State";

const icons = {
  // No icon for Notify state
  [State.error]: "error",
  [State.success]: "tick",
  [State.warning]: "warning"
};

export default (state) => {
  const StateIcon = (props) =>
    icons[state] ? <Icon name={icons[state]} {...props} /> : null;
  return state ? StateIcon : null;
};
