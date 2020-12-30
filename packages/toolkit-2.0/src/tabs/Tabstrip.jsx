import React, { useLayoutEffect, useRef } from "react";
import cx from "classnames";
import { useDensity } from "../theme";
import { Button } from "../button";
import { Icon } from "../icon";
import useTabstrip from "./useTabstrip";
import { OverflowMenu, useOverflowObserver } from "../responsive";
import ActivationIndicator from "./ActivationIndicator";

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
  //TODO useTabs should have no knkwledge of overflowing. useOverflowObserver
  // should return  alist of visible tabs and these should be managed by
  // useTabstrip

  const {
    children,
    enableAddTab,
    keyBoardActivation: _1,
    onAddTab,
    onDeleteTab: _2,
    orientation = "horizontal",
    density: densityProp,
    showActivationIndicator = true,
    style,
    title,
    value,
    ...rootProps
  } = props;

  const selectedIndex = useRef(value);
  const childCount = useRef(React.Children.count(children));

  const [
    innerContainerRef,
    overflowedItems,
    resetOverflow,
  ] = useOverflowObserver(orientation, "Tabstrip");

  const { tabProps, tabRefs, activateTab } = useTabstrip(props, root);

  const density = useDensity(densityProp);

  const handleOverflowChange = (e, tab) => {
    activateTab(e, tab.index);
  };

  const handleLabelEdited = (evt, index, label) => {
    // TODO need to redraw activation indicatr
    console.log(`Label Edited [${index}] = ${label}`);
  };

  // shouldn't we use ref for this ?
  useLayoutEffect(() => {
    // We don't care about changes to overflowedItems here, the overflowObserver
    // always does the right thing. We only care about changes to selected tab
    if (selectedIndex.current !== value) {
      resetOverflow();
      selectedIndex.current = value;
    }
  }, [overflowedItems, value]);

  useLayoutEffect(() => {
    if (React.Children.count(children) !== childCount.current) {
      childCount.current = React.Children.count(children);
      resetOverflow();
    }
  }, [children]);

  const renderContent = () => {
    const tabs = [];

    React.Children.toArray(children).forEach((child, index) => {
      const selected = index === value;
      const onLabelEdited = child.props.editable
        ? handleLabelEdited
        : undefined;
      const overflowed =
        overflowedItems.findIndex((item) => item.index === index) !== -1;
      tabs.push(
        React.cloneElement(child, {
          index,
          ...tabProps,
          "data-index": index,
          "data-priority": selected ? 1 : 3,
          "data-overflowed": overflowed ? true : undefined,
          onLabelEdited,
          orientation,
          ref: tabRefs[index],
          selected,
        })
      );
    });

    tabs.push(
      <OverflowMenu
        className="Tabstrip-overflowMenu"
        data-priority={0}
        data-index={tabs.length}
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
          data-priority={2}
          data-index={tabs.length}
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
      {...rootProps}
      className={cx(
        "Tabstrip",
        `Tabstrip-${density}Density`,
        `Tabstrip-${orientation}`
      )}
      ref={root}
      role="tablist"
      style={style}
    >
      <div
        className="Tabstrip-inner"
        ref={innerContainerRef}
        style={{ lineHeight: "36px" }}
      >
        {renderContent()}
      </div>
      {showActivationIndicator ? (
        <ActivationIndicator
          orientation={orientation}
          tabRef={tabRefs[value ?? 0]}
        />
      ) : null}
    </div>
  );
};

Tabstrip.displayName = "Tabstrip";

export default Tabstrip;
