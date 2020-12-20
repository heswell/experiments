import { useDebugValue } from "react";
import { useTheme as useThemeWithoutDefault } from "react-jss";

import defaultTheme from "./theme";

export default function useTheme() {
  const theme = useThemeWithoutDefault() || defaultTheme;

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useDebugValue(theme);
  }

  return theme;
}
