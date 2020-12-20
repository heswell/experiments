import React, { useEffect, useRef, useState } from "react";
import cx from "classnames";
import useTabstrip from "./useTabstrip";
import useOverflowObserver from "../responsive/useOverflowObserver";
import ActivationIndicator from "./ActivationIndicator";
import OverflowMenu from "../responsive/OverflowMenu";
import Button from "../button/Button";
import Icon from "../icon/Icon";

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
  const { tabProps, tabRefs } = useTabstrip(props, root);
  const {
    children,
    enableAddTab,
    onAddTab,
    showActivationIndicator = true,
    style,
    title,
    value,
  } = props;
  const [showOverflow, setShowOverflow] = useState(true);
  const overflowButton = useRef(null);
  const innerContainer = useRef(null);

  const handleOverflowClick = () => {
    setShowOverflow((show) => !show);
  };

  console.log("%c[Tabstrip] render", "color:green;font-weight: bold");

  useEffect(() => {
    console.log("%c[Tabstrip] mounted", "color:blue;font-weight: bold");
    return () => {
      console.log("%c[Tabstrip] unmounted", "color:blue;font-weight: bold");
    };
  }, []);

  const renderContent = () => {
    const tabs = [
      <div className="row-pillar" key="spacer" style={{ height: 36 }} />,
    ];

    React.Children.toArray(children).forEach((child, index) => {
      tabs.push(
        React.cloneElement(child, {
          index,
          ...tabProps,
          "data-index": index,
          "data-priority": 2,
          ref: tabRefs[index],
          selected: index === value,
        })
      );
    });

    if (overflowing) {
      tabs.push(
        <OverflowMenu
          data-priority={1}
          data-index={tabs.length}
          key="overflow"
          onClick={handleOverflowClick}
          ref={overflowButton}
          show={showOverflow}
          source={["Tab 1"]}
        />
      );
    }

    if (enableAddTab) {
      tabs.push(
        <AddTabButton
          data-priority={1}
          data-index={tabs.length}
          key="add"
          onClick={onAddTab}
          title={title}
        />
      );
    }

    return tabs;
  };

  const overflowing = useOverflowObserver(innerContainer, children);

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
        <ActivationIndicator tabRefs={tabRefs} value={value} />
      ) : null}
    </div>
  );
};

Tabstrip.displayName = "Tabstrip";

export default Tabstrip;
