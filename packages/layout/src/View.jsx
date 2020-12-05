import React, { useRef } from "react";
import cx from "classnames";
import Header from "./Header";
import { registerComponent } from "./registry/ComponentRegistry";
import ViewContext, { useViewActionDispatcher } from "./ViewContext";
import useLayout from "./useLayout";

import "./View.css";

const View = React.memo(function View(inputProps) {
  const [props, dispatch] = useLayout("View", inputProps);
  const root = useRef(null);
  const { children, className, layoutId: id, header, path, style, title } = props;
  const dispatchViewAction = useViewActionDispatcher(root, path, dispatch);

  const headerProps = typeof header === "object" ? header : {};
  return (
    <div className={cx("View", className)} id={id} ref={root} style={style}>
      <ViewContext.Provider
        value={{ dispatch: dispatchViewAction, path, title }}
      >
        {header ? <Header {...headerProps} /> : null}
        <div className="view-main">{children}</div>
      </ViewContext.Provider>
    </div>
  );
});
View.displayName = "View";

export default View;

registerComponent("View", View);
