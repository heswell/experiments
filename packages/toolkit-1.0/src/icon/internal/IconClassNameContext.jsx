import React, { createContext } from "react";
import classNames from "classnames";

const emptyClassName = "";
const IconClassNameContext = createContext(emptyClassName);

const { Provider, Consumer: IconClassNameConsumer } = IconClassNameContext;

const IconClassNameProvider = ({ children, value: className }) => (
  <IconClassNameConsumer>
    {(outerClassName) => (
      <Provider value={classNames(className, outerClassName)}>
        {children}
      </Provider>
    )}
  </IconClassNameConsumer>
);

export default IconClassNameContext;

export { IconClassNameConsumer, IconClassNameProvider };
