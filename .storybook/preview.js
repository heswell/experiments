import React from "react";
import { select } from "@storybook/addon-knobs";
import { DensityProvider, ThemeProvider } from "@uitk/toolkit";

const densities = ["touch", "low", "medium", "high"];
const DEFAULT_DENSITY = "medium";

const DEFAULT_THEME = "light";
const availableThemes = ["light", "dark"];

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
};

export const decorators = [
  (Story) => (
    <ThemeProvider name={select("Theme", availableThemes, DEFAULT_THEME)}>
      <DensityProvider value={select("Density", densities, DEFAULT_DENSITY)}>
        <Story />
      </DensityProvider>
    </ThemeProvider>
  ),
];
