import React from "react";
import cx from "classnames";

import "./filter-panel-header.css";

export const FilterPanelHeader = ({ column, onMouseDown }) => {
  return (
    <div
      className={cx("FilterPanelHeader", "col-header", "HeaderCell")}
      onMouseDown={onMouseDown}
    >
      <div className="col-header-inner" style={{ width: column.width - 1 }}>
        {column.name}
      </div>
    </div>
  );
};
