import React from "react";
import cx from "classnames";
import Header from "./Header";
import { registerComponent } from "./registry/ComponentRegistry";
import { useViewActionDispatcher } from "./useViewActionDispatcher";
import useLayout from "./useLayout";
import LayoutContext from "./LayoutContext";
import { useLayoutDispatch } from "./LayoutContext";

import "./View.css";

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
    resizing,
    tearOut,
    style,
    title,
  } = props;

  const layoutDispatch = useLayoutDispatch();
  const dispatchViewAction = useViewActionDispatcher(ref, path, layoutDispatch);

  const headerProps = typeof header === "object" ? header : {};
  return (
    <div
      className={cx("View", className, {
        "View-collapsed": collapsed,
        "View-expanded": expanded,
      })}
      id={id}
      ref={ref}
      style={style}
      tabIndex={-1}
    >
      <LayoutContext.Provider
        value={{ dispatch: dispatchViewAction, path, title }}
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
        <div className="view-main">{children}</div>
      </LayoutContext.Provider>
    </div>
  );
};
View.displayName = "View";

const MemoView = React.memo(View)

export default MemoView;

registerComponent("View", MemoView, "view");
