import React, { useEffect, useMemo, useRef, useState } from "react";
import cx from "classnames";
import { Icon } from "@heswell/toolkit-2.0";
import useTabstrip from "./useTabstrip";
import useOverflowObserver from "../responsive/useOverflowObserver";
import ActivationIndicator from "./ActivationIndicator";
import OverflowMenu from "../responsive/OverflowMenu";
import Button from "../button/Button";

import "./Tabstrip.css";

const AddTabButton = ({ className, title, ...props }) => {
  return (
    <Button
      className={cx("tab-add", className)}
      {...props}
      variant="secondary"
      tabIndex={0}
    >
      <Icon name="add" accessibleText={title} />
    </Button>
  );
};

const Tabstrip = (props) => {
  const root = useRef(null);
  const { tabProps, tabRefs, activateTab } = useTabstrip(props, root);
  const {
    children,
    enableAddTab,
    onAddTab,
    showActivationIndicator = true,
    style,
    title,
    value,
  } = props;

  const overflowButton = useRef(null);
  const innerContainer = useRef(null);

  const rootHeight = 36;
  const overflowedItems = useOverflowObserver(
    innerContainer,
    rootHeight,
    value
  );

  const handleOverflowChange = (e, tab) => {
    console.log("activate Tab ${tab.index}");
    activateTab(e, tab.index);
  };

  const renderContent = () => {
    const tabs = [
      <div className="row-pillar" key="spacer" style={{ height: 36 }} />,
    ];

    React.Children.toArray(children).forEach((child, index) => {
      const selected = index === value;
      tabs.push(
        React.cloneElement(child, {
          index,
          ...tabProps,
          "data-index": index,
          "data-priority": selected ? 0 : 2,
          ref: tabRefs[index],
          selected,
        })
      );
    });

    tabs.push(
      <OverflowMenu
        data-priority={1}
        data-index={tabs.length - 1}
        key="overflow"
        onChange={handleOverflowChange}
        ref={overflowButton}
        source={overflowedItems}
      />
    );

    if (enableAddTab) {
      tabs.push(
        <AddTabButton
          data-priority={1}
          data-index={tabs.length - 1}
          key="add"
          onClick={onAddTab}
          title={title}
        />
      );
    }

    return tabs;
  };

  return (
    <div className={cx("Tabstrip")} ref={root} role="tablist" style={style}>
      <div
        className="Tabstrip-inner"
        ref={innerContainer}
        style={{ lineHeight: "36px" }}
      >
        {renderContent()}
      </div>
      {showActivationIndicator ? (
        <ActivationIndicator tabRef={tabRefs[value]} />
      ) : null}
    </div>
  );
};

Tabstrip.displayName = "Tabstrip";

export default Tabstrip;
