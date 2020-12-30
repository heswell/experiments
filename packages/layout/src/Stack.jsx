import React, { useRef } from "react";
import {
  Button,
  Icon,
  Tab,
  Tabstrip,
  Toolbar,
  Tooltray,
} from "@heswell/toolkit-2.0";
import useLayout from "./useLayout";
import { Action } from "./layout-action";
import View from "./View";
import { typeOf } from "./utils";
import Component from "./Component";
// import { TabPanel } from "./tabs";
import ViewContext, { useViewActionDispatcher } from "./ViewContext";
import {
  isContainer,
  isLayoutComponent,
  registerComponent,
} from "./registry/ComponentRegistry";
import { maximize, minimize } from "./icons";

const CloseIcon = () => (
  <Button className="Tab-closeButton" title="Close View" variant="secondary">
    <Icon accessibleText="Close View" name="close" />
  </Button>
);

const MinimizeIcon = () => (
  <Button
    className="Layout-svg-button"
    title="Minimize View"
    variant="secondary"
  >
    <Icon accessibleText="Minimize View" svg={minimize} />
  </Button>
);

const MaximizeIcon = () => (
  <Button
    className="Layout-svg-button"
    title="Maximize View"
    variant="secondary"
  >
    <Icon accessibleText="Maximize View" svg={maximize} />
  </Button>
);

import "./Stack.css";

const Stack = (inputProps) => {
  const [props, dispatch, ref] = useLayout("Stack", inputProps);
  const {
    enableAddTab,
    layoutId: id,
    keyBoardActivation = "automatic",
    onTabSelectionChanged,
    path,
    showTabs,
    style,
  } = props;

  const dispatchViewAction = useViewActionDispatcher(ref, path, dispatch);

  const handleTabSelection = (e, nextIdx) => {
    dispatch({ type: Action.SWITCH_TAB, path: props.path, nextIdx });
    if (onTabSelectionChanged) {
      onTabSelectionChanged(nextIdx);
    }
  };

  const handleDeleteTab = (e, tabIndex) => {
    const doomedChild = props.children[tabIndex];
    dispatch({
      type: Action.REMOVE,
      path: doomedChild.props.path,
    });
  };

  const handleAddTab = (e, tabIndex) => {
    dispatch({
      type: Action.ADD,
      component: <Component style={{ backgroundColor: "pink" }} />,
    });
  };

  function activeChild() {
    const {
      active = 0,
      children: { [active]: child },
    } = props;
    return child;
  }

  const renderTabs = () =>
    props.children.map((child, idx) => (
      <Tab
        ariaControls={`${id}-${idx}-tab`}
        draggable
        key={idx}
        id={`${id}-${idx}`}
        label={child.props.title}
        deletable={child.props.removable}
      />
    ));

  const child = activeChild();

  return (
    <div className="Tabs" style={style} id={id} ref={ref}>
      <ViewContext.Provider value={{ dispatch: dispatchViewAction }}>
        {showTabs ? (
          <Toolbar className="Header" draggable maxRows={1}>
            <Tabstrip
              enableAddTab={enableAddTab}
              keyBoardActivation={keyBoardActivation}
              onChange={handleTabSelection}
              onAddTab={handleAddTab}
              onDeleteTab={handleDeleteTab}
              value={props.active || 0}
            >
              {renderTabs()}
            </Tabstrip>
            <Tooltray align="right" className="layout-buttons">
              <MinimizeIcon />
              <MaximizeIcon />
              <CloseIcon />
            </Tooltray>
          </Toolbar>
        ) : null}
        {isLayoutComponent(typeOf(child)) ? (
          child
        ) : (
          <View
            className="TabPanel"
            dispatch={dispatch}
            id={`${id}-${props.active || 0}-tab`}
            ariaLabelledBy={`${id}-${props.active || 0}`}
            rootId={id}
          >
            {child}
          </View>
        )}
      </ViewContext.Provider>
    </div>
  );
};
Stack.displayName = "Stack";

export default Stack;

registerComponent("Stack", Stack, "container");
