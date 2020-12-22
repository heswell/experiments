import React, { createContext } from "react";
import PropTypes from "prop-types";
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

IconClassNameProvider.propTypes = {
  /**
   * You can wrap a node.
   */
  children: PropTypes.node,
  /**
   * The CSS class name of `Icon`.
   */
  value: PropTypes.string,
};

export default IconClassNameContext;

export { IconClassNameConsumer, IconClassNameProvider };
