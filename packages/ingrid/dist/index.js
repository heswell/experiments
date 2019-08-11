import React__default, { isValidElement, cloneElement, useCallback, useRef, useEffect, createElement, useContext, forwardRef, useImperativeHandle, memo, Component, useState, useReducer } from 'react';
import cx from 'classnames';
import { rowUtils, DSC, ASC, groupHelpers, sortUtils, arrayUtils, columnUtils, filter, DataTypes } from '@heswell/data';
import { createLogger, logColor } from '@heswell/utils';
import { Motion, spring } from 'react-motion';
import { NumberFilter, SetFilter, MultiColumnFilter } from '@heswell/ingrid-extras';
import ReactDOM from 'react-dom';

const COLUMN_COLLAPSE = 'COLUMN_COLLAPSE';
const COLUMN_EXPAND = 'COLUMN_EXPAND';
const INITIALIZE = 'INITIALIZE';
const ROWCOUNT = 'ROWCOUNT';
const GROUP = 'GROUP';
const SORT = 'SORT';
const SORT_GROUP = 'SORT_GROUP';
const GRID_RESIZE = 'GRID_RESIZE';
const COLUMN_RESIZE_BEGIN = 'COLUMN_RESIZE_BEGIN';
const COLUMN_RESIZE = 'COLUMN_RESIZE';
const COLUMN_RESIZE_END = 'COLUMN_RESIZE_END';
const GROUP_COLUMN_WIDTH = 'GROUP_COLUMN_WIDTH';
const RESIZE_HEADING = 'RESIZE_HEADING';
const MOVE_BEGIN = 'MOVE_BEGIN';
const MOVE = 'MOVE';
const MOVE_END = 'MOVE_END';
const TOGGLE = 'TOGGLE';
const TOGGLE_FILTERS = 'TOGGLE_FILTERS'; // export const SCROLLLEFT = 'SCROLLLEFT';

const SCROLL_LEFT = 'SCROLL_LEFT';
const SCROLL_RIGHT = 'SCROLL_RIGHT';
const RANGE = 'RANGE';
const groupExtend = 'GROUP_EXTEND';

const CHECKBOX = 'checkbox';
const SINGLE_ROW = 'single-row';
const MULTIPLE_ROW = 'multiple-row';
const Selection = {
  Checkbox: CHECKBOX,
  SingleRow: SINGLE_ROW,
  MultipleRow: MULTIPLE_ROW
};

const DEFAULT_TYPE = {
  name: 'string'
};
function renderCellContent(props) {
  const {
    column,
    row
  } = props;
  const {
    type = DEFAULT_TYPE,
    formatter
  } = column;
  const value = row[column.key];

  if (isValidElement(formatter)) {
    return cloneElement(formatter, props);
  } else {
    return formatter(value, type, row);
  }
}

const columnType = column => !column.type ? null : typeof column.type === 'string' ? column.type : column.type.name; // we want to allow css class to be determined by value


function getGridCellClassName(column, value) {
  return cx('GridCell', column.className, columnType(column), column.resizing ? 'resizing' : null, column.moving ? 'moving' : null);
}

var Cell = React__default.memo(({
  idx,
  column,
  row,
  onClick
}) => {
  const style = {
    width: column.width
  };
  const value = row[column.key];
  const clickHandler = useCallback(() => {
    onClick(idx);
  }, [idx, onClick]);
  return React__default.createElement("div", {
    className: getGridCellClassName(column),
    style: style,
    tabIndex: 0,
    onClick: clickHandler
  }, renderCellContent({
    column,
    row
  }));
});

var CheckboxRenderer = React__default.memo(({
  value,
  cellClass,
  column,
  row,
  meta
}) => {
  const isSelected = row[meta.SELECTED] === 1;
  return React__default.createElement("div", {
    className: getGridCellClassName(column),
    style: {
      width: column.width
    },
    tabIndex: 0
  }, !rowUtils.isEmptyRow(row) && React__default.createElement("div", {
    className: "checkbox"
  }, React__default.createElement("i", {
    className: "material-icons"
  }, isSelected ? 'check_box_outline' : 'check_box_outline_blank')));
}); // original checked row.length as part of shouldComponentUpdate

const CHAR_ARROW_UP = String.fromCharCode(11014);
const CHAR_ARROW_DOWN = String.fromCharCode(11015);
const UP1 = 'up1';
const UP2 = 'up2';
const DOWN1 = 'down1';
const DOWN2 = 'down2'; // TODO these sre repeated from PriceFormatter - where shoud they live ?

const FlashStyle = {
  ArrowOnly: 'arrow',
  BackgroundOnly: 'bg-only',
  ArrowBackground: 'arrow-bg'
};
const INITIAL_VALUE = [null, null, null, null];

function useDirection(key, value, column) {
  const ref = useRef();
  const [prevKey, prevValue, prevColumn, prevDirection] = ref.current || INITIAL_VALUE;
  const direction = key === prevKey && column === prevColumn && Number.isFinite(prevValue) && Number.isFinite(value) ? getDirection(prevDirection, prevValue, value, column) : '';
  useEffect(() => {
    ref.current = [key, value, column, direction];
  });
  return direction;
}

var BackgroundCellRenderer = React__default.memo(props => {
  //TODO what baout click handling
  const {
    column,
    row,
    meta
  } = props;
  const {
    key,
    width,
    type: {
      renderer: {
        flashStyle
      }
    }
  } = column;
  const value = row[key];
  const direction = useDirection(row[meta.KEY], value, column);
  const arrow = flashStyle === FlashStyle.ArrowOnly || flashStyle === FlashStyle.ArrowBackground ? direction === UP1 || direction === UP2 ? CHAR_ARROW_UP : direction === DOWN1 || direction === DOWN2 ? CHAR_ARROW_DOWN : null : null;
  const dirClass = direction ? ` ` + direction : '';
  const arrowClass = flashStyle === FlashStyle.ArrowOnly ? ' arrow-only' : flashStyle === FlashStyle.ArrowBackground ? ' arrow' : '';
  return React__default.createElement("div", {
    className: `${getGridCellClassName(column)}${dirClass}${arrowClass}`,
    style: {
      width
    }
  }, React__default.createElement("div", {
    className: "flasher"
  }, arrow), renderCellContent(props));
});

function getDirection(direction, prevValue, newValue, column) {
  if (!Number.isFinite(newValue)) {
    return '';
  } else if (prevValue !== null && newValue !== null) {
    let diff = newValue - prevValue;

    if (diff) {
      // make sure there is still a diff when reduced to number of decimals to be displayed
      const {
        type: dataType
      } = column;
      let decimals = dataType && dataType.formatting && dataType.formatting.decimals;

      if (typeof decimals === 'number') {
        diff = +newValue.toFixed(decimals) - +prevValue.toFixed(decimals);
      }
    }

    if (diff) {
      if (direction === '') {
        if (diff < 0) {
          return DOWN1;
        } else {
          return UP1;
        }
      } else if (diff > 0) {
        if (direction === DOWN1 || direction === DOWN2 || direction === UP2) {
          return UP1;
        } else {
          return UP2;
        }
      } else if (direction === UP1 || direction === UP2 || direction === DOWN2) {
        return DOWN1;
      } else {
        return DOWN2;
      }
    }
  }
}

const Left = 'left';
const Right = 'right';
const None = 'none';
const Capitalize = 'capitalize';
const defaultFormatting = {
  align: Left,
  capitalization: None
};
const defaultOptions = {
  formatting: defaultFormatting
};
class StringFormatter {
  static cellCSS({
    formatting = defaultFormatting
  } = defaultOptions) {
    const {
      align = Left,
      capitalization = None
    } = formatting;
    const result = [];

    if (align === Right) {
      result.push(Right);
    }

    if (capitalization !== Capitalize) {
      result.push(capitalization);
    }

    return result.length ? result.join(' ') : '';
  }

  static formatter(value) {
    return value;
  }

}

const PUNCTUATION_STR = String.fromCharCode(8200);
const DIGIT_STR = String.fromCharCode(8199);
const DECIMALS_AUTO = -1;
const Space = {
  DIGIT: DIGIT_STR,
  TWO_DIGITS: DIGIT_STR + DIGIT_STR,
  THREE_DIGITS: DIGIT_STR + DIGIT_STR + DIGIT_STR,
  FULL_PADDING: [null, PUNCTUATION_STR + DIGIT_STR, PUNCTUATION_STR + DIGIT_STR + DIGIT_STR, PUNCTUATION_STR + DIGIT_STR + DIGIT_STR + DIGIT_STR, PUNCTUATION_STR + DIGIT_STR + DIGIT_STR + DIGIT_STR + DIGIT_STR]
}; // const LEADING_THOUSAND = DIGIT_STR + DIGIT_STR + DIGIT_STR + PUNCTUATION_STR;
//const LEADING_FILL = LEADING_THOUSAND + LEADING_THOUSAND + LEADING_THOUSAND;

const LEADING_FILL = DIGIT_STR + DIGIT_STR + DIGIT_STR + DIGIT_STR + DIGIT_STR + DIGIT_STR + DIGIT_STR + DIGIT_STR + DIGIT_STR;
const Align = {
  Right: 'right',
  Center: 'center',
  Left: 'left'
};
const Zero = {
  DIGIT: '0',
  TWO_DIGITS: '00',
  THREE_DIGITS: '000',
  FULL_PADDING: [null, '.0', '.00', '.000', '.0000']
};

function pad(n, dp, Pad) {
  let len = n.length;
  const diff = dp - len;

  if (diff > 0) {
    if (diff === 1) {
      n = n + Pad.DIGIT;
    } else if (diff === 2) {
      n = n + Pad.TWO_DIGITS;
    } else if (diff === 3) {
      n = n + Pad.THREE_DIGITS;
    }
  } else {
    if (diff < 0) {
      n = n.slice(0, dp);
      len = dp;
    }

    if (Pad === Space && n.charAt(len - 1) === '0') {
      n = n.replace(/0+$/, '');
      return pad(n, dp, Pad);
    }
  }

  return n;
}

function roundDecimal(value, align = Align.Right, decimals = 4, zeroPad, alignOnDecimals) {
  //onsole.log(`roundDecimal ${value} dp ${decimals} align=${align} zeroPad ? ${zeroPad} alignOnDecimals ${alignOnDecimals}`);
  if (value === undefined || typeof value !== 'number' || isNaN(value)) {
    return '';
  }

  let integral, fraction, Pad;
  const [part1, part2 = ''] = value.toString().split('.');
  const actualDecimals = part2.length;
  integral = parseFloat(part1).toLocaleString();

  if (align === Align.Left && alignOnDecimals) {
    integral = padLeft(integral);
  }

  if (decimals === DECIMALS_AUTO || actualDecimals === decimals) {
    fraction = part2;
  } else if (actualDecimals > decimals) {
    fraction = parseFloat('0.' + part2).toFixed(decimals).slice(2);
  } else {
    if (Pad = zeroPad ? Zero : alignOnDecimals && align !== Align.Left ? Space : null) {
      if (actualDecimals === 0) {
        fraction = Pad.FULL_PADDING[decimals];
      } else {
        fraction = pad(part2, decimals, Pad);
      }
    } else {
      fraction = part2;
    }
  }

  return integral + (fraction ? '.' + fraction : '');
}
function padLeft(value, maxLength = 6) {
  return (LEADING_FILL + value).slice(-maxLength);
}

const Right$1 = 'right';
const defaultFormatting$1 = {
  align: Right$1,
  decimals: DECIMALS_AUTO
};

const numberOr = (value, fallback) => typeof value === 'number' ? value : fallback;

class NumberFormatter {
  static cellCSS({
    formatting = defaultFormatting$1
  }) {
    const {
      align = Right$1
    } = formatting;

    if (align === Right$1) {
      return Right$1;
    } else {
      return '';
    }
  }

  static formatter(value, {
    formatting = defaultFormatting$1
  }) {
    const {
      align,
      decimals,
      zeroPad,
      alignOnDecimals = false
    } = formatting;
    const numberOfDecimals = numberOr(decimals, 4);
    const number = typeof value === 'number' ? value : typeof value === 'string' ? parseFloat(value) : null;
    return React__default.createElement("div", {
      className: "num"
    }, roundDecimal(number, align, numberOfDecimals, zeroPad, alignOnDecimals));
  }

}

var GroupCell = React__default.memo(({
  value,
  idx,
  cellClass,
  row,
  column,
  onClick,
  meta
}) => {
  const clickHandler = useCallback(e => {
    e.preventDefault();
    e.stopPropagation();
    onClick(idx);
  }, [idx, onClick]);
  const isExpanded = row[meta.DEPTH] > 0;
  return React__default.createElement("div", {
    className: getGridCellClassName(column),
    style: {
      width: column.width
    },
    tabIndex: 0
  }, getContent(row, column.columns, meta, isExpanded, clickHandler));
});

function getContent(row, columns, meta, rowExpanded, onClick) {
  const count = row[meta.COUNT];
  const result = getValue(row, columns, meta);

  if (result) {
    const [value, depth] = result;
    return React__default.createElement("div", {
      className: "GroupCell",
      style: {
        paddingLeft: depth * 20
      },
      tabIndex: 0,
      onClick: onClick
    }, React__default.createElement("i", {
      className: "material-icons icon"
    }, rowExpanded ? 'arrow_drop_down' : 'arrow_right'), React__default.createElement("span", {
      className: "group-value"
    }, value), React__default.createElement("span", null, " (", count, ")"));
  }
}

function getValue(row, columns, meta) {
  const depth = Math.abs(row[meta.DEPTH]);

  for (let i = 0; i < columns.length; i++) {
    const column = columns[i];

    if (column.groupLevel === depth) {
      return [row[column.key], i];
    }
  }

  return null;
}

const FormatRegistry = {};
const RegistryOfCellRenderers = {};
const defaultFormatter = {
  formatter: value => value == null ? '' : value,
  cellCSS: () => ''
};
function registerFormatter(type, component) {
  FormatRegistry[type] = component;
}
function registerRenderer(type, component) {
  RegistryOfCellRenderers[type] = component;
}
function getFormatter(type = null) {
  const t = type === null ? 'string' : typeof type === 'string' ? type : type.name;
  return FormatRegistry[t] ? FormatRegistry[t] : defaultFormatter;
} // is getCellRenderer the most appropriate name here, as what we return is a
// JSX element, not a renderer

function getCellRenderer(props) {
  const {
    column
  } = props;
  const type = column && column.type && (column.type.renderer ? column.type.renderer.name : column.type.name || null);
  let Type;

  if (type && (Type = RegistryOfCellRenderers[type])) {
    return createElement(Type, props);
  } else if (column.isGroup) {
    return createElement(GroupCell, props);
  } else {
    return createElement(Cell, props);
  }
} // register defaults

registerRenderer('selection-checkbox', CheckboxRenderer);
registerRenderer('background', BackgroundCellRenderer);
registerFormatter('number', NumberFormatter);
registerFormatter('string', StringFormatter);

let size;
function getScrollbarSize() {
  if (size === undefined) {
    let outer = document.createElement('div');
    outer.className = 'scrollable-content';
    outer.style.width = '50px';
    outer.style.height = '50px';
    outer.style.overflowY = 'scroll';
    outer.style.position = 'absolute';
    outer.style.top = '-200px';
    outer.style.left = '-200px';
    const inner = document.createElement('div');
    inner.style.height = '100px';
    inner.style.width = '100%';
    outer.appendChild(inner);
    document.body.appendChild(outer);
    const outerWidth = outer.offsetWidth;
    const innerWidth = inner.offsetWidth;
    document.body.removeChild(outer);
    size = outerWidth - innerWidth;
    outer = null;
  }

  return size;
}
function getColumnWidth(column) {
  const {
    columns
  } = column;
  let outer = document.createElement('div');
  outer.className = 'Grid GroupbyHeaderCell';
  outer.style.cssText = 'display:inline-block';
  outer.innerText = columns.map(col => col.name).join(``);
  document.body.appendChild(outer);
  const w = outer.offsetWidth;
  document.body.removeChild(outer);
  outer = null;
  return w + 50 + (columns.length - 1) * 50;
}

const {
  metaData
} = columnUtils;
function reducer(state, action) {
  return (handlers[action.type] || MISSING_HANDLER)(state, action);
}
const DEFAULT_MODEL_STATE = {
  width: 400,
  height: 300,
  headerHeight: 25,
  rowHeight: 23,
  minColumnWidth: 80,
  groupColumnWidth: 'auto',
  columns: [],
  // Note: values which have never been set are undefined, once set, they are unset to null
  range: undefined,
  sortBy: undefined,
  groupBy: undefined,
  groupState: undefined,
  rowCount: 0,
  scrollbarSize: 15,
  scrollLeft: 0,
  collapsedColumns: null,
  displayWidth: 400,
  totalColumnWidth: 0,
  selectionModel: Selection.MultipleRow,
  meta: null,
  _columns: null,
  _columnMap: null,
  _movingColumn: null,
  _groups: null,
  _overTheLine: 0,
  _columnDragPlaceholder: null,
  _headingDepth: 1,
  _headingResize: undefined
};
const RESIZING = {
  resizing: true
};
const NOT_RESIZING = {
  resizing: false
};
const EMPTY_ARRAY = [];

const MISSING_HANDLER = (state, action) => {
  console.warn(`gridActionHandlers. No handler for action.type ${action.type}`);
  return state;
};

const MISSING_TYPE_HANDLER = state => {
  console.warn(`gridActionHandlers. Invalid action:  missing attribute 'type'`);
  return state;
};

const MAX_OVER_THE_LINE = 20;
const MISSING_TYPE = undefined;
const handlers = {
  [INITIALIZE]: initialize,
  [ROWCOUNT]: setRowCount,
  [SORT]: sort,
  [SORT_GROUP]: sortGroup,
  [GROUP]: setGroupBy,
  [groupExtend]: extendGroup,
  [COLUMN_RESIZE_BEGIN]: columnResizeBegin,
  [GRID_RESIZE]: gridResize,
  [COLUMN_RESIZE]: columnResize,
  [GROUP_COLUMN_WIDTH]: groupColumnWidth,
  [RESIZE_HEADING]: resizeHeading,
  [COLUMN_RESIZE_END]: columnResizeEnd,
  [MOVE_BEGIN]: moveBegin,
  [MOVE]: move,
  [MOVE_END]: moveEnd,
  [TOGGLE]: toggle,
  [RANGE]: setRange,
  // [Action.SCROLLLEFT]: setScrollLeft,
  [SCROLL_LEFT]: autoScrollLeft,
  [SCROLL_RIGHT]: autoScrollRight,
  [COLUMN_COLLAPSE]: collapseColumn,
  [COLUMN_EXPAND]: expandColumn,
  [MISSING_TYPE]: MISSING_TYPE_HANDLER
};
const initModel = model => initialize(DEFAULT_MODEL_STATE, {
  type: INITIALIZE,
  gridState: model
});

function initialize(state, action) {
  const {
    width = state.width,
    height = state.height,
    headerHeight = state.headerHeight,
    rowHeight = state.rowHeight,
    minColumnWidth = state.minColumnWidth,
    groupColumnWidth = state.groupColumnWidth,
    columns = state.columns,
    columnMap = state.columnMap,
    sortBy = state.sortBy,
    groupBy = state.groupBy,
    range = state.range,
    groupState = state.groupState,
    rowCount = state.rowCount,
    scrollbarSize = state.scrollbarSize,
    collapsedColumns = state.collapsedColumns,
    selectionModel = state.selectionModel
  } = action.gridState;
  const preCols = selectionModel === Selection.Checkbox ? [{
    name: '',
    width: 25,
    sortable: false,
    type: {
      name: 'checkbox',
      renderer: {
        name: 'selection-checkbox'
      }
    }
  }] : EMPTY_ARRAY;

  const _columns = preCols.concat(columns.map(toColumn));

  const [_groups, _headingDepth] = splitIntoGroups(_columns, sortBy, groupBy || [], collapsedColumns, minColumnWidth); // problem, this doesn't account for width of grouped cols, as we do it on the raw columns

  const _totalColumnWidth = sumWidth(_columns, minColumnWidth);

  const displayWidth = getDisplayWidth(height - headerHeight, rowHeight * rowCount, width, _totalColumnWidth, scrollbarSize);
  const totalColumnWidth = measure(_groups, displayWidth, minColumnWidth, groupColumnWidth);
  console.log(`initialize rowCount = ${rowCount}`);
  return { ...state,
    width,
    height,
    headerHeight,
    rowHeight,
    rowCount,
    minColumnWidth,
    meta: metaData(columns),
    columns,
    columnMap,
    sortBy,
    groupBy,
    range,
    groupState,
    collapsedColumns,
    selectionModel,
    _headingDepth,
    _columns,
    _groups,
    totalColumnWidth,
    displayWidth
  };
}

function setRowCount(state, {
  rowCount
}) {
  if (rowCount === state.rowCount) {
    return state;
  } else {
    const {
      height,
      headerHeight,
      rowHeight,
      width,
      totalColumnWidth,
      scrollbarSize
    } = state;
    const displayWidth = getDisplayWidth(height - headerHeight, rowHeight * rowCount, width, totalColumnWidth, scrollbarSize);

    if (displayWidth === state.displayWidth) {
      return { ...state,
        rowCount
      };
    } else {
      return initialize(state, {
        gridState: {
          rowCount
        }
      });
    }
  }
}

function sort(state, {
  column,
  direction,
  preserveExistingSort = false
}) {
  const newSortCriteria = [[column.name, direction || (column.sorted === 1 ? DSC : ASC)]];
  const sortBy = state.sortBy === null || preserveExistingSort !== true ? newSortCriteria : state.sortBy.concat(newSortCriteria); // be careful - re-assigns keys to columns

  return initialize(state, {
    gridState: {
      sortBy
    }
  });
}

function sortGroup(state, {
  column
}) {
  const {
    groupBy: existingGroupBy
  } = state;

  if (existingGroupBy) {
    const groupIdx = groupHelpers.indexOfCol(column.name, existingGroupBy);

    if (groupIdx !== -1) {
      const [colName, sortDirection] = existingGroupBy[groupIdx];
      const sortCol = sortDirection === ASC ? [colName, DSC] : [colName, ASC];
      const groupBy = existingGroupBy.map((groupCol, i) => i === groupIdx ? sortCol : groupCol);
      return initialize(state, {
        gridState: {
          groupBy
        }
      });
    }
  }

  return state;
}

function extendGroup(state, {
  column,
  rowCount = state.rowCount
}) {
  const groupBy = groupHelpers.updateGroupBy(state.groupBy, column);
  console.log(`modelReducer applyGroup new Group ${groupBy}`);
  return initialize(state, {
    gridState: {
      groupBy,
      rowCount
    }
  });
}

function setGroupBy(state, {
  column,
  rowCount = state.rowCount
}) {
  const groupBy = [[column.name, ASC]];
  return initialize(state, {
    gridState: {
      groupBy,
      rowCount
    }
  });
}

function toggle(state, {
  groupRow
}) {
  const groupState = toggleGroupState(groupRow, state);
  return { ...state,
    groupState
  };
}

function toggleGroupState(groupedRow, model) {
  let {
    columns,
    columnMap,
    groupBy,
    groupState,
    meta
  } = model;
  const groupLevel = groupedRow[meta.DEPTH];
  const groupByIdx = groupBy.length - Math.abs(groupLevel);
  const newGroupState = groupState === null ? {} : { ...groupState
  };
  let stateEntry = newGroupState;

  for (let i = 0; i <= groupByIdx; i++) {
    const [groupCol] = groupBy[i];
    const column = columns.find(col => col.name === groupCol);
    const key = columnMap[column.name];
    const groupVal = groupedRow[key];

    if (i === groupByIdx) {
      if (stateEntry[groupVal]) {
        stateEntry[groupVal] = null;
      } else {
        stateEntry[groupVal] = i === groupBy.length - 1 ? true : {};
      }
    } else if (stateEntry[groupVal] === true) {
      stateEntry = stateEntry[groupVal] = {};
    } else {
      // clone as we descend
      stateEntry = stateEntry[groupVal] = { ...stateEntry[groupVal]
      };

      if (!stateEntry) {
        console.log(`Grid.toggleGroup something is wrong - trying to toggle a node whose parent is not expanded`);
        return;
      }
    }
  }

  return newGroupState;
}

function setRange(state, {
  lo,
  hi
}) {
  const {
    range
  } = state;

  if (range && lo === range.lo && hi === range.hi) {
    return state;
  } else {
    return { ...state,
      range: {
        lo,
        hi
      }
    };
  }
}

const splitKeys = compositeKey => `${compositeKey}`.split(':').map(k => parseInt(k, 10));

function columnResizeBegin(state, {
  column
}) {
  const {
    updatedGroups: _groups
  } = column.isHeading ? updateGroupHeading(state._groups, column, RESIZING, RESIZING, RESIZING) : updateGroupColumn(state._groups, column, RESIZING);

  let _headingResize = column.isHeading ? {
    lastSizedCol: 0,
    ...getColumnPositions(_groups, splitKeys(column.key))
  } : undefined;

  return { ...state,
    _groups,
    _headingResize
  };
}

function resizeHeading(state, {
  column,
  width
}) {
  if (width === column.width) {
    return state;
  } else {
    const diff = width - column.width;
    const {
      lastSizedCol: pos,
      groupIdx,
      groupColIdx
    } = state._headingResize;
    const [lastSizedCol, diffs] = getColumnAdjustments(pos, groupColIdx.length, diff);
    const _headingResize = {
      lastSizedCol,
      groupIdx,
      groupColIdx
    };
    let newState = state;

    for (let i = 0; i < diffs.length; i++) {
      if (typeof diffs[i] === 'number') {
        const targetCol = state._groups[groupIdx].columns[groupColIdx[i]];
        newState = columnResize({ ...newState,
          _headingResize
        }, {
          column: targetCol,
          width: targetCol.width + diffs[i]
        });
      }
    }

    return newState;
  }
}

function getColumnAdjustments(pos, numCols, diff) {
  const sign = diff < 0 ? -1 : 1;
  const absDiff = diff * sign;
  const numSlotsToFill = Math.min(absDiff, numCols);
  const each = Math.floor(absDiff / numCols);
  let diffs = absDiff % numCols;
  const results = [];

  for (let i = 0; i < numSlotsToFill; i++, pos++) {
    if (pos === numCols) {
      pos = 0;
    }

    results[pos] = sign * (each + (diffs ? 1 : 0));

    if (diffs) {
      diffs -= 1;
    }
  }

  return [pos, results];
}

function gridResize(state, {
  width,
  height
}) {
  return initialize(state, {
    gridState: {
      width,
      height
    }
  });
} // called as a one-off rather than continuous resize, e.g. for grouped column


function groupColumnWidth(state, {
  /*column, */
  width
}) {
  return initialize(state, {
    gridState: {
      groupColumnWidth: width
    }
  });
}

function columnResize(state, {
  column,
  width
}) {
  if (column.width <= state.minColumnWidth && width <= column.width) {
    return state;
  }

  const {
    updatedGroups: _groups,
    updatedGroup,
    groupIdx
  } = updateGroupColumn(state._groups, column, {
    width
  });
  updateColumnHeading(updatedGroup);
  const widthAdjustment = width - column.width;
  const totalColumnWidth = state.totalColumnWidth + widthAdjustment;

  if (totalColumnWidth < state.displayWidth) ;

  updatedGroup.width += widthAdjustment;

  if (updatedGroup.locked) {
    updatedGroup.renderWidth += widthAdjustment;

    for (let i = groupIdx + 1; i < _groups.length; i++) {
      const {
        locked,
        renderLeft,
        renderWidth
      } = _groups[i];
      _groups[i] = { ..._groups[i],
        renderLeft: renderLeft + widthAdjustment,
        renderWidth: locked ? renderWidth : renderWidth - widthAdjustment
      };
    }
  }

  const groupColumnWidth = column.isGroup ? width : state.groupColumnWidth;
  return { ...state,
    _groups,
    totalColumnWidth,
    groupColumnWidth
  };
}

function columnResizeEnd(state, {
  column
}) {
  const columns = column.isHeading ? state.columns // TODO
  : updateColumn(state.columns, column.name, {
    width: column.width
  });
  const {
    updatedGroups: _groups
  } = column.isHeading ? updateGroupHeading(state._groups, column, NOT_RESIZING, NOT_RESIZING, NOT_RESIZING) : updateGroupColumn(state._groups, column, NOT_RESIZING);
  const groupColumnWidth = column.isGroup ? column.width : state.groupColumnWidth;
  return { ...state,
    columns,
    _groups,
    groupColumnWidth,
    _headingResize: undefined
  };
} // function setScrollLeft(state, {scrollLeft}) {
//     return {...state,scrollLeft};
// }


function autoScrollLeft(state, {
  scrollDistance
}) {
  const {
    _overTheLine,
    _movingColumn: column
  } = state;
  const scrollLeft = Math.max(state.scrollLeft + scrollDistance, 0);

  if (scrollLeft === state.scrollLeft) {
    return _overTheLine === 0 ? state : { ...state,
      _overTheLine: 0
    };
  } else if (column) {
    const _virtualLeft = column.left + scrollLeft;

    const _movingColumn = { ...column,
      _virtualLeft
    };
    return _updateColumnPosition({ ...state,
      scrollLeft,
      _movingColumn
    }, column);
  } else {
    return state;
  }
}

function autoScrollRight(state, {
  scrollDistance
}) {
  const {
    totalColumnWidth,
    displayWidth,
    _movingColumn: column,
    _overTheLine
  } = state;
  const maxScroll = totalColumnWidth - displayWidth;
  const scrollLeft = Math.min(state.scrollLeft + scrollDistance, maxScroll);

  if (scrollLeft === state.scrollLeft) {
    return _overTheLine === 0 ? state : { ...state,
      _overTheLine: 0
    };
  } else if (column) {
    const _virtualLeft = column.left + scrollLeft;

    const _movingColumn = { ...column,
      _virtualLeft
    };
    return _updateColumnPosition({ ...state,
      scrollLeft,
      _movingColumn
    }, column);
  } else {
    return state;
  }
}

function moveBegin(state, {
  column,
  scrollLeft = 0
}) {
  const _virtualLeft = getColumnLeft(state._groups, column);

  const left = _virtualLeft - scrollLeft;
  const moveBoundaries = getColumnMoveBoundaries(state._groups);
  const {
    updatedGroups: _groups,
    groupIdx,
    groupColIdx
  } = replaceGroupColumn(state._groups, column, {
    key: 'move-target',
    isPlaceHolder: true,
    width: column.width,
    formatter: column.formatter
  });
  const _movingColumn = { ...column,
    moving: true,
    left,
    _virtualLeft,
    moveBoundaries,
    groupIdx,
    groupColIdx
  };
  return { ...state,
    _groups,
    _movingColumn,
    _columnDragPlaceholder: {
      groupIdx,
      groupColIdx
    },
    scrollLeft
  };
}

function move(state, {
  distance,
  scrollLeft = 0
}) {
  const column = state._movingColumn;
  const oldPosLeft = column.left;
  const canScroll = state.displayWidth < state.totalColumnWidth; // TODO take current scroll position into account when determining farRight

  const farLeft = scrollLeft === 0 ? 0 : -MAX_OVER_THE_LINE;
  const rightLine = state.displayWidth - column.width;
  const farRight = rightLine + (canScroll ? MAX_OVER_THE_LINE : 0);
  const newPosLeft = Math.min(farRight, Math.max(farLeft, oldPosLeft + distance)); // If we slip furthar than farLeft or farRight, we need to capture mouse position  

  const _movingColumn = { ...column,
    left: newPosLeft,
    _virtualLeft: newPosLeft + scrollLeft
  };
  const overTheLineLeft = newPosLeft < 0;
  const overTheLineRight = newPosLeft > rightLine;

  const _overTheLine = overTheLineLeft ? newPosLeft : overTheLineRight ? newPosLeft - rightLine : 0;

  return _updateColumnPosition({ ...state,
    _overTheLine,
    _movingColumn
  }, column);
}

function collapseColumn(state, {
  column
}) {
  const collapsedColumns = state.collapsedColumns === null ? [column.label] : state.collapsedColumns.concat(column.label);
  return initialize(state, {
    gridState: {
      collapsedColumns
    }
  });
}

function expandColumn(state, {
  column
}) {
  const updatedCollapsedColumns = state.collapsedColumns.filter(name => name !== column.label);
  const collapsedColumns = updatedCollapsedColumns.length === 0 ? null : updatedCollapsedColumns;
  return initialize(state, {
    gridState: {
      collapsedColumns
    }
  });
} // This function manipulates state without cloning - it is an internal function called on 
// an already transformed state object to perform additional transformation. 


function _updateColumnPosition(state, prevColumn) {
  const column = state._movingColumn;
  const {
    left: positionsLeft,
    right: positionsRight
  } = column.moveBoundaries;
  const {
    groupColIdx: columnPosition
  } = column;
  let insertionIdx = -1;
  let insertionGroupIdx = -1;
  let groupColCount = 0;
  let earlierGroupColCount = 0;
  let lastGroup = 0;

  if (prevColumn._virtualLeft > column._virtualLeft)
    /* moving left */
    {
      for (let idx = 0, i = 0; i < positionsLeft.length && insertionIdx === -1; i += 2, idx++) {
        insertionGroupIdx = positionsLeft[i + 1];

        if (insertionGroupIdx !== lastGroup) {
          earlierGroupColCount = groupColCount;
          lastGroup = insertionGroupIdx;
        }

        groupColCount += 1;
        const adjustment = idx > columnPosition ? column.width : 0;
        const position = positionsLeft[i] - adjustment;

        if (prevColumn._virtualLeft >= position && column._virtualLeft < position) {
          insertionIdx = (adjustment ? idx - 1 : idx) - earlierGroupColCount;
        }
      }
    } else
    /* moving right */
    {
      // TODO need an adjustment if we are dragging from one group to another
      for (let idx = 0, i = 0; i < positionsRight.length && insertionIdx === -1; i += 2, idx++) {
        insertionGroupIdx = positionsRight[i + 1];

        if (insertionGroupIdx !== lastGroup) {
          earlierGroupColCount = groupColCount;
          lastGroup = insertionGroupIdx;
        }

        groupColCount += 1;
        const adjustment = idx < columnPosition ? column.width : 0;
        const position = positionsRight[i] + adjustment;

        if (prevColumn._virtualLeft + prevColumn.width < position && column._virtualLeft + column.width >= position) {
          insertionIdx = (adjustment ? idx + 1 : idx) - earlierGroupColCount;
        }
      }
    }

  if (insertionIdx !== -1) {
    const {
      groupIdx,
      groupColIdx
    } = state._columnDragPlaceholder;
    const _columnDragPlaceholder = {
      groupIdx: insertionGroupIdx,
      groupColIdx: insertionIdx
    };
    const {
      updatedGroups: _groups
    } = moveGroupColumn(state._groups, groupIdx, groupColIdx, insertionGroupIdx, insertionIdx);
    return { ...state,
      _groups,
      _columnDragPlaceholder
    };
  } else {
    return state;
  }
}

function moveEnd(state, {
  column
}) {
  // eslint-disable-next-line no-unused-vars
  const {
    groupIdx,
    groupColIdx,
    moveBoundaries,
    left,
    ...movingColumn
  } = state._movingColumn;
  const {
    groupColIdx: finalIdx
  } = state._columnDragPlaceholder;
  const {
    updatedGroups: _groups
  } = replaceGroupColumn(state._groups, {
    key: 'move-target'
  }, movingColumn);
  const columns = reorderColumns(state.columns, column, finalIdx);
  replaceColumnHeadings(_groups, state._headingDepth);
  return { ...state,
    columns,
    _groups,
    _movingColumn: null,
    _columnDragPlaceholder: null
  };
}

function updateColumn(columns, name, updates) {
  return columns.map(column => column.name === name ? { ...column,
    ...updates
  } : column);
}

function reorderColumns(columns, column, idx) {
  const from = columns.findIndex(c => c.name === column.name);
  const results = columns.slice();
  const [col] = results.splice(from, 1);
  results.splice(idx, 0, col);
  return results;
}

function moveGroupColumn(groups, fromGroupIdx, fromColumnIdx, toGroupIdx, toColumnIdx) {
  const column = groups[fromGroupIdx].columns[fromColumnIdx];
  const updatedGroups = groups.slice();

  if (fromGroupIdx === toGroupIdx) {
    const updatedGroup = cloneGroup(updatedGroups[fromGroupIdx]);
    updatedGroup.columns.splice(fromColumnIdx, 1);
    updatedGroup.columns.splice(toColumnIdx, 0, column);
    updatedGroups[fromGroupIdx] = updatedGroup;
  } else {
    const shiftLeft = fromGroupIdx > toGroupIdx;
    updatedGroups[fromGroupIdx] = removeColumnFromGroup(updatedGroups[fromGroupIdx], fromColumnIdx, shiftLeft);
    updatedGroups[toGroupIdx] = addColumnToGroup(updatedGroups[toGroupIdx], column, toColumnIdx, shiftLeft);
  }

  return {
    updatedGroups
  };
}

function cloneGroup(group) {
  return { ...group,
    columns: [...group.columns]
  };
}

function removeColumnFromGroup(group, columnIdx, shiftLeft) {
  const updatedGroup = cloneGroup(group);
  const column = updatedGroup.columns[columnIdx];
  updatedGroup.columns.splice(columnIdx, 1);
  updatedGroup.width -= column.width;
  updatedGroup.renderWidth -= column.width;

  if (shiftLeft) {
    updatedGroup.renderLeft += column.width;
  }

  return updatedGroup;
}

function addColumnToGroup(group, column, columnIdx, shiftLeft) {
  const updatedGroup = cloneGroup(group);
  updatedGroup.columns.splice(columnIdx, 0, column);
  updatedGroup.width += column.width;
  updatedGroup.renderWidth += column.width;

  if (!shiftLeft) {
    updatedGroup.renderLeft -= column.width;
  }

  return updatedGroup;
}

function updateGroupHeading(groups, column, headingUpdates, subHeadingUpdates, columnUpdates) {
  const keys = splitKeys(column.key);
  const {
    groupIdx,
    groupHeadingIdx,
    headingColIdx
  } = getHeadingPosition(groups, column);
  const group = groups[groupIdx];
  const updatedGroup = { ...group,
    headings: [...group.headings]
  }; // 1) Apply changes to the target heading ...

  const heading = updatedGroup.headings[groupHeadingIdx];
  const updatedHeading = [...heading];
  updatedGroup.headings[groupHeadingIdx] = updatedHeading;
  updatedHeading[headingColIdx] = { ...column,
    ...headingUpdates
  }; // 2) Optionally, apply updates to nested sub-headings ...

  if (subHeadingUpdates) {
    for (let i = 0; i < groupHeadingIdx; i++) {
      const h = updatedGroup.headings[i];
      let updatedH = null;

      for (let j = 0; j < h.length; j++) {
        if (column.key.indexOf(h[j].key) !== -1) {
          updatedH = updatedH || [...h];
          updatedH[j] = { ...h[j],
            ...subHeadingUpdates
          };
        }
      }

      if (updatedH !== null) {
        updatedGroup.headings[i] = updatedH;
      }
    }
  } // 3) Optionally, apply updates to underlying columns ...


  if (columnUpdates) {
    const {
      groupColIdx
    } = getColumnPositions(groups, keys);
    updatedGroup.columns = [...group.columns];
    groupColIdx.forEach(idx => {
      const updatedColumn = { ...updatedGroup.columns[idx],
        ...columnUpdates
      };
      updatedGroup.columns[idx] = updatedColumn;
    });
  }

  const updatedGroups = [...groups];
  updatedGroups[groupIdx] = updatedGroup;
  return {
    updatedGroups,
    updatedGroup
  };
}

function updateGroupColumn(groups, column, updates) {
  const {
    groupIdx,
    groupColIdx
  } = getColumnPosition(groups, column);
  const group = groups[groupIdx];
  const updatedGroup = { ...group,
    columns: [...group.columns]
  };
  const updatedColumn = { ...column,
    ...updates
  };
  updatedGroup.columns[groupColIdx] = updatedColumn;
  const updatedGroups = [...groups];
  updatedGroups[groupIdx] = updatedGroup;
  return {
    updatedGroups,
    updatedGroup,
    updatedColumn,
    groupIdx,
    groupColIdx
  };
}

function replaceGroupColumn(groups, targetColumn, replacementColumn) {
  const {
    groupIdx,
    groupColIdx
  } = getColumnPosition(groups, targetColumn);
  const group = groups[groupIdx];
  const updatedGroup = { ...group,
    columns: [...group.columns]
  };
  updatedGroup.columns[groupColIdx] = replacementColumn;
  const updatedGroups = [...groups];
  updatedGroups[groupIdx] = updatedGroup;
  return {
    updatedGroups,
    updatedGroup,
    groupIdx,
    groupColIdx
  };
}

function getHeadingPosition(groups, column) {
  for (let i = 0; i < groups.length; i++) {
    const {
      headings = null
    } = groups[i];

    for (let j = 0; headings && j < headings.length; j++) {
      const idx = headings[j].findIndex(h => h.key === column.key && h.label === column.label);

      if (idx !== -1) {
        return {
          groupIdx: i,
          groupHeadingIdx: j,
          headingColIdx: idx
        };
      }
    }
  }

  return {
    groupIdx: -1,
    groupHeadingIdx: -1,
    headingColIdx: -1
  };
}

function getColumnPosition(groups, column) {
  for (let i = 0; i < groups.length; i++) {
    const idx = groups[i].columns.findIndex(c => c.key === column.key);

    if (idx !== -1) {
      return {
        groupIdx: i,
        groupColIdx: idx
      };
    }
  }

  return {
    groupIdx: -1,
    groupColIdx: -1
  };
}

const columnKeysToIndices = (keys, columns) => keys.map(key => columns.findIndex(c => c.key === key));

const columnKeysToColumns = (keys, columns) => keys.map(key => columns.find(c => c.key === key));

function getColumnPositions(groups, keys) {
  for (let i = 0; i < groups.length; i++) {
    const indices = columnKeysToIndices(keys, groups[i].columns);

    if (indices.every(key => key !== -1)) {
      return {
        groupIdx: i,
        groupColIdx: indices
      };
    }
  }

  return {
    groupIdx: -1,
    groupColIdx: []
  };
} // TODO missing presenter/formatter etc details


function toColumn(column) {
  //TODO roll cellCSS into className
  const {
    name,
    label = name
  } = column; // >>>>> Don't like rolling functions into model, think about this
  // we should keep the model clean here and enrich it beofre passing into render tree
  // type is not sufficient, need to look at formatting metadata

  const presenter = getFormatter(column.type);
  return { ...column,
    label: column.heading ? Array.isArray(column.heading) ? column.heading[0] : column.heading : label,
    formatter: presenter.formatter,
    cellCSS: presenter.cellCSS(column.type)
  };
}

const getWidth = minWidth => column => Math.max(column.width || 0, minWidth);

const add = (val1, val2) => val1 + val2;

function sumWidth(list, minWidth = 0) {
  return list.length === 0 ? 0 : list.map(getWidth(minWidth)).reduce(add);
}

function updateColumnHeading(group) {
  if (group.headings) {
    const columns = group.columns;
    group.headings = group.headings.map(heading => heading.map(colHeading => {
      const indices = columnKeysToIndices(splitKeys(colHeading.key), columns);
      const colWidth = indices.reduce((sum, idx) => sum + columns[idx].width, 0);
      return colWidth === colHeading.width ? colHeading : { ...colHeading,
        width: colWidth
      };
    }));
  }
}

function replaceColumnHeadings(groups, maxHeadingDepth) {
  if (maxHeadingDepth > 1) {
    groups.forEach(group => {
      const headings = [];
      group.columns.forEach(column => {
        addColumnToHeadings(maxHeadingDepth, column, headings);
      });
      group.headings = headings;
    });
  }

  return maxHeadingDepth;
}

function endsWith(string, subString) {
  const str = typeof string === 'string' ? string : string.toString();
  return subString.length >= str.length ? false : str.slice(-subString.length) === subString;
}

function splitIntoGroups(columns, sortBy = null, groupBy = null, collapsedColumns = null, minColumnWidth) {
  const sortMap = sortUtils.sortByToMap(sortBy);
  const groups = [];
  const maxHeadingDepth = Math.max(...columns.map(({
    heading
  }) => Array.isArray(heading) ? heading.length : 1));
  let group = null;
  const [groupColumn, nonGroupedColumns] = extractGroupColumn(columns, groupBy, minColumnWidth);

  if (groupColumn) {
    const headings = maxHeadingDepth > 1 ? [] : undefined;
    groups.push(group = {
      locked: false,
      columns: [groupColumn],
      headings,
      width: 0,
      renderWidth: 0,
      renderLeft: 0
    });
    addColumnToHeadings(maxHeadingDepth, groupColumn, group.headings);
  }

  for (let i = 0; i < nonGroupedColumns.length; i++) {
    const column = nonGroupedColumns[i];
    const {
      key: columnKey,
      name,
      locked = false
    } = column;

    if (group === null || group.locked !== locked) {
      const headings = maxHeadingDepth > 1 ? [] : undefined;
      groups.push(group = {
        locked,
        columns: [],
        headings,
        width: 0,
        renderWidth: 0,
        renderLeft: 0
      });
    } // TODO for each collapsed heading, insert a placeholder


    const sorted = sortMap[name];
    addColumnToHeadings(maxHeadingDepth, column, group.headings, collapsedColumns);
    let {
      hidden
    } = column;

    if (group.headings) {
      const lastColHeaders = group.headings.map(heading => heading[heading.length - 1]);
      const collapsedHeading = lastColHeaders.find(header => header.collapsed);
      hidden = hidden || !!collapsedHeading;

      if (collapsedHeading && collapsedHeading.key === columnKey) {
        group.columns.push({
          key: collapsedHeading.key,
          isPlaceHolder: true,
          width: 25
        });
      }
    }

    group.columns.push({ ...column,
      sorted,
      hidden
    });
  }

  return [groups, maxHeadingDepth];
}

function extractGroupColumn(columns, groupBy, minColumnWidth) {
  if (groupBy) {
    const isGroup = ({
      name
    }) => groupHelpers.indexOfCol(name, groupBy) !== -1;

    const [groupedColumns, rest] = arrayUtils.partition(columns, isGroup);
    const groupCount = groupBy.length;

    if (groupedColumns.length) {
      const groupCols = groupedColumns.map(column => {
        const idx = groupHelpers.indexOfCol(column.name, groupBy);
        return { ...column,
          groupLevel: groupCount - idx
        };
      });
      const groupCol = {
        key: -1,
        name: 'group-col',
        isGroup: true,
        columns: groupCols,
        width: Math.max(...groupCols.map(col => col.width || minColumnWidth)) + 50
      };
      return [groupCol, rest];
    }
  }

  return [null, columns];
}

function addColumnToHeadings(maxHeadingDepth, column, headings, collapsedColumns = null) {
  const sortable = false;
  const collapsible = true;
  const isHeading = true;
  const {
    key,
    heading: colHeader = [column.name],
    width
  } = column;

  for (let depth = 1; depth < maxHeadingDepth; depth++) {
    const heading = headings[depth - 1] || (headings[depth - 1] = []);
    const colHeaderLabel = colHeader[depth];
    const lastHeading = heading.length > 0 ? heading[heading.length - 1] : null;

    if (colHeaderLabel !== undefined) {
      if (lastHeading && lastHeading.label === colHeader[depth]) {
        lastHeading.width += width;
        lastHeading.key += `:${key}`;
      } else {
        const collapsed = collapsedColumns && collapsedColumns.indexOf(colHeaderLabel) !== -1;
        let hide = false;

        if (collapsed) {
          // lower depth headings are subheadings, nested subheadings below a collapsed heading
          // will be hidden. Q: would it be better to iterate higher to lower ? When we encounter
          // a collapsed heading for a given column, the first subheading at any lower level 
          // will already have been created, so we need to hide them.
          for (let d = 0; d < depth - 1; d++) {
            const head = headings[d];
            head[head.length - 1].hidden = true;
          }
        } else if (depth < maxHeadingDepth - 1) {
          // ...likewise if we encounter a subheading, which is not the first for a given
          // higher -level heading, and that higher-level heading is collapsed, we need to hide it.
          for (let d = depth; d < maxHeadingDepth; d++) {
            const head = headings[d];
            const colHeadingLabel = colHeader[d + 1];

            if (head && head.length && colHeaderLabel) {
              const {
                collapsed: isCollapsed,
                hidden,
                label
              } = head[head.length - 1];

              if ((isCollapsed || hidden) && label === colHeadingLabel) {
                hide = true;
              }
            }
          }
        }

        heading.push({
          key,
          label: colHeaderLabel,
          width,
          sortable,
          collapsible,
          collapsed,
          hidden: hide,
          isHeading
        });
      }
    } else {
      const lowerDepth = headings[depth - 2];
      const lastLowerDepth = lowerDepth ? lowerDepth[lowerDepth.length - 1] : null;

      if (lastLowerDepth && lastLowerDepth.key === key) {
        // Need to check whether a heading at level below is collapsed
        heading.push({
          key,
          label: '',
          width,
          collapsed: lastLowerDepth.collapsed,
          sortable,
          isHeading
        });
      } else if (lastLowerDepth && endsWith(lastLowerDepth.key, `:${key}`)) {
        lastHeading.width += width;
        lastHeading.key += `:${key}`;
      } else {
        heading.push({
          key,
          label: '',
          width,
          isHeading
        });
      }
    }
  }
}

function measure(groups, displayWidth, minColumnWidth, groupColumnWidth) {
  const columns = flatMap(groups);
  const [firstColumn] = columns;

  if (groupColumnWidth && firstColumn.isGroup) {
    firstColumn.width = Math.max(groupColumnWidth === 'auto' ? getColumnWidth(firstColumn) : groupColumnWidth, firstColumn.width);
  }

  const visibleColumns = columns.filter(col => !col.hidden);
  const [unsizedCols, sizedCols] = partition(visibleColumns, col => col.width === undefined, col => !col.hidden);
  let totalColumnWidth = sumWidth(sizedCols);
  const defaultCount = visibleColumns.length - sizedCols.length; //TODO pluggable width assignment algo
  // default behaviour - give each columns at least the min col width. If there is surplus space,
  // divide it equally between the no-width columns. (this can leave a remainder)

  const defaultWidth = defaultCount === 0 ? 0 : Math.max(Math.floor((displayWidth - totalColumnWidth) / defaultCount), minColumnWidth);
  totalColumnWidth += defaultCount * defaultWidth;
  unsizedCols.forEach(column => column.width = defaultWidth);
  let lockedGroupWidth = 0;
  let scrollGroupWidth = 0; //TODO account for collapsed/hidden headings and columns

  groups.forEach(group => {
    group.width = sumWidth(group.columns.filter(col => !col.hidden));

    if (group.locked) {
      lockedGroupWidth += group.width;
    }

    if (group.headings) {
      console.log(`group headings ${JSON.stringify(group.headings, null, 2)}`);
      group.headings.forEach(heading => heading.forEach(colHeading => {
        colHeading.width = sumWidth(columnKeysToColumns(splitKeys(colHeading.key), group.columns).filter(col => !col.hidden));
      }));
    }
  }); // Note: there is only ever one scrollGroup, can be two locked groups (at either end)

  if (displayWidth - lockedGroupWidth < minColumnWidth) {
    // Locked group consumes too much of available space, not enough room to host the scrolling group(s). 
    // Fall back to single grid-wide scrollbar and no locked groups
    groups = [{
      locked: false,
      width: totalColumnWidth,
      columns: columns
    }];
    scrollGroupWidth = displayWidth; // shouldn't this be totalColumnWidth ?
  } else {
    scrollGroupWidth = displayWidth - lockedGroupWidth;
  }

  for (let left = 0, i = 0; i < groups.length; i++) {
    const group = groups[i];
    group.renderLeft = left;
    group.renderWidth = group.locked ? group.width : scrollGroupWidth;
    left += group.renderWidth;
  }

  return totalColumnWidth;
}

function flatMap(groups) {
  let columns = [];
  groups.forEach(group => {
    columns = columns.concat(group.columns);
  });
  return columns;
}

function partition(list, test1, test2 = null) {
  const results1 = [];
  const misses = [];
  const results2 = test2 === null ? null : [];

  for (let i = 0; i < list.length; i++) {
    if (test1(list[i])) {
      results1.push(list[i]);
    } else if (test2 !== null && test2(list[i])) {
      results2.push(list[i]);
    } else {
      misses.push(list[i]);
    }
  }

  return test2 === null ? [results1, misses] : [results1, results2, misses];
}

function getDisplayWidth(clientHeight, contentHeight, width, totalColumnWidth, scrollbarSize) {
  const horizontalScrollbar = scrollbarNeeded(totalColumnWidth, width, scrollbarSize);
  const verticalScrollbar = scrollbarNeeded(contentHeight, clientHeight, scrollbarSize);

  if (verticalScrollbar === 'YES') {
    return width - scrollbarSize;
  } else if (verticalScrollbar === 'NO') {
    return width;
  } else if (horizontalScrollbar === 'NO') {
    return width;
  } else if (horizontalScrollbar === 'YES') {
    return width - scrollbarSize;
  } else if (horizontalScrollbar === 'MAYBE') {
    // is this right ?
    return width - scrollbarSize;
  }
}

function scrollbarNeeded(contentSize, containerSize, scrollbarSize) {
  return contentSize > containerSize ? 'YES' : contentSize <= containerSize - scrollbarSize ? 'NO' : 'MAYBE';
}

function getColumnLeft(groups, column) {
  let result = 0;

  for (let i = 0; i < groups.length; i++) {
    const {
      columns
    } = groups[i];

    for (let j = 0; j < columns.length; j++) {
      if (columns[j] === column) {
        return result;
      }

      result += columns[j].width;
    }
  }

  return result;
} // do we need to calculate them all - will it be fast enough to calculate 
// them as we move along the container ?


function getColumnMoveBoundaries(groups) {
  const results = {
    left: [],
    right: []
  };
  let position = 0;

  for (let i = 0; i < groups.length; i++) {
    const {
      columns
    } = groups[i];

    for (let j = 0; j < columns.length; j++) {
      results.left.push(position + 20, i);
      position += columns[j].width;
      results.right.push(position - 20, i);
    }
  }

  return results;
}

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

const NOOP = () => {};

var Draggable = (allProps => {
  const {
    component: Component,
    ...props
  } = allProps;
  const {
    onDrag,
    onDragStart = NOOP,
    onDragEnd = NOOP,
    children: child
  } = allProps;
  const position = useRef({
    x: 0,
    y: 0
  });
  const dragState = useRef(null);

  const handleMouseDown = e => {
    // what is dragState supposed to be exactly ?
    const newDragState = onDragStart(e);

    if (newDragState === null && e.button !== 0) {
      return;
    }

    position.current.x = e.clientX;
    position.current.y = e.clientY;
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    dragState.current = newDragState;

    if (e.stopPropagation) {
      e.stopPropagation();
    }

    if (e.preventDefault) {
      e.preventDefault();
    }
  };

  const onMouseMove = useCallback(e => {
    if (dragState.current === null) {
      return;
    }

    if (e.stopPropagation) {
      e.stopPropagation();
    }

    if (e.preventDefault) {
      e.preventDefault();
    }

    const x = e.clientX;
    const y = e.clientY;
    const deltaX = x - position.current.x;
    const deltaY = y - position.current.y;
    position.current.x = x;
    position.current.y = y;
    onDrag(e, deltaX, deltaY);
  }, []);
  const onMouseUp = useCallback(e => {
    cleanUp();
    onDragEnd(e, dragState.drag);
    dragState.current = null;
  }, []);

  const cleanUp = () => {
    window.removeEventListener('mouseup', onMouseUp);
    window.removeEventListener('mousemove', onMouseMove);
  };

  if (child && !Array.isArray(child)) {
    return React__default.cloneElement(child, { ...props,
      onMouseDown: handleMouseDown
    });
  } else if (Component) {
    return React__default.createElement(Component, _extends({
      onMouseDown: handleMouseDown
    }, props));
  } else {
    return React__default.createElement("div", _extends({
      onMouseDown: handleMouseDown
    }, props));
  }
});

const Direction = {
  ASC: 'asc',
  DSC: 'desc'
};
var SortIcon = (({
  direction
}) => direction === Direction.ASC ? React__default.createElement("i", {
  className: "material-icons"
}, "arrow_drop_up") : React__default.createElement("i", {
  className: "material-icons"
}, "arrow_drop_down"));

var SortIndicator = (({
  column,
  multiColumnSort
}) => {
  const {
    sortable,
    sorted,
    isPlaceHolder
  } = column;

  if (sortable === false || isPlaceHolder || !sorted) {
    return null;
  }

  const direction = sorted < 0 ? Direction.DSC : Direction.ASC;
  return multiColumnSort ? React__default.createElement("div", {
    className: `sort-col multi-col ${direction}`
  }, React__default.createElement(SortIcon, {
    direction: direction
  }), React__default.createElement("span", {
    className: "sort-col-num"
  }, Math.abs(sorted))) : React__default.createElement("div", {
    className: "sort-col single-col"
  }, React__default.createElement(SortIcon, {
    direction: direction
  }));
});

var GridContext = React__default.createContext(null);

var ToggleIcon = (({
  column
}) => {
  const {
    dispatch
  } = useContext(GridContext);

  const handleToggleCollapse = () => {
    const action = column.collapsed ? COLUMN_EXPAND : COLUMN_COLLAPSE;
    dispatch({
      type: action,
      column
    });
  };

  if (!column.collapsible || column.isHidden) {
    return null;
  }

  return React__default.createElement("i", {
    className: "material-icons toggle-icon",
    onClick: handleToggleCollapse
  }, 'arrow_right');
});

const Label = ({
  column
}) => column.collapsed || column.hidden ? '' : column.label || '';

var HeaderCell = (({
  className: propClassName,
  column: col,
  multiColumnSort,
  onClick = () => {},
  onResize,
  onMove,
  onContextMenu
}) => {
  const dragging = useRef(false);
  const wasDragging = useRef(false);
  const column = useRef(col);
  const el = useRef(null);
  const position = useRef({
    x: 0,
    y: 0
  });
  useEffect(() => {
    column.current = col;
  }, [col]);

  const handleClick = () => {
    if (wasDragging.current) {
      wasDragging.current = false;
    } else {
      onClick(column.current);
    }
  };

  const onMouseUp = useCallback(() => {
    cleanUp();

    if (dragging.current) {
      wasDragging.current = true; // shouldn't we set dragging to false ?

      onMove('end', column.current);
    }
  }, []);
  const onMouseMove = useCallback(e => {
    console.log(`onMouseMove`);

    if (e.stopPropagation) {
      e.stopPropagation();
    }

    if (e.preventDefault) {
      e.preventDefault();
    }

    const x = e.clientX;
    const y = e.clientY;
    const deltaX = x - position.current.x;

    if (dragging.current) {
      position.current.x = x;
      position.current.y = y;
      onMove('move', column.current, deltaX);
    } else {
      if (Math.abs(deltaX) > 3) {
        dragging.current = true;
        position.current.x = x;
        position.current.y = y;
        onMove('begin', column.current, deltaX);
      }
    }
  }, []);

  const handleMouseDown = e => {
    position.current = {
      x: e.clientX,
      y: e.clientY
    };
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
  };

  const cleanUp = () => {
    window.removeEventListener('mouseup', onMouseUp);
    window.removeEventListener('mousemove', onMouseMove);
  };

  const handleContextMenu = e => {
    onContextMenu(e, 'header', {
      column: column.current
    });
  };

  const handleResizeStart = () => onResize('begin', column.current);

  const handleResize = useCallback(e => {
    const width = getWidthFromMouseEvent(e);

    if (width > 0) {
      console.log(`resize ${width} resizing ? ${column.resizing}`);
      onResize('resize', column.current, width);
    }
  }, []);

  const handleResizeEnd = e => {
    wasDragging.current = true; // is this right ?

    const width = getWidthFromMouseEvent(e);
    onResize('end', column.current, width);
  };

  const getWidthFromMouseEvent = e => {
    const right = e.pageX;
    const left = el.current.getBoundingClientRect().left;
    return right - left;
  };

  const className = cx('HeaderCell', col.className, col.cellCSS, propClassName, {
    'HeaderCell--resizing': col.resizing,
    'hidden': col.hidden,
    'collapsed': col.collapsed
  });
  const style = {
    width: col.width
  };

  if (col.hidden && col.width === 0) {
    style.display = 'none';
  }

  return React__default.createElement("div", {
    ref: el,
    className: className,
    style: style,
    onClick: handleClick,
    onMouseDown: handleMouseDown,
    onContextMenu: handleContextMenu
  }, React__default.createElement(SortIndicator, {
    column: column,
    multiColumnSort: multiColumnSort
  }), React__default.createElement(ToggleIcon, {
    column: col
  }), React__default.createElement("div", {
    className: "InnerHeaderCell"
  }, React__default.createElement("div", {
    className: "cell-wrapper"
  }, React__default.createElement(Label, {
    column: col
  }))), col.resizeable !== false && React__default.createElement(Draggable, {
    className: "resizeHandle",
    onDrag: handleResize,
    onDragStart: handleResizeStart,
    onDragEnd: handleResizeEnd
  }));
});

function expandStatesfromGroupState({
  columns
}, groupState) {
  const results = Array(columns.length).fill(-1);
  let all = groupState && groupState['*'];
  let idx = 0;

  while (all) {
    results[idx] = 1;
    all = all['*'];
  }

  return results;
}

const styles = {
  groupByHeaderCell: 'GroupbyHeaderCell'
};

const ColHeader = props => {
  const {
    column,
    className,
    onClick,
    onRemoveColumn,
    expandState,
    onToggle
  } = props;
  const expanded = expandState === 1;
  return React__default.createElement("div", {
    className: cx('ColHeader', className, {
      expanded,
      collapsed: !expanded
    })
  }, React__default.createElement("i", {
    className: "material-icons toggle-icon",
    onClick: () => onToggle(column, -expandState)
  }, expanded ? 'arrow_drop_down' : 'arrow_right'), React__default.createElement("span", {
    className: "ColHeaderLabel",
    onClick: () => onClick(column)
  }, column.name), React__default.createElement("i", {
    className: "material-icons remove-icon",
    onClick: () => onRemoveColumn(column)
  }, "cancel"));
};

var GroupbyHeaderCell = (({
  className: propClassName,
  column: groupCol,
  groupState,
  onClick,
  onContextMenu,
  onRemoveColumn,
  onResize,
  onToggleGroupState
}) => {
  const el = useRef(null);
  const column = useRef(groupCol);
  useEffect(() => {
    column.current = groupCol;
  }, [groupCol]);

  const handleClick = () => {
    onClick(groupCol);
  }; // All duplicated in header-cell


  const handleResizeStart = () => onResize('begin', column.current);

  const handleResize = useCallback(e => {
    const width = getWidthFromMouseEvent(e);

    if (width > 0) {
      onResize('resize', column.current, width);
    }
  }, []);

  const handleResizeEnd = e => {
    const width = getWidthFromMouseEvent(e);
    onResize('end', column.current, width);
  };

  const getWidthFromMouseEvent = e => {
    const right = e.pageX;
    const left = el.current.getBoundingClientRect().left;
    return right - left;
  };

  const handleContextMenu = e => {
    onContextMenu(e, 'header', {
      column: groupCol
    });
  };

  const {
    columns,
    resizing,
    width
  } = groupCol;
  const className = cx(styles.groupByHeaderCell, 'HeaderCell group', propClassName, resizing ? 'HeaderCell--resizing' : '');
  const expandStates = expandStatesfromGroupState(groupCol, groupState);
  return React__default.createElement("div", {
    ref: el,
    className: className,
    style: {
      paddingLeft: 0,
      width: width
    },
    onContextMenu: handleContextMenu
  }, React__default.createElement("div", {
    className: "inner-container"
  }, columns.map((column, idx) => React__default.createElement(ColHeader, {
    key: column.key,
    column: column,
    expandState: expandStates[idx],
    onClick: handleClick,
    onRemoveColumn: onRemoveColumn,
    onToggle: onToggleGroupState,
    className: columnClassName(columns, idx)
  }))), React__default.createElement(Draggable, {
    className: "resizeHandle",
    onDrag: handleResize,
    onDragStart: handleResizeStart,
    onDragEnd: handleResizeEnd
  }));
});

function columnClassName(columns, idx
/*, column*/
) {
  const classes = [];

  if (idx === 0) {
    classes.push('first');
  }

  if (idx === columns.length - 1) {
    classes.push('last');
  }

  return classes.join(' ');
}

var ColumnGroupHeader = forwardRef(ColumnGrouHeader);
function ColumnGrouHeader({
  columnGroup,
  colGroupHeaderRenderer,
  colHeaderRenderer,
  ignoreHeadings,
  model,
  onColumnMove
}, ref) {
  const {
    dispatch,
    showContextMenu
  } = useContext(GridContext);
  const containerEl = useRef(null);
  useImperativeHandle(ref, () => ({
    scrollLeft: scrollLeft => {
      containerEl.current.scrollLeft = scrollLeft;
    }
  }));
  const handleColumnResize = useCallback((phase, column, width) => {
    if (phase === 'resize') {
      if (column.isHeading) {
        dispatch({
          type: RESIZE_HEADING,
          column,
          width
        });
      } else {
        // TODO do we need to consider scrolling ?
        dispatch({
          type: COLUMN_RESIZE,
          column,
          width
        });
      }
    } else if (phase === 'begin') {
      dispatch({
        type: COLUMN_RESIZE_BEGIN,
        column
      });
    } else if (phase === 'end') {
      dispatch({
        type: COLUMN_RESIZE_END,
        column
      });
    }
  }, []);
  const handleRemoveGroupBy = useCallback(column => {
    dispatch({
      type: groupExtend,
      column
    });
  }, []);

  const handleHeaderCellClick = column => {

    if ( column.sortable !== false) {
      // this will transform the columns which will cause whole grid to re-render down to cell level. All
      // we really need if for headers to rerender. SHould we store sort criteria outside of columns ?
      dispatch({
        type: SORT,
        column
      });
    }
  };

  const handleToggleGroupState = useCallback((column, expanded) => {
    const groupState = expanded === 1 ? {
      '*': true
    } : {};
    dispatch({
      type: TOGGLE,
      groupState
    });
  }, []);

  const renderColHeadings = heading => heading.map((item, idx) => React__default.createElement(HeaderCell, {
    key: idx,
    className: cx('colgroup-header', {
      bottomless: item.label === ''
    }),
    column: item,
    onResize: handleColumnResize,
    onMove: onColumnMove,
    onContextMenu: showContextMenu
  }));

  const renderHeaderCells = () => {
    return columnGroup.columns.filter(column => !column.hidden).map(column => {
      const props = {
        key: column.key,
        column,
        onResize: handleColumnResize,
        onMove: onColumnMove,
        onContextMenu: showContextMenu
      };
      const multiColumnSort = model.sortBy && model.sortBy.length > 1;

      if (column.isGroup) {
        return renderGroupHeader({ ...props,
          groupState: model.groupState,
          onClick: handleGroupHeaderCellClick,
          onToggleGroupState: handleToggleGroupState,
          onRemoveColumn: handleRemoveGroupBy
        });
      } else {
        return renderCell({ ...props,
          value: column.name,
          multiColumnSort,
          onClick: handleHeaderCellClick
        });
      }
    });
  };

  const renderGroupHeader = props => {
    const renderer = colGroupHeaderRenderer;
    return React__default.isValidElement(renderer) ? React__default.cloneElement(renderer, props) : renderer && renderer(props) || React__default.createElement(GroupbyHeaderCell, props);
  }; // TODO separate this pattern into reusable code


  const renderCell = props => {
    const renderer = colHeaderRenderer;
    return React__default.isValidElement(renderer) ? React__default.cloneElement(renderer, props) : renderer && renderer(props) || React__default.createElement(HeaderCell, props);
  };

  const handleGroupHeaderCellClick = useCallback(column => {
    if (column.sortable !== false) {
      dispatch({
        type: SORT_GROUP,
        column
      });
    }
  }, []);
  const {
    width,
    renderWidth,
    renderLeft,
    headings = []
  } = columnGroup;
  return React__default.createElement("div", {
    ref: containerEl,
    className: "ColumnGroupHeader",
    style: {
      width: renderWidth,
      left: renderLeft
    }
  }, !ignoreHeadings && headings.map((heading, idx) => React__default.createElement("div", {
    className: "group-heading",
    key: idx,
    style: {
      width
    }
  }, renderColHeadings(heading))).reverse(), React__default.createElement("div", {
    className: "header-cells",
    style: {
      whiteSpace: 'nowrap',
      width,
      position: 'relative'
    }
  }, renderHeaderCells()));
}

var Header = memo(forwardRef(({
  className: propClassName,
  colGroupHeaderRenderer,
  colHeaderRenderer,
  height,
  ignoreHeadings = false,
  model,
  style: propStyle
}, ref) => {
  const {
    dispatch
  } = useContext(GridContext);
  const scrollingHeader = useRef(null);
  const scrollLeft = useRef(0);
  useImperativeHandle(ref, () => ({
    scrollLeft: pos => {
      scrollLeft.current = pos;
      scrollingHeader.current.scrollLeft(pos);
    }
  }));

  const handleColumnMove = (phase, column, distance) => {
    if (!column.isHeading) {
      const pos = scrollLeft.current;

      if (phase === 'move' && distance !== 0) {
        dispatch({
          type: MOVE,
          distance,
          scrollLeft: pos
        });
      } else if (phase === 'begin') {
        dispatch({
          type: MOVE_BEGIN,
          column,
          scrollLeft: pos
        });
      } else if (phase === 'end') {
        dispatch({
          type: MOVE_END,
          column
        });
      }
    }
  };

  const className = cx('Header', propClassName);
  const style = { ...propStyle,
    height
  };
  return React__default.createElement("div", {
    className: className,
    style: style
  }, model._groups.map((group, idx) => {
    return React__default.createElement(ColumnGroupHeader, {
      key: idx,
      ref: group.locked ? null : scrollingHeader,
      columnGroup: group,
      model: model,
      ignoreHeadings: ignoreHeadings,
      onColumnMove: handleColumnMove,
      colHeaderRenderer: colHeaderRenderer,
      colGroupHeaderRenderer: colGroupHeaderRenderer
    });
  }));
}));

let _dialogOpen = false;
const _popups = [];

function specialKeyHandler(e) {
  if (e.keyCode === 27
  /* ESC */
  ) {
      if (_popups.length) {
        closeAllPopups();
        console.log('unmount the open popup(s)');
      } else if (_dialogOpen) {
        console.log('unmount the open dialog');
        ReactDOM.unmountComponentAtNode(document.body.querySelector('.react-dialog'));
      }
    }
}

function outsideClickHandler(e) {
  if (_popups.length) {
    // onsole.log(`Popup.outsideClickHandler`);
    const popupContainers = document.body.querySelectorAll('.react-popup');

    for (let i = 0; i < popupContainers.length; i++) {
      if (popupContainers[i].contains(e.target)) {
        return;
      }
    }

    console.log(`close all popups`);
    closeAllPopups();
  }
}

function closeAllPopups() {
  if (_popups.length) {
    // onsole.log(`closeAllPopups`);
    const popupContainers = document.body.querySelectorAll('.react-popup');

    for (let i = 0; i < popupContainers.length; i++) {
      console.log(`unmountComponentAtNode`);
      ReactDOM.unmountComponentAtNode(popupContainers[i]);
    }

    popupClosed('*');
  }
}

function dialogOpened() {
  if (_dialogOpen === false) {
    console.log('PopupService, dialog opened');
    _dialogOpen = true;
    window.addEventListener('keydown', specialKeyHandler, true);
  }
}

function dialogClosed() {
  if (_dialogOpen) {
    console.log('PopupService, dialog closed');
    _dialogOpen = false;
    window.removeEventListener('keydown', specialKeyHandler, true);
  }
}

function popupOpened(name
/*, group*/
) {
  if (_popups.indexOf(name) === -1) {
    _popups.push(name); //onsole.log('PopupService, popup opened ' + name + '  popups : ' + _popups);


    if (_dialogOpen === false) {
      window.addEventListener('keydown', specialKeyHandler, true);
      window.addEventListener('click', outsideClickHandler, true);
    }
  }
}

function popupClosed(name
/*, group=null*/
) {
  if (_popups.length) {
    if (name === '*') {
      _popups.length = 0;
    } else {
      const pos = _popups.indexOf(name);

      if (pos !== -1) {
        _popups.splice(pos, 1);
      }
    } //onsole.log('PopupService, popup closed ' + name + '  popups : ' + _popups);


    if (_popups.length === 0 && _dialogOpen === false) {
      window.removeEventListener('keydown', specialKeyHandler, true);
      window.removeEventListener('click', outsideClickHandler, true);
    }
  }
}

class PopupService {
  static showPopup({
    name = 'anon',
    group = 'all'
    /*, depth=0*/
    ,
    position = '',
    left = 0,
    top = 0,
    width = 'auto',
    component
  }) {
    // onsole.log(`PopupService.showPopup ${name} in ${group} ${left} ${top} ${width} depth ${depth}`);
    popupOpened(name);
    let el = document.body.querySelector('.react-popup.' + group);

    if (el === null) {
      el = document.createElement('div');
      el.className = 'react-popup ' + group;
      document.body.appendChild(el);
    }

    const className = cx('popup-container', position);
    ReactDOM.render(React__default.createElement("div", {
      className: className,
      style: {
        position: 'absolute',
        left,
        top,
        width
      }
    }, component, " "), el, () => {
      PopupService.keepWithinThePage(el);
    });
  }

  static hidePopup(name = 'anon', group = 'all') {
    //onsole.log('PopupService.hidePopup name=' + name + ', group=' + group)
    if (_popups.indexOf(name) !== -1) {
      popupClosed(name);
      ReactDOM.unmountComponentAtNode(document.body.querySelector(`.react-popup.${group}`));
    }
  }

  static movePopup(x, y, name = 'anon', group = 'all') {
    const container = document.querySelector(`.react-popup.${group} .popup-container`);
    container.style.top = parseInt(container.style.top, 10) + y + 'px';
    container.style.left = parseInt(container.style.left, 10) + x + 'px';
  }

  static keepWithinThePage(el) {
    //onsole.log(`PopupService.keepWithinThePage`);
    const container = el.querySelector('.popup-container');
    const {
      top,
      left,
      width,
      height
    } = container.firstChild.getBoundingClientRect();
    const w = window.innerWidth;
    const h = window.innerHeight;
    const overflowH = h - (top + height);

    if (overflowH < 0) {
      container.style.top = parseInt(container.style.top, 10) + overflowH + 'px';
    }

    const overflowW = w - (left + width);

    if (overflowW < 0) {
      container.style.left = parseInt(container.style.left, 10) + overflowW + 'px';
    }
  }

}
class DialogService {
  static showDialog(dialog) {
    const containerEl = '.react-dialog';
    const onClose = dialog.props.onClose;
    dialogOpened();
    ReactDOM.render(React__default.cloneElement(dialog, {
      container: containerEl,
      onClose: () => {
        DialogService.closeDialog();

        if (onClose) {
          onClose();
        }
      }
    }), document.body.querySelector(containerEl));
  }

  static closeDialog() {
    dialogClosed();
    ReactDOM.unmountComponentAtNode(document.body.querySelector('.react-dialog'));
  }

}
class Popup extends React__default.Component {
  constructor(props) {
    super(props);
    this.pendingTask = null;
  }

  render() {
    return React__default.createElement("div", {
      className: "popup-proxy"
    }, " ");
  }

  componentDidMount() {
    const domNode = ReactDOM.findDOMNode(this);

    if (domNode) {
      const el = domNode.parentElement;
      const boundingClientRect = el.getBoundingClientRect(); //onsole.log(`%cPopup.componentDidMount about to call show`,'color:green');

      this.show(this.props, boundingClientRect);
    }
  }

  componentWillUnmount() {
    PopupService.hidePopup(this.props.name, this.props.group);
  }

  componentWillReceiveProps(nextProps) {
    const domNode = ReactDOM.findDOMNode(this);

    if (domNode) {
      const el = domNode.parentElement;
      const boundingClientRect = el.getBoundingClientRect(); //onsole.log(`%cPopup.componentWillReceiveProps about to call show`,'color:green');

      this.show(nextProps, boundingClientRect);
    }
  }

  show(props, boundingClientRect) {
    const {
      name,
      group,
      depth,
      width
    } = props;
    let left, top;

    if (this.pendingTask) {
      clearTimeout(this.pendingTask);
      this.pendingTask = null;
    }

    if (props.close === true) {
      console.log('Popup.show hide popup name=' + name + ', group=' + group + ',depth=' + depth);
      PopupService.hidePopup(name, group);
    } else {
      const {
        position,
        children: component
      } = props;
      const {
        left: targetLeft,
        top: targetTop,
        width: clientWidth,
        bottom: targetBottom
      } = boundingClientRect;

      if (position === 'below') {
        left = targetLeft;
        top = targetBottom;
      } else if (position === 'above') {
        left = targetLeft;
        top = targetTop;
      }

      console.log('%cPopup.show about to setTimeout', 'color:red;font-weight:bold');
      this.pendingTask = setTimeout(() => {
        console.log(`%c...timeout fires`, 'color:red;font-weight:bold');
        PopupService.showPopup({
          name,
          group,
          depth,
          position,
          left,
          top,
          width: width || clientWidth,
          component
        });
      }, 10);
    }
  }

}

let subMenuTimeout = null;
class MenuItem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasChildMenuItems: props.children && props.children.length > 0
    };
  }

  render() {
    const nestedMenu = this.props.submenuShowing ? createElement(ContextMenu, {
      doAction: this.props.doAction
    }, this.props.children) : null;
    const className = cx('menu-item', this.props.disabled ? 'disabled' : null, this.state.hasChildMenuItems ? 'root' : null, this.props.submenuShowing ? 'showing' : null);
    return createElement("li", {
      className: className
    }, createElement("button", {
      tabIndex: -1,
      onClick: e => this.handleClick(e),
      onMouseOver: () => this.handleMouseOver()
    }, this.props.label), nestedMenu);
  }

  handleClick(e) {
    e.preventDefault();

    if (this.props.disabled !== true) {
      this.props.doAction(this.props.action, this.props.data);
    }
  }

  handleMouseOver() {
    this.props.onMouseOver(this.props.idx, this.state.hasChildMenuItems, this.props.submenuShowing);
  }

}
const Separator = () => createElement("li", {
  className: "divider"
});
class ContextMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      left: props.left,
      top: props.top,
      bottom: props.bottom,
      submenuShowing: false,
      submenuIdx: null
    };
  }

  render() {
    const {
      top,
      left,
      bottom
    } = this.state;
    const children = this.props.children;
    const style = {
      position: 'absolute',
      top,
      left,
      bottom
    };
    const submenuIdx = this.state.submenuShowing ? this.state.submenuIdx : -1;
    const menuItems = children ? children.map((menuItem, idx) => cloneElement(menuItem, {
      key: String(idx),
      idx,
      action: menuItem.props.action,
      doAction: (key, data) => this.handleMenuAction(key, data),
      onMouseOver: (idx, hasChildMenuItems) => this.handleMenuItemMouseOver(idx, hasChildMenuItems),
      submenuShowing: submenuIdx === idx
    })) : null;
    return createElement("ul", {
      className: "popup-menu",
      style: style
    }, menuItems);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.left !== '100%' && nextProps.top !== 0) {
      if (nextProps.left !== this.state.left || nextProps.top !== this.state.top) {
        this.setState({
          left: nextProps.left,
          top: nextProps.top,
          submenuShowing: false,
          submenuIdx: null
        });
      }
    }
  }

  handleMenuAction(key, data) {
    if (this.props.doAction) {
      this.props.doAction(key, data);
    } else if (this.props.onAction) {
      this.props.onAction(key, data);
    }

    this.close();
  }

  handleMenuItemMouseOver(idx, hasChildMenuItems) {
    if (subMenuTimeout) {
      clearTimeout(subMenuTimeout);
      subMenuTimeout = null;
    }

    if (hasChildMenuItems) {
      if (this.state.submenuShowing !== true) {
        subMenuTimeout = setTimeout(() => this.showSubmenu(), 400);
      }

      this.setState({
        submenuIdx: idx
      });
    } else if (this.state.submenuIdx !== null) {
      this.setState({
        submenuIdx: null,
        submenuShowing: false
      });
    }
  }

  showSubmenu() {
    subMenuTimeout = null;
    this.setState({
      submenuShowing: true
    });
  }

  close() {
    PopupService.hidePopup();
  }

}
ContextMenu.defaultProps = {
  left: '100%',
  top: 0,
  bottom: 'auto'
};

var ColumnFilter = (({
  column,
  dataView,
  filter: filter$1,
  onClearFilter,
  onFilterOpen,
  onFilterClose,
  showFilter,
  onFilter
}) => {
  const rootEl = useRef(null);

  const toggleFilterDisplay = () => {
    onFilterOpen(column);
  }; // close filter is a user action


  const closeFilter = () => {
    PopupService.hidePopup();
  }; // hide fires when the filter has been closed


  const hideFilter = useCallback(() => {
    setTimeout(() => {
      // needs delay to ensure firing after ColumnFilter is rerendered with new 
      // clickhandler which would otherwise immediately re-open filter.
      onFilterClose();
    }, 50);
  }, []);
  const handleKeyDown = useCallback(e => {
    if (e.keyCode === 13) {
      // ENTER
      dataView.filter({
        type: filter.STARTS_WITH,
        colName: column.name,
        value: e.target.value
      });
    }
  }, []);
  const clearFilter = useCallback(() => {
    onClearFilter(column);
  }, []);

  const handleNumberFilterChange = (column, filter) => {
    onFilter(column, filter);
  };

  const handleFilter = () =>
  /*filter*/
  {// Do we still need - see Numberfilter and group
  };

  useEffect(() => {
    if (showFilter) {
      const component = getFilter();
      const el = rootEl.current;
      const {
        left,
        top
      } = el.getBoundingClientRect(); // TODO without the timeout, it does not render until next render cycle

      requestAnimationFrame(() => {
        PopupService.showPopup({
          left: Math.round(left),
          top: top - 26,
          component
        });
      });
    }
  }, [showFilter]);

  const moveFilter = (e, deltaX, deltaY) => {
    console.log(`move Filter by ${deltaX} ${deltaY}`);
    PopupService.movePopup(deltaX, deltaY);
  };

  const getFilter = () => {
    console.log(`getFilter ${JSON.stringify(column)}`);

    if (!column.isGroup || column.columns.length === 1) {
      switch (columnUtils.getFilterType(column)) {
        case 'number':
          return React__default.createElement(NumberFilter, {
            column: column,
            height: 250,
            className: "FilterPanel",
            dataView: dataView,
            filter: filter$1,
            onHide: hideFilter,
            onClose: closeFilter,
            onApplyFilter: handleNumberFilterChange
          });

        default:
          return React__default.createElement(Draggable, {
            onDrag: moveFilter
          }, React__default.createElement(SetFilter, {
            className: "FilterPanel",
            column: column,
            filter: filter$1,
            height: 350,
            width: column.width + 120,
            dataView: dataView,
            onHide: hideFilter,
            onClose: closeFilter
          }));
      }
    } else {
      return React__default.createElement(MultiColumnFilter, {
        column: column,
        height: 261,
        width: 300,
        filter: filter$1,
        dataView: dataView,
        onHide: hideFilter,
        onClose: closeFilter,
        onApplyFilter: handleFilter
      });
    }
  };

  const isActive = filter.includesColumn(filter$1, column);
  const className = cx('HeaderCell', {
    'filter-active': isActive,
    'filter-showing': showFilter
  });
  return (// we only need care about opening the filter - the Popup service will close if for us.
    React__default.createElement("div", {
      ref: rootEl,
      className: className,
      style: {
        padding: 0,
        width: column.width
      }
    }, React__default.createElement("div", {
      className: "filter-button",
      onClick: toggleFilterDisplay
    }, React__default.createElement("i", {
      className: "material-icons"
    }, "filter_list")), React__default.createElement("div", {
      className: "filter-input-container"
    }, React__default.createElement("input", {
      className: "filter-input",
      type: "text",
      onKeyDown: handleKeyDown
    })), isActive && React__default.createElement("div", {
      className: "filter-clear-button",
      onClick: clearFilter
    }, React__default.createElement("i", {
      className: "material-icons"
    }, "cancel")))
  );
});

const {
  STARTS_WITH,
  NOT_IN
} = filter;
var InlineFilter = forwardRef(({
  dataView,
  height,
  model,
  filter: serverFilter,
  style
}, ref) => {
  const header = useRef(null);
  const [showFilter, setShowFilter] = useState(null);
  useImperativeHandle(ref, () => ({
    scrollLeft: pos => {
      header.current.scrollLeft(pos);
    }
  }));

  const onFilterOpen = column => {
    const {
      key,
      name
    } = column.isGroup ? column.columns[0] : column;

    if (showFilter !== name) {
      dataView.getFilterData({
        key,
        name
      });
      setShowFilter(column.name);
    }
  };

  const onFilterClose = () => {
    setShowFilter(null); // I think we're doing this so that if same filter is opened again, dataView sends rows

    dataView.setFilterRange(0, 0);
  }; // not used for setfilter any more


  const handleFilter = (column, newFilter) => {
    //TODO move this into model
    const filter$1 = filter.addFilter(serverFilter, newFilter);
    console.log(`
                add filter ${JSON.stringify(newFilter, null, 2)}
                to filter ${JSON.stringify(serverFilter, null, 2)}
                creates new filter = ${JSON.stringify(filter$1, null, 2)}
            `);
    dataView.filter(filter$1);

    if (newFilter.isNumeric) {
      // re-request the filterData, this will re-create bins on the filtered data
      const {
        key,
        name
      } = column.isGroup ? column.columns[0] : column;
      dataView.getFilterData({
        key,
        name
      });
    }
  };

  const handleClearFilter = useCallback(column => {
    dataView.filter({
      type: NOT_IN,
      colName: column.name,
      values: []
    }, DataTypes.ROW_DATA, true);
  }, []);

  const colHeaderRenderer = ({
    key,
    column
  }) => React__default.createElement(ColumnFilter, {
    key: key,
    column: column,
    dataView: dataView // TODO we use this to mark the column as filtered 
    ,
    filter: serverFilter,
    onClearFilter: handleClearFilter,
    onFilterOpen: onFilterOpen,
    onFilterClose: onFilterClose,
    showFilter: showFilter === column.name,
    onFilter: handleFilter
  });

  return React__default.createElement(Header, {
    className: "InlineFilter",
    ref: header,
    model: model,
    height: height,
    style: style,
    ignoreHeadings: true,
    colGroupHeaderRenderer: colHeaderRenderer,
    colHeaderRenderer: colHeaderRenderer
  });
});

var Row = React__default.memo(({
  row,
  idx,
  columns,
  gridModel
}) => {
  const {
    meta,
    rowHeight
  } = gridModel;
  const handleContextMenu = useCallback(e => showContextMenu(e, 'row', {
    idx,
    row
  }), [idx, row]);
  const {
    dispatch,
    callbackPropsDispatch,
    showContextMenu
  } = useContext(GridContext);
  const handleClick = useCallback(e => {
    const rangeSelect = e.shiftKey;
    const keepExistingSelection = e.ctrlKey || e.metaKey
    /* mac only */
    ;
    console.log(`Row about to call callbackPropsDIspatch('selection')`);
    callbackPropsDispatch({
      type: 'selection',
      idx,
      row,
      rangeSelect,
      keepExistingSelection
    });
  }, [idx, row]);
  const handleDoubleClick = useCallback(() => callbackPropsDispatch({
    type: 'double-click',
    idx,
    row
  }), [idx, row]);
  const onClick = useCallback(cellIdx => {
    if (isGroup) {
      dispatch({
        type: TOGGLE,
        groupRow: row
      });
    }

    callbackPropsDispatch({
      type: 'select-cell',
      idx,
      cellIdx
    });
  }, [idx, row]);
  const groupLevel = row[meta.DEPTH];
  const isGroup = groupLevel !== 0;
  const isSelected = row[meta.SELECTED] === 1;
  const className = cx('GridRow', isSelected ? 'selected' : null, isGroup ? `group ${groupLevel < 0 ? 'collapsed' : 'expanded'}` : idx % 2 === 0 ? 'even' : 'odd'); //TODO load default formatters here and pass formatter/cellClass down to cell 

  const cells = columns.filter(column => !column.hidden).map((column, i) => {
    const props = {
      key: i,
      idx: i,
      column,
      meta,
      row,
      onClick
    };
    return React__default.isValidElement(column.renderer) ? React__default.cloneElement(column.renderer, props) : column.renderer && column.renderer(props) || getCellRenderer(props);
  });
  return React__default.createElement("div", {
    className: className,
    tabIndex: 0,
    style: {
      transform: `translate3d(0px, ${idx * rowHeight}px, 0px)`
    },
    onClick: handleClick,
    onDoubleClick: handleDoubleClick,
    onContextMenu: handleContextMenu
  }, cells);
});

const byKey = ([key1], [key2]) => key1 - key2;

const cssCanvas = {
  position: 'absolute',
  top: 0,
  overflow: 'hidden'
};
const cssCanvasContent = {
  position: 'absolute',
  overflow: 'hidden'
};
var Canvas = forwardRef(Canvas$1);
function Canvas$1({
  columnGroup,
  firstVisibleRow,
  gridModel,
  height,
  rows,
  onKeyDown
}, ref) {
  const contentEl = useRef(null);
  const {
    showContextMenu
  } = useContext(GridContext);
  useImperativeHandle(ref, () => ({
    scrollLeft: scrollLeft => {
      contentEl.current.style.left = `-${scrollLeft}px`;
    }
  }));

  const handleContextMenuFromCanvas = e => {
    showContextMenu(e, 'canvas');
  };

  const {
    renderLeft: left,
    renderWidth: width
  } = columnGroup;
  const {
    RENDER_IDX
  } = gridModel.meta;
  const rowPositions = rows.map((row, idx) => {
    const absIdx = firstVisibleRow + idx;
    return [row[RENDER_IDX], absIdx, row];
  }).sort(byKey);
  const gridRows = rowPositions.map(([key, abs_idx, row]) => {
    return React__default.createElement(Row, {
      key: key,
      idx: abs_idx,
      row: row,
      gridModel: gridModel,
      columns: columnGroup.columns
    });
  });
  const className = cx('Canvas', {
    fixed: columnGroup.locked
  });
  return React__default.createElement("div", {
    style: { ...cssCanvas,
      left,
      width,
      height
    },
    className: className,
    onContextMenu: handleContextMenuFromCanvas,
    onKeyDown: onKeyDown
  }, React__default.createElement("div", {
    ref: contentEl,
    style: { ...cssCanvasContent,
      width: Math.max(columnGroup.width, width),
      height
    }
  }, gridRows));
}

const NULL_FORMATTER = () => {};

const ColumnBearer = props => {
  const {
    rows,
    gridModel
  } = props;
  const {
    _movingColumn: column,
    meta,
    headerHeight,
    _headingDepth: headingDepth
  } = gridModel;
  const {
    left,
    width
  } = column;
  const top = (headingDepth - 1) * headerHeight;
  console.log(`render ColumnBearer`);
  return React__default.createElement("div", {
    className: "ColumnBearer",
    style: {
      top,
      left,
      width
    }
  }, React__default.createElement("div", {
    className: "Header",
    style: {
      height: headerHeight
    }
  }, React__default.createElement(HeaderCell, {
    column: column
  })), rows.map((row, idx) => React__default.createElement("div", {
    key: idx,
    className: "Row"
  }, getCellRenderer({
    idx,
    column,
    meta,
    formatter: column.formatter || NULL_FORMATTER,
    row,
    value: row[column.key]
  }))));
};

const INITIAL_RANGE = {
  lo: 0,
  hi: -1
};
const initialData = {
  rows: [],
  rowCount: 0,
  range: INITIAL_RANGE,
  offset: 0,
  // selected: [],
  _keys: {
    free: [],
    used: {}
  } // This assumes model.meta never changes. If it does (columns etc)
  // we will need additional action types to update

};
function dataReducer (model) {
  return (state, action) => {
    if (action.type === 'range') {
      return setRange$1(state, action, model.meta);
    } else if (action.type === 'data') {
      return setData(state, action, model.meta);
    } else if (action.type === 'selected') {
      return applySelection(state, action, model.meta);
    }
  };
}

function setKeys(keys, {
  lo,
  hi
}) {
  const free = [];
  const keyCount = hi - lo;

  for (let i = 0; i < keyCount; i++) {
    const usedKey = keys.used[i];

    if (usedKey === 3 || usedKey === undefined) {
      free.push(i);
    }
  }

  return {
    used: keys.used,
    free
  };
} //TODO we HAVE to remove out=of-range rows and add empty placeholders


function setRange$1(state, {
  range
}, meta) {
  // return {
  //   ...state,
  //   range,
  //   _keys: setKeys(state._keys, range)
  // }
  // const { IDX, SELECTED } = meta;
  const {
    rows,
    rowCount,
    offset
  } = state;
  const keys = setKeys(state._keys, range);
  const [mergedRows, _keys] = mergeAndPurge(range, rows, offset, [], rowCount, meta, keys); // const selected = rows.filter(row => row[SELECTED]).map(row => row[IDX]);

  return {
    rows: mergedRows,
    rowCount,
    offset,
    range,
    // selected,
    _keys
  };
}

function setData(state, action, meta) {
  // const { IDX, SELECTED } = meta;
  const {
    rows,
    rowCount,
    offset
  } = action;
  const range = action.range.reset || state.range === INITIAL_RANGE ? action.range : state.range;
  const [mergedRows, _keys] = mergeAndPurge(range, state.rows, offset, rows, rowCount, meta, state._keys); // const selected = rows.filter(row => row[SELECTED]).map(row => row[IDX]);

  return {
    rows: mergedRows,
    rowCount,
    offset,
    range,
    // selected,
    _keys
  };
}

function applySelection(state, {
  selected,
  deselected
}, meta) {
  const {
    IDX,
    SELECTED
  } = meta;
  const {
    rows: input,
    rowCount
  } = state;
  const rows = []; // TODO whare do we apply the offset

  const offset = 100;

  for (let i = 0; i < input.length; i++) {
    const row = input[i];
    const rowIdx = row[IDX];
    const wasSelected = row[SELECTED];
    const nowSelected = !wasSelected && selected.includes(rowIdx - offset);
    const nowDeselected = wasSelected && deselected.includes(rowIdx - offset);

    if (!nowSelected && !nowDeselected) {
      rows[i] = row;
    } else {
      const dolly = row.slice();

      if (nowSelected) {
        dolly[SELECTED] = 1;
      } else {
        dolly[SELECTED] = 0;
      }

      rows[i] = dolly;
    }
  }

  return {
    rows,
    rowCount // selected: results

  };
} // TODO create a pool of these and reuse them


function emptyRow(idx, {
  IDX,
  count
}) {
  const row = Array(count);
  row[IDX] = idx;
  return row;
}

function mergeAndPurge({
  lo,
  hi
}, rows, offset = 0, incomingRows, size, meta, keys) {
  // console.log(`dataReducer.mergeAndPurge: entry
  //   range ${lo} - ${hi}
  //   keys: 
  //     free: ${keys.free.join(',')}
  //     used : ${Object.keys(keys.used).join(',')}
  //     existing rows : ${rows.map(r=>r[meta.IDX]-offset).join(',')}
  //     incoming rows : ${incomingRows.map(r=>r[meta.IDX]-offset).join(',')}
  // `)
  const {
    IDX,
    RENDER_IDX
  } = meta;
  const {
    free: freeKeys,
    used: usedKeys
  } = keys;
  const low = lo + offset;
  const high = Math.min(hi + offset, size + offset);
  const rowCount = hi - lo;
  const results = [];
  const used = {};
  const free = freeKeys.slice();
  let maxKey = rows.length;
  let pos, row, rowIdx, rowKey; // 1) iterate existing rows, copy to correct slot in results if still in range
  //    if not still in range, collect rowKey

  for (let i = 0; i < rows.length; i++) {
    if (row = rows[i]) {
      rowIdx = row[IDX];
      rowKey = row[RENDER_IDX];
      pos = rowIdx - low;

      if (usedKeys[rowKey] === 1 && rowIdx >= low && rowIdx < high) {
        results[pos] = rows[i];
        used[rowKey] = 1;
      } else if (usedKeys[rowKey] === 1 && rowKey < rowCount) {
        free.push(rowKey);
        used[rowKey] = undefined;
      }
    }
  } // 2) iterate new rows, if not already in results (shouldn't be) , move to correct slot in results
  //      assign rowKey from free values


  for (let i = 0; i < incomingRows.length; i++) {
    if (row = incomingRows[i]) {
      rowIdx = row[IDX];
      pos = rowIdx - low;

      if (rowIdx >= low && rowIdx < high) {
        if (results[pos]) {
          rowKey = results[pos][RENDER_IDX];
        } else {
          rowKey = free.shift();

          if (rowKey === undefined) {
            rowKey = maxKey++;
          }

          used[rowKey] = 1;
        }

        results[pos] = row;
        row[RENDER_IDX] = rowKey;
      } else {
        console.warn('new row outside range');
      }
    }
  } // 3) assign empty row to any free slots in results
  // TODO make this more efficient


  for (let i = 0, freeIdx = 0; i < rowCount; i++) {
    if (results[i] === undefined) {
      const row = results[i] = emptyRow(i + low, meta);
      rowKey = free[freeIdx++]; // don't remove from free

      row[RENDER_IDX] = rowKey;
      used[rowKey] = 3;
    }
  } //   console.log(`dataReducer.mergeAndPurge: exit
  //   range ${lo} - ${hi}
  //   keys: 
  //     free: ${free.join(',')}
  //     used : ${Object.keys(used).join(',')}
  //     row keys : ${results.map(r=>r[RENDER_IDX]).join(',')}
  // `)


  return [results, {
    free,
    used
  }];
}

const logger = createLogger('Viewport', logColor.green);
const scrollbarSize = getScrollbarSize();
const cssViewport = {
  position: 'absolute',
  top: 25,
  left: 0,
  right: 0,
  bottom: 0,
  padding: 0,
  overflow: 'hidden'
};
const cssViewportContent = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  padding: 0
};

function useThrottledScroll(callback) {
  const timeoutHandler = useRef(null);
  const prevValue = useRef(null);
  const value = useRef(null);

  const raf = () => {
    if (value.current !== prevValue.current) {
      callback(value.current);
      prevValue.current = value.current;
      timeoutHandler.current = requestAnimationFrame(raf);
    } else {
      timeoutHandler.current = null;
    }
  };

  const throttledCallback = useCallback(e => {
    value.current = e.target.scrollTop;

    if (timeoutHandler.current === null) {
      timeoutHandler.current = requestAnimationFrame(raf);
    }
  }, [callback]);
  return throttledCallback;
}

const Viewport = React__default.memo(({
  style,
  height,
  dataView,
  model,
  onFilterChange // selectedRows

}) => {
  const scrollingCanvas = useRef(null);
  const scrollableContainerEl = useRef(null);
  const verticalScrollContainer = useRef(null);
  const scrollTop = useRef(0);
  const firstVisibleRow = useRef(0);
  const groupBy = useRef(model.groupBy);
  const {
    dispatch,
    callbackPropsDispatch
  } = useContext(GridContext); // const [selectionState, setSelectionState] = useState(SelectionModel.getInitialState(selectedRows));

  const [data, dispatchData] = useReducer(dataReducer(model), initialData);
  useEffect(() => {
    const rowCount = Math.ceil(height / model.rowHeight) + 1;
    dataView.subscribe({
      columns: model.columns,
      range: {
        lo: 0,
        hi: rowCount
      }
    },
    /* postMessageToClient */
    ({
      rows = null,
      filter = undefined,
      size: rowCount = null,
      offset,
      range,
      selected = null,
      deselected = null
    }) => {
      if (range && range.reset) {
        setSrollTop(0);
      }

      if (filter !== undefined) {
        onFilterChange(filter);
      }

      if (rowCount !== null && rowCount !== model.rowCount) {
        dispatch({
          type: ROWCOUNT,
          rowCount
        });
      }

      if (rows !== null) {
        dispatchData({
          type: 'data',
          rows,
          rowCount,
          offset,
          range
        });
      } else if (selected !== null) {
        dispatchData({
          type: 'selected',
          selected,
          deselected
        });
      }
    });
    return () => dataView.unsubscribe();
  }, [dataView]);
  useEffect(() => {
    const rowCount = Math.ceil(height / model.rowHeight) + 1;

    if (rowCount !== model.rowCount) {
      dispatch({
        type: ROWCOUNT,
        rowCount
      });
      const firstRow = firstVisibleRow.current;
      setRange(firstRow, firstRow + rowCount);
    }
  }, [height]);
  const handleVerticalScroll = useThrottledScroll(useCallback(value => {
    scrollTop.current = value;
    const firstRow = Math.floor(value / model.rowHeight);

    if (firstRow !== firstVisibleRow.current) {
      const numberOfRowsInViewport = Math.ceil(height / model.rowHeight) + 1;
      firstVisibleRow.current = firstRow;
      setRange(firstRow, firstRow + numberOfRowsInViewport);
    }
  }, []));
  const handleHorizontalScroll = useCallback(e => {
    if (e.target === e.currentTarget) {
      const scrollLeft = e.target.scrollLeft;
      scrollingCanvas.current.scrollLeft(scrollLeft);
      callbackPropsDispatch({
        type: 'scroll',
        scrollLeft
      });
    }
  }, []);
  const setSrollTop = useCallback(value => {
    verticalScrollContainer.current.scrollTop = scrollTop.current = value;
  }, []);
  const setRange = useCallback((lo, hi) => {
    //logger.log(`setRange ===>  ${lo} : ${hi}`)
    dispatchData({
      type: 'range',
      range: {
        lo,
        hi
      }
    });
    dataView.setRange(lo, hi);
  }, []); // all of these calculations belong in the modelReducer

  const horizontalScrollingRequired = model.totalColumnWidth > model.displayWidth; // we shouldn't need to change this but chrome does not handle this correctly - vertical scrollbar is still
  // displayed even when not needed, when grid is stretched.

  const maxContentHeight = horizontalScrollingRequired ? height - 15 : height; // we should know the scrollbarHeight

  const contentHeight = Math.max(model.rowHeight * data.rowCount, maxContentHeight);
  const displayWidth = contentHeight > height ? model.width - scrollbarSize : model.width;
  const overflow = displayWidth === model.width ? 'hidden' : 'auto';
  let emptyRows = groupBy.current === model.groupBy ? null : (groupBy.current = model.groupBy, []);
  return React__default.createElement(React__default.Fragment, null, React__default.createElement("div", {
    className: "Viewport",
    style: { ...cssViewport,
      ...style
    }
  }, horizontalScrollingRequired && model._groups.filter(colGroup => !colGroup.locked).map((colGroup, idx) => React__default.createElement("div", {
    className: "CanvasScroller horizontal scrollable-content",
    ref: scrollableContainerEl,
    key: idx,
    style: {
      left: colGroup.renderLeft,
      width: colGroup.renderWidth
    },
    onScroll: handleHorizontalScroll
  }, React__default.createElement("div", {
    className: "CanvasScroller-content",
    style: {
      width: colGroup.width,
      height: 15
    }
  }))), React__default.createElement("div", {
    className: "ViewportContent scrollable-content",
    ref: verticalScrollContainer,
    style: { ...cssViewportContent,
      bottom: horizontalScrollingRequired ? 15 : 0,
      overflow
    },
    onScroll: handleVerticalScroll
  }, React__default.createElement("div", {
    className: "scrolling-canvas-container",
    style: {
      width: model.displayWidth,
      height: contentHeight
    }
  }, model._groups.map((columnGroup, idx) => React__default.createElement(Canvas, {
    key: idx,
    gridModel: model,
    rows: emptyRows || data.rows,
    firstVisibleRow: firstVisibleRow.current,
    height: contentHeight,
    ref: columnGroup.locked ? null : scrollingCanvas,
    columnGroup: columnGroup
  }))))), model._movingColumn && React__default.createElement(ColumnBearer, {
    gridModel: model,
    rows: data.rows
  }));
});

var gridReducer = ((onScroll, onSelectionChange, onSelectCell, onDoubleClick) => (state, action) => {
  const {
    type,
    ...props
  } = action;
  console.log(`%cgridReducer ${type}`, 'color:blue;font-weight: bold;');

  if (type === 'scroll') {
    onScroll && onScroll(props);
  } else if (type === 'selection') {
    const {
      idx,
      row,
      rangeSelect,
      keepExistingSelection
    } = action;
    onSelectionChange(idx, row, rangeSelect, keepExistingSelection);
  } else if (type === 'select-cell') {
    const {
      idx: rowIdx,
      cellIdx
    } = action;
    onSelectCell && onSelectCell(rowIdx, cellIdx);
  } else if (type === 'double-click') {
    const {
      idx,
      row
    } = action;
    onDoubleClick && onDoubleClick(idx, row);
  }

  return state;
});

const ContextMenuActions = {
  SortAscending: 'sort-asc',
  SortAddAscending: 'sort-add-asc',
  SortDescending: 'sort-dsc',
  SortAddDescending: 'sort-add-dsc',
  GroupBy: 'groupby',
  GroupByReplace: 'groupby-replace'
};
class GridContextMenu extends React__default.Component {
  handleMenuAction(action, data) {
    const {
      dispatch,
      doAction
    } = this.props;

    switch (action) {
      case ContextMenuActions.GroupBy:
        dispatch({
          type: groupExtend,
          column: data.column
        });
        break;

      case ContextMenuActions.GroupByReplace:
        dispatch({
          type: GROUP,
          column: data.column
        });
        break;

      case ContextMenuActions.SortAscending:
        return this.sort(data.column, 'asc');

      case ContextMenuActions.SortDescending:
        return this.sort(data.column, 'dsc');

      case ContextMenuActions.SortAddAscending:
        return this.sort(data.column, 'asc', true);

      case ContextMenuActions.SortAddDescending:
        return this.sort(data.column, 'dsc', true);

      default:
        doAction(action, data);
    }
  }

  sort(column, direction = null, preserveExistingSort = false) {
    const {
      dispatch
    } = this.props; // this will transform the columns which will cause whole grid to re-render down to cell level. All
    // we really need if for headers to rerender. SHould we store sort criteria outside of columns ?

    dispatch({
      type: SORT,
      column,
      direction,
      preserveExistingSort
    });
  }

  render() {
    const {
      location,
      options
    } = this.props;
    return (// TODO replace the inline function when we move to SFC
      React__default.createElement(ContextMenu, {
        doAction: (action, data) => this.handleMenuAction(action, data)
      }, this.menuItems(location, options))
    );
  }

  menuItems(location, options) {
    const menuItems = [];

    if (location === 'header') {
      const {
        model,
        column: {
          name: colName,
          sorted,
          isGroup
        }
      } = options;
      const {
        groupBy,
        sortBy: sortCriteria
      } = model;

      if (!sorted) {
        menuItems.push(React__default.createElement(MenuItem, {
          key: "sort-asc",
          action: "sort-asc",
          data: options,
          label: "Sort"
        }, React__default.createElement(MenuItem, {
          key: "sort-asc",
          action: "sort-asc",
          data: options,
          label: "ASC"
        }), React__default.createElement(MenuItem, {
          key: "sort-dsc",
          action: "sort-dsc",
          data: options,
          label: "DESC"
        })));

        if (sortCriteria && sortCriteria.length) {
          menuItems.push(React__default.createElement(MenuItem, {
            key: "sort-add-asc",
            action: "sort-add-asc",
            data: options,
            label: "Add to Sort"
          }, React__default.createElement(MenuItem, {
            key: "sort-add-asc",
            action: "sort-add-asc",
            data: options,
            label: "ASC"
          }), React__default.createElement(MenuItem, {
            key: "sort-add-dsc",
            action: "sort-add-dsc",
            data: options,
            label: "DESC"
          })));
        }
      } else {
        if (sortCriteria && sortCriteria.length > 1) {
          menuItems.push(React__default.createElement(MenuItem, {
            key: "sort-remove",
            action: "sort-remove",
            data: options,
            label: "Remove from Sort"
          }));
        }

        if (sorted === 1) {
          menuItems.push(React__default.createElement(MenuItem, {
            key: "sort-asc",
            action: "sort-dsc",
            data: options,
            label: "Sort (DESC)"
          }));
        } else {
          menuItems.push(React__default.createElement(MenuItem, {
            key: "sort-dsc",
            action: "sort-asc",
            data: options,
            label: "Sort (ASC)"
          }));
        }
      }

      if (groupBy && groupBy.length) {
        if (!isGroup) {
          menuItems.push(React__default.createElement(MenuItem, {
            key: "groupby-add",
            action: "groupby",
            data: options,
            label: `Add ${colName} to Group`
          }));
        }
      } else {
        menuItems.push(React__default.createElement(MenuItem, {
          key: "groupby-add",
          action: "groupby",
          data: options,
          label: `Group by ${colName}`
        }));
      }
    } else if (location === 'row') {
      menuItems.push(React__default.createElement(MenuItem, {
        key: "delete-row",
        action: "delete-row",
        label: "Delete Row"
      }));
    }

    menuItems.push(React__default.createElement(Separator, {
      key: "1"
    }));

    if (options.showFilters) {
      menuItems.push(React__default.createElement(MenuItem, {
        key: "hide-filters",
        action: TOGGLE_FILTERS,
        label: "Hide Filters"
      }));
    } else {
      menuItems.push(React__default.createElement(MenuItem, {
        key: "show-filters",
        action: TOGGLE_FILTERS,
        label: "Column Filters"
      }));
    }

    menuItems.push(React__default.createElement(MenuItem, {
      key: "settings",
      action: "settings",
      label: "Settings"
    }));
    return menuItems;
  }

}

const useContextMenu = (model, showFilters, setShowFilters, dispatch) => {
  const handleContextMenuAction = useCallback(action => {
    if (action === TOGGLE_FILTERS) {
      setShowFilters(state => !state);
    }
  }, [showFilters]);
  return useCallback((e, location, options) => {
    e.preventDefault();
    e.stopPropagation();
    const {
      clientX: left,
      clientY: top
    } = e;
    const component = React__default.createElement(GridContextMenu, {
      location: location,
      options: { ...options,
        model,
        showFilters
      },
      dispatch: dispatch,
      doAction: handleContextMenuAction
    });
    PopupService.showPopup({
      left: Math.round(left),
      top: Math.round(top),
      component
    });
  }, [model, showFilters]);
};

// TODO calculate width, height if not specified
const logger$1 = createLogger('Grid', logColor.green);
const scrollbarSize$1 = getScrollbarSize(); //TODO 
// 1) how do we assign extra horizontal space

function Grid({
  dataView,
  columns,
  style,
  showHeaders = true,
  headerHeight = showHeaders ? 24 : 0,
  showFilters: initialShowFilters = false,
  onScroll,
  // TODO capture these as callbackProps
  onSelectCell = () => {},
  onSingleSelect,
  onSelectionChange,
  onDoubleClick,
  //TODO be explicit, what can we have here - which of these make sense as grid props ?
  ...props // width
  // height
  // rowHeight
  // minColumnWidth
  // groupColumnWidth
  // sortBy
  // groupBy
  // range
  // groupState
  // filter
  // collapsedColumns
  // selectionModel

}) {
  const header = useRef(null);
  const inlineFilter = useRef(null);
  const scrollLeft = useRef(0);
  const overTheLine = useRef(0);
  const inputWidth = props.width || style.width;
  const inputHeight = props.height || style.height;
  const [showFilters, setShowFilters] = useState(initialShowFilters);
  const [filter, setFilter] = useState(null);
  const handleScroll = useCallback(params => {
    const {
      scrollLeft: pos = -1
    } = params;

    if (pos !== -1) {
      if (scrollLeft.current !== pos) {
        scrollLeft.current = pos;

        if (header.current) {
          header.current.scrollLeft(pos);
        }

        if (inlineFilter.current) {
          inlineFilter.current.scrollLeft(pos);
        }
      }
    }

    onScroll && onScroll(params);
  }, []);
  const handleSelectionChange = useCallback((idx, row, rangeSelect, keepExistingSelection) => {
    dataView.select(idx, row, rangeSelect, keepExistingSelection);

    if (onSelectionChange) {
      const isSelected = row[model.meta.SELECTED] === 1; // TODO what about range selections

      onSelectionChange && onSelectionChange(idx, row, !isSelected);
    } // if (selected.length === 1 && onSingleSelect) {
    //     onSingleSelect(selected[0], selectedItem);
    // }

  }, []); // this reducer is a no=op - always returns same state
  // TODO why not use existing reducer ?

  const [, callbackPropsDispatch] = useReducer(useCallback(gridReducer(handleScroll, handleSelectionChange, onSelectCell, onDoubleClick), []), null);
  const [model, dispatch] = useReducer(reducer, { //TODO which props exactly does the model still use ?
    ...props,
    columns: columns.map(columnUtils.toKeyedColumn),
    columnMap: columnUtils.buildColumnMap(columns),
    scrollbarSize: scrollbarSize$1,
    headerHeight
  }, initModel);
  const showContextMenu = useContextMenu(model, showFilters, setShowFilters, dispatch);
  const {
    height,
    width,
    _headingDepth,
    groupBy,
    groupState,
    sortBy,
    _overTheLine
  } = model;
  useEffect(() => {
    overTheLine.current = _overTheLine;
    logger$1.log(`<useEffect _overTheLine>`); // we want to keep dispatching scroll as long as the column is over the line

    const scroll = () => {
      if (overTheLine.current !== 0) {
        const type = overTheLine.current > 0 ? SCROLL_RIGHT : SCROLL_LEFT;
        const scrollDistance = type === SCROLL_RIGHT ? 3 : -3;
        dispatch({
          type,
          scrollDistance
        });
        requestAnimationFrame(scroll);
      }
    };

    scroll();
  }, [_overTheLine]);
  useEffect(() => {
    dispatch({
      type: GRID_RESIZE,
      width: inputWidth,
      height: inputHeight
    });
  }, [inputWidth, inputHeight]);
  useEffect(() => {
    if (sortBy !== undefined) {
      dataView.sort(sortBy);
    }
  }, [dataView, sortBy]);
  useEffect(() => {
    if (groupBy !== undefined) {
      dataView.group(groupBy);
    }
  }, [dataView, groupBy]);
  useEffect(() => {
    if (groupState !== undefined) {
      dataView.setGroupState(groupState);
    }
  }, [dataView, groupState]);
  const filterHeight = showFilters ? 24 : 0;
  const headingHeight = showHeaders ? headerHeight * _headingDepth : 0;
  const totalHeaderHeight = headingHeight + filterHeight;
  const isEmpty = dataView.size <= 0;
  const emptyDisplay = isEmpty && props.emptyDisplay || null;
  const className = cx('Grid', props.className, emptyDisplay ? 'empty' : '', isEmpty && props.showHeaderWhenEmpty === false ? 'no-header' : '');
  return (// we can roll context menu into the context once more of the child components are functions
    React__default.createElement(GridContext.Provider, {
      value: {
        dispatch,
        callbackPropsDispatch,
        showContextMenu
      }
    }, React__default.createElement("div", {
      style: {
        position: 'relative',
        height,
        width,
        ...style
      },
      className: className
    }, showHeaders && headerHeight !== 0 && React__default.createElement(Header, {
      ref: header,
      height: headingHeight,
      model: model,
      colHeaderRenderer: props.colHeaderRenderer
    }), showFilters && React__default.createElement(InlineFilter, {
      ref: inlineFilter,
      dataView: dataView,
      model: model,
      filter: filter,
      height: filterHeight,
      style: {
        position: 'absolute',
        top: headingHeight,
        height: filterHeight,
        width
      }
    }), React__default.createElement(Motion, {
      defaultStyle: {
        top: headingHeight
      },
      style: {
        top: spring(totalHeaderHeight)
      }
    }, interpolatingStyle => React__default.createElement(Viewport, {
      dataView: dataView,
      model: model,
      style: interpolatingStyle,
      height: height - totalHeaderHeight,
      onFilterChange: setFilter
    })), emptyDisplay))
  );
}

export { DialogService, Draggable, Grid, Popup, PopupService, Selection };
//# sourceMappingURL=index.js.map
