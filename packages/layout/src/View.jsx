import React, { useRef } from "react";
import cx from "classnames";
import Header from "./Header";
import { registerComponent } from "./registry/ComponentRegistry";
import { useViewActionDispatcher } from "./ViewContext";
import useLayout from "./useLayout";
import LayoutContext from "./LayoutContext";

import { useLayoutDispatch } from "./LayoutContext";

import "./View.css";

const View = React.memo(function View(inputProps) {
  const [props, ref] = useLayout("View", inputProps);
  const layoutDispatch = useLayoutDispatch();
  const {
    children,
    className,
    layoutId: id,
    header,
    path,
    style,
    title,
  } = props;
  const dispatchViewAction = useViewActionDispatcher(ref, path, layoutDispatch);

  const headerProps = typeof header === "object" ? header : {};
  return (
    <div
      className={cx("View", className)}
      id={id}
      ref={ref}
      style={style}
      tabIndex={-1}
    >
      <LayoutContext.Provider
        value={{ dispatch: dispatchViewAction, path, title }}
      >
        {header ? <Header {...headerProps} /> : null}
        <div className="view-main">{children}</div>
      </LayoutContext.Provider>
    </div>
  );
});
View.displayName = "View";

export default View;

registerComponent("View", View, "view");
