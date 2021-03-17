import React, { useCallback, useEffect, useRef } from "react";
import cx from "classnames";
import Header from "./Header";
import { registerComponent } from "./registry/ComponentRegistry";
import { useViewActionDispatcher } from "./useViewActionDispatcher";
import useResizeObserver, { WidthHeight } from "./responsive/useResizeObserver";
import useLayout from "./useLayout";
import LayoutContext from "./LayoutContext";
import { useLayoutDispatch } from "./LayoutContext";
import usePersistentState from "./use-persistent-state";

import "./View.css";

const NO_MEASUREMENT = [];

const View = function View(inputProps) {
  const [props, ref] = useLayout("View", inputProps);
  const {
    children,
    className,
    collapsed, // "vertical" | "horizontal" | false | undefined
    closeable,
    expanded,
    id,
    header,
    orientation = "horizontal",
    path,
    resize='responsive', // maybe throttle or debounce ?
    tearOut,
    style = {},
    title,
  } = props;

  const layoutDispatch = useLayoutDispatch();
  const dispatchViewAction = useViewActionDispatcher(ref, path, layoutDispatch);
  const deferResize = resize === "defer";
  const classBase = "hwView";
  const [load, save] = usePersistentState();

  const mainRef = useRef(null);
  const mainSize = useRef({});
  const resizeHandle = useRef(null);

  const setMainSize = useCallback(() => {
    mainRef.current.style.height = mainSize.current.height + 'px';
    mainRef.current.style.width = mainSize.current.width + 'px';
    resizeHandle.current = null;
  },[])

  const onResize = useCallback(({ height, width }) => {
    mainSize.current.height = height;
    mainSize.current.width = width;
    if (resizeHandle.current !== null){
      clearTimeout(resizeHandle.current);
    }
    resizeHandle.current = setTimeout(setMainSize, 40);
  }, [])

  useResizeObserver(ref, deferResize ? WidthHeight : NO_MEASUREMENT, onResize, deferResize)

  const loadState = useCallback((key, stateType) => load(id, key, stateType),[load])
  const saveState = useCallback((state, key, stateType) => save(id, state, key, stateType),[save]);

  const headerProps = typeof header === "object" ? header : {};
  return (
    <div
      className={cx(classBase, className, {
        [`${classBase}-collapsed`]: collapsed,
        [`${classBase}-expanded`]: expanded,
        [`${classBase}-resize-defer`]: resize === 'defer'
      })}
      id={id}
      ref={ref}
      style={style}
      tabIndex={-1}
    >
      <LayoutContext.Provider
        value={{ dispatch: dispatchViewAction, path, title, loadState, saveState }}
      >
        {header ? (
          <Header
            {...headerProps}
            collapsed={collapsed}
            expanded={expanded}
            closeable={closeable}
            orientation={collapsed || orientation}
            tearOut={tearOut}
            title={title}
          />
        ) : null}
        <div
          className={`${classBase}-main`}
          ref={mainRef}>
          {children}
        </div>
      </LayoutContext.Provider>
    </div>
  );
};
View.displayName = "View";

const MemoView = React.memo(View)

export default MemoView;

registerComponent("View", MemoView, "view");
