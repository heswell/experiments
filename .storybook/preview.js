import {Provider, defaultTheme} from '@adobe/react-spectrum';

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
};

const withThemeProvider = (Story, context) => {
  return (
    <Provider theme={defaultTheme} >
      <Story {...context} />
    </Provider>
  );
};

export const decorators = [
  withThemeProvider,
  // withPerformance,
  // withThemeBackground,
];
