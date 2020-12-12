import React from "react";
import { Toolbar } from "@heswell/layout";
import "@heswell/layout/dist/index.css";
import "../assets/OpenSans.css";
import "../theme.css";
import "./layout.css";
import "./popup.css";
import "./drop-menu.css";

export default {
  title: "Layout/Toolbar",
  component: Toolbar,
};

export const EmptyToolbar = ({ width = 500, height = 32 }) => (
  <Toolbar
    title="Tye Boss"
    header
    value={0}
    style={{
      width,
      height,
      backgroundColor: "lightGrey",
    }}
  ></Toolbar>
);
