import React from "react";

import { ThemeProvider, theme } from "@heswell/toolkit-1.0";
import { AppHeader } from "@heswell/toolkit-2.0";

export default {
  title: "Toolkit 2.0/AppHeader",
  component: AppHeader,
};

export const DefaultAppHeader = () => {
  return (
    <ThemeProvider theme={theme}>
      <AppHeader style={{ height: 40 }} />
    </ThemeProvider>
  );
};
