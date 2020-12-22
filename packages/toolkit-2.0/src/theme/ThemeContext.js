import { createContext, useContext } from "react";
import defaultTheme from "./theme";

const ThemeContext = createContext(defaultTheme);

export function ThemeProvider({ children, theme }) {
  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export const { Consumer: ThemeConsumer } = ThemeContext;

export const useTheme = () => {
  return useContext(ThemeContext);
};

export default ThemeContext;
