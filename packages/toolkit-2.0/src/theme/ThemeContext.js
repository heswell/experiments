import { createContext, useContext, useRef } from "react";

const ThemeContext = createContext();

const ICON_SIZE = {
  large: { height: 48 },
  medium: { height: 24 },
  small: { height: 12 },
};
const SIZE = {
  touch: {
    regular: { height: 44 },
    stackable: { height: 60 },
  },
  low: {
    regular: { height: 36 },
    stackable: { height: 48 },
  },
  medium: {
    regular: { height: 28 },
    stackable: { height: 36 },
  },
  high: {
    regular: { height: 20 },
    stackable: { height: 24 },
  },
};

const toolkit = {
  size: {
    getSize({ density = "medium", variant = "regular", iconSize = "small" }) {
      return variant === "icon" ? ICON_SIZE[iconSize] : SIZE[density][variant];
    },
  },
};

const lightTheme = {
  id: "jpmuitk-light",
  toolkit,
};

const darkTheme = {
  id: "jpmuitk-dark",
  toolkit,
};

const availableThemes = {
  light: lightTheme,
  dark: darkTheme,
};

export function ThemeProvider({ children, name = "light" }) {
  const currentTheme = useRef(theme);
  if (theme !== currentTheme.current) {
    console.log(`Theme Change`);
    currentTheme.current = theme;
  }
  const theme = availableThemes[name];
  return (
    <ThemeContext.Provider value={theme}>
      <jpmuitk-theme class={theme.id}>{children}</jpmuitk-theme>
    </ThemeContext.Provider>
  );
}

export const { Consumer: ThemeConsumer } = ThemeContext;

export const useTheme = () => {
  return useContext(ThemeContext);
};
