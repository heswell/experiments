// @ts-nocheck
import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import {
  SET_FILTER_DATA_COLUMNS,
  extractFilterForColumn,
} from "@heswell/utils";
import CheckList from "../check-list/check-list";
import FitContent from "../fit-content";

import "./set-filter.css";

const NO_STYLE = {};
const SET_FILTER_DATA_COLUMNS_NO_COUNT = SET_FILTER_DATA_COLUMNS.filter(
  (col) => col.name !== "count"
);

const SetFilter = ({
  className,
  column,
  dataSource,
  filter,
  style = NO_STYLE,
}) => {
  const columnFilter = extractFilterForColumn(filter, column.name);
  const filterColumns =
    filter === null || columnFilter === filter
      ? SET_FILTER_DATA_COLUMNS_NO_COUNT
      : SET_FILTER_DATA_COLUMNS;

  return (
    <div className={cx("SetFilter", className)} style={style}>
      <FitContent>
        {(width, height) => (
          <CheckList
            className="SetList"
            columnSizing="fill"
            columns={filterColumns}
            dataSource={dataSource}
            height={height}
            width={width}
          />
        )}
      </FitContent>
    </div>
  );
};

export default SetFilter;

SetFilter.propTypes = {
  column: PropTypes.any.isRequired,
  dataSource: PropTypes.any.isRequired,
  filter: PropTypes.any,
};
