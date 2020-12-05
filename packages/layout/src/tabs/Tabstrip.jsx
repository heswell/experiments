import React, { useRef } from "react";
import cx from "classnames";
import useTabstrip from "./useTabstrip";
import { AddIcon } from "../icons";

import "./Tabstrip.css";

const AddTabButton = (props) => {
  return (
    <div className="tab-add" {...props}>
      <AddIcon />
    </div>
  );
};

const Tabstrip = (props) => {
  const root = useRef(null);
  const { indicatorProps, tabProps, tabRef } = useTabstrip(props, root);
  const { children, enableAddTab, onAddTab, style, value } = props;

  const renderTabs = () =>
    React.Children.map(children, (child, index) =>
      React.cloneElement(child, {
        index,
        ...tabProps,
        ref: tabRef[index],
        selected: index === value
      })
    );

  return (
    <div className={cx("Tabstrip")} ref={root} role="tablist" style={style}>
      {renderTabs()}
      {enableAddTab ? <AddTabButton onClick={onAddTab} /> : null}
      {indicatorProps ? (
        <div className="ActiveIndicator" {...indicatorProps} />
      ) : null}
    </div>
  );
};

export default Tabstrip;
