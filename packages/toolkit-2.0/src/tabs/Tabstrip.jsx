import React, { useRef } from "react";
import cx from "classnames";
import { useDensity } from "../theme";
import { Button } from "../button";
import { Icon } from "../icon";
import useTabstrip from "./useTabstrip";
import useOverflowObserver from "../responsive/useOverflowObserver";
import ActivationIndicator from "./ActivationIndicator";
import OverflowMenu from "../responsive/OverflowMenu";

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
  const overflowButton = useRef(null);
  const innerContainer = useRef(null);
  //TODO useTabs should have no knkwledge of overflowing. useOverflowObserver
  // should return  alist of visible tabs and these should be managed by
  // useTabstrip
  const rootHeight = 36; // TODO read from Theme
  const overflowedItems = useOverflowObserver(
    innerContainer,
    rootHeight,
    value
  );

  const { tabProps, tabRefs, activateTab } = useTabstrip(props, root);
  const {
    children,
    enableAddTab,
    onAddTab,
    density: densityProp,
    showActivationIndicator = true,
    style,
    title,
    value,
  } = props;

  const density = useDensity(densityProp);

  const handleOverflowChange = (e, tab) => {
    activateTab(e, tab.index);
  };

  const handleLabelEdited = (evt, index, label) => {
    // TODO need to redraw activation indicatr
    console.log(`Label Edited [${index}] = ${label}`);
  };

  const renderContent = () => {
    const tabs = [];

    React.Children.toArray(children).forEach((child, index) => {
      const selected = index === value;
      const onLabelEdited = child.props.editable
        ? handleLabelEdited
        : undefined;
      tabs.push(
        React.cloneElement(child, {
          index,
          ...tabProps,
          "data-index": index,
          "data-priority": selected ? 0 : 2,
          onLabelEdited,
          ref: tabRefs[index],
          selected,
        })
      );
    });

    tabs.push(
      <OverflowMenu
        className="Tabstrip-overflowMenu"
        data-priority={1}
        data-index={tabs.length - 1}
        data-overflow-indicator
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
          key="Tabstrip-addButton"
          onClick={onAddTab}
          title={title}
        />
      );
    }

    return tabs;
  };

  return (
    <div
      className={cx("Tabstrip", `Tabstrip-${density}Density`)}
      ref={root}
      role="tablist"
      style={style}
    >
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
