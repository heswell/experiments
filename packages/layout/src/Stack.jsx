import React, { useRef } from "react";
import useLayout from "./useLayout";
import { Action } from "./layout-action";
import Component from "./Component";
import { Tab, TabPanel, Tabstrip } from "./tabs";
import ViewContext, { useViewActionDispatcher } from "./ViewContext";
import { Toolbar, Tooltray } from "./toolbar";
import { registerComponent } from "./registry/ComponentRegistry";
import { CloseIcon, MaximizeIcon, MinimizeIcon } from "./icons";

import "./Stack.css";

const Stack = (inputProps) => {
  const [props, dispatch, ref] = useLayout("Stack", inputProps);
  const {
    enableAddTab,
    layoutId: id,
    keyBoardActivation = "automatic",
    onTabSelectionChanged,
    path,
    style
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
      path: doomedChild.props.path
    });
  };

  const handleAddTab = (e, tabIndex) => {
    dispatch({
      type: Action.ADD,
      component: <Component style={{ backgroundColor: "pink" }} />
    });
  };

  function renderContent() {
    const {
      active = 0,
      children: { [active]: child }
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

  return (
    <div className="Tabs" style={style} id={id} ref={ref}>
      <ViewContext.Provider value={{ dispatch: dispatchViewAction }}>
        <Toolbar className="Header" draggable height={36} maxRows={1}>
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
          <Tooltray align="right">
            <MinimizeIcon />
            <MaximizeIcon />
            <CloseIcon />
          </Tooltray>
        </Toolbar>
        <TabPanel
          id={`${id}-${props.active || 0}-tab`}
          ariaLabelledBy={`${id}-${props.active || 0}`}
          rootId={id}
        >
          {renderContent()}
        </TabPanel>
      </ViewContext.Provider>
    </div>
  );
};
Stack.displayName = "Stack";

export default Stack;

registerComponent("Stack", Stack, 'container');
