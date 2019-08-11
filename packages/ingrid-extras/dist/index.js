import React, { useState, useRef, useEffect, useCallback, Component } from 'react';
import cx from 'classnames';
import { filter, FilterDataView, DataTypes, BinnedDataView } from '@heswell/data';
import { FlexBox, TabbedContainer } from '@heswell/inlay';
import { Grid, Selection, Draggable, PopupService } from '@heswell/ingrid';
import ReactDOM from 'react-dom';
import Dygraph from 'dygraphs';
import { spring, Motion } from 'react-motion';

class CheckList extends React.Component {
  render() {
    return React.createElement(Grid, {
      className: "checkbox-list",
      debug_title: this.props.debug_title,
      showHeaders: false,
      rowHeight: 22,
      minColumnWidth: 80,
      columns: this.props.columns,
      selectionModel: Selection.Checkbox,
      height: this.props.height,
      width: this.props.width,
      style: this.props.style,
      dataView: this.props.dataView
    });
  }

}

class SearchBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      searchText: ''
    };
  }

  render() {
    const {
      style: {
        height
      },
      inputWidth,
      selectionText,
      onClickSelectionText,
      onHide
    } = this.props;
    return React.createElement("div", {
      className: "filter-toolbar",
      style: {
        height
      }
    }, React.createElement("div", {
      className: "filter-button",
      onClick: onHide
    }, React.createElement("i", {
      className: "material-icons"
    }, "filter_list")), React.createElement("input", {
      className: "search-text",
      style: {
        width: inputWidth
      },
      type: "text",
      value: this.state.searchText,
      onChange: e => this.handleSearchTextChange(e)
    }), React.createElement("div", {
      className: "mass-select",
      onClick: onClickSelectionText
    }, selectionText));
  }

  handleSearchTextChange(evt) {
    const {
      value
    } = evt.target;
    let {
      searchText
    } = this.state;

    this.setState({
      searchText: value
    });
    this.props.onSearchText(value);
  }

}

const {
  IN,
  NOT_IN,
  STARTS_WITH,
  NOT_STARTS_WITH,
  SET_FILTER_DATA_COLUMNS: filterColumns
} = filter;
const NO_STYLE = {};
const NO_COUNT = {};
const INCLUDE = 'include';
const EXCLUDE = 'exclude';
const SELECT_ALL = 'select-all';
const SELECT_NONE = 'select-none';
const ZeroRowFilter = {
  colName: 'count',
  type: NOT_IN,
  values: [0]
};
const SetFilter = ({
  className,
  column,
  dataView,
  filter: filter$1,
  height,
  onClose,
  onHide,
  onMouseDown,
  style = NO_STYLE,
  suppressHeader = false,
  suppressSearch = false,
  suppressFooter = false
}) => {
  const columnFilter = filter.extractFilterForColumn(filter$1, column.name);
  const [showZeroRows, setZeroRows] = useState(true);
  const [dataCounts, setDataCounts] = useState(NO_COUNT);
  const [selectionDefault, setSelectionDefault] = useState(columnFilter && columnFilter.type === IN ? SELECT_NONE : SELECT_ALL);
  const filterView = useRef(new FilterDataView(dataView, column));
  const searchText = useRef('');
  useEffect(() => {
    // TODO how do we add multiple subscriptions
    filterView.current.subscribeToDataCounts(setDataCounts);
    return () => {
      filterView.current.unsubscribeFromDataCounts();
      onHide();
    };
  }, [dataView]);
  const toggleZeroRows = useCallback(() => {
    const showZero = !showZeroRows;
    setZeroRows(showZero);
    filterView.current.filter(showZero ? null : ZeroRowFilter);
  }, [showZeroRows]);

  const handleSearchText = text => {
    searchText.current = text;
    filterView.current.getFilterData(column, text); // if we're removing searchtext to widen the search, we need to reevaluate the selectionDefault
  };

  const handleDeselectAll = useCallback(() => {
    if (searchText.current) {
      applyFilter(NOT_STARTS_WITH, searchText.current);
    } else {
      applyFilter(IN, undefined, []);
    }

    setSelectionDefault(SELECT_NONE);
  }, [column]);
  const handleSelectAll = useCallback(() => {
    if (searchText.current) {
      applyFilter(STARTS_WITH, searchText.current);
    } else {
      applyFilter(NOT_IN, undefined, []);
    }

    setSelectionDefault(SELECT_ALL);
  }, [column]);
  const applyFilter = useCallback((type, value, values) => {
    filterView.current.filter({
      type,
      colName: column.name,
      value,
      values
    }, DataTypes.ROW_DATA, true);
  }, [column]);
  const allSelected = selectionDefault === SELECT_ALL;
  const clickHandler = allSelected ? handleDeselectAll : handleSelectAll;

  const handleMouseDown = e => {
    console.log('onMouseDown');
    onMouseDown(e);
  }; // TODO envelope should be part of columnFilter


  return React.createElement(FlexBox, {
    className: cx('SetFilter', 'ColumnFilter', className),
    style: {
      width: 300,
      height,
      visibility: style.visibility
    }
  }, suppressHeader !== true && React.createElement("div", {
    className: "col-header HeaderCell",
    style: {
      height: 25
    },
    onMouseDown: handleMouseDown
  }, React.createElement("div", {
    className: "col-header-inner",
    style: {
      width: column.width - 1
    }
  }, column.name)), React.createElement(FlexBox, {
    className: "filter-inner",
    style: {
      flex: 1
    }
  }, suppressSearch !== true && React.createElement(SearchBar, {
    style: {
      height: 25
    },
    inputWidth: column.width - 16,
    searchText: searchText,
    onSearchText: handleSearchText,
    selectionText: allSelected ? 'DESELECT ALL' : 'SELECT ALL',
    onClickSelectionText: clickHandler,
    onHide: onClose
  }), React.createElement(CheckList, {
    style: {
      flex: 1,
      margin: '3px 3px 0 3px',
      border: '1px solid lightgray'
    },
    columns: filterColumns,
    dataView: filterView.current
  }), React.createElement(FilterCounts, {
    style: {
      height: 50
    },
    column: column,
    dataCounts: dataCounts,
    searchText: searchText
  }), suppressFooter !== true && React.createElement("div", {
    key: "footer",
    className: "footer",
    style: {
      height: 26
    }
  }, React.createElement("button", {
    className: "toggle-zero-rows",
    onClick: toggleZeroRows
  }, showZeroRows ? 'Hide zero rows' : 'Show zero rows'), React.createElement("button", {
    className: "filter-done-button",
    onClick: onClose
  }, "Done"))));
};

function FilterCounts({
  column,
  dataCounts
  /*, searchText*/

}) {
  const {
    dataRowTotal,
    dataRowAllFilters,
    filterRowTotal,
    filterRowSelected
  } = dataCounts;
  return React.createElement("div", {
    className: "filter-count-section"
  }, React.createElement("div", {
    className: "filter-row-counts"
  }, React.createElement("div", null, `Distinct values for ${column.name}`), React.createElement("div", {
    className: "filter-row-table"
  }, React.createElement("div", null, React.createElement("span", null, "Selected"), React.createElement("span", null, filterRowSelected)), React.createElement("div", null, React.createElement("span", null, "Total"), React.createElement("span", null, filterRowTotal)))), React.createElement("div", {
    className: "data-row-counts"
  }, React.createElement("div", null, `Data records`), React.createElement("div", {
    className: "filter-row-table"
  }, dataRowAllFilters < dataRowTotal ? React.createElement("div", null, React.createElement("span", null, "Filtered"), React.createElement("span", null, dataRowAllFilters)) : React.createElement("div", null, React.createElement("span", null, "\xA0"), React.createElement("span", null, "\xA0")), React.createElement("div", null, React.createElement("span", null, "Total"), React.createElement("span", null, dataRowTotal)))));
}

function barChartPlotter(e) {
  const ctx = e.drawingContext;
  const points = e.points;
  const y_bottom = e.dygraph.toDomYCoord(0); // ctx.fillStyle = darkenColor(e.color);

  ctx.fillStyle = 'rgb(0,0,0)';
  ctx.strokeStyle = 'rgb(0,0,0)'; // Find the minimum separation between x-values.
  // This determines the bar width.

  let min_sep = Infinity;

  for (let i = 1; i < points.length; i++) {
    const sep = points[i].canvasx - points[i - 1].canvasx;

    if (sep < min_sep) {
      min_sep = sep;
    }
  }

  const bar_width = Math.floor(2.0 / 3 * min_sep);
  const height = 60; // Do the actual plotting.

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const center_x = p.canvasx;
    const canvasY = p.yval === 0 ? p.canvasy : Math.min(p.canvasy, height - 1);
    ctx.fillRect(center_x - bar_width / 2, canvasY, bar_width, y_bottom - canvasY); //   ctx.strokeRect(center_x - bar_width / 2, p.canvasy,
    //       bar_width, y_bottom - p.canvasy);
  }
}

const DEFAULT_STATE = {
  op1: 'GE',
  val1: '',
  op2: 'LE',
  val2: ''
};
const NO_STYLE$1 = {};
class NumberFilter extends React.Component {
  constructor(props) {
    super(props);
    this.graph = null;
    this._filterChart = null;
    this.binnedValues = [];
    const {
      column,
      filter: filter$1,
      dataView
    } = this.props;
    const columnFilter = filter.extractFilterForColumn(filter$1, column.name);
    this.filterView = new BinnedDataView(dataView);
    this.state = { ...this.extractStateFromFilter(columnFilter)
    };
  }

  componentDidMount() {
    this.filterView.subscribe({
      range: {
        lo: -1,
        hi: -1
      }
    }, values => this.onFilterBins(values));
    this.createGraph();
  }

  componentWillUnmount() {
    this.filterView.destroy();
    this.graph.destroy();
    this.props.onHide();
  }

  onFilterBins(values) {
    console.log(`onFilterBins`, values, this.graph);

    if (this.graph) {
      this.graph.destroy();

      if (values.length) {
        this.binnedValues = values;
        this.createGraph();
        this.graph.updateOptions({
          file: values.map(([x, y]) => [x, y])
        });
      }
    } else {
      this.binnedValues = values;
    }
  }

  extractStateFromFilter(filter) {
    if (!filter) {
      return DEFAULT_STATE;
    } else if (filter.type === 'AND') {
      const [f1, f2] = filter.filters;
      return {
        op1: f1.type,
        val1: f1.value,
        op2: f2.type,
        val2: f2.value
      };
    } else {
      return {
        op1: filter.type,
        val1: filter.value,
        op2: null,
        val2: ''
      };
    }
  }

  onChange(evt) {
    const {
      name,
      value
    } = evt.target;
    this.setState({
      [name]: value
    });
  }

  apply() {
    const {
      column,
      onApplyFilter
    } = this.props;
    const {
      op1,
      val1,
      op2,
      val2
    } = this.state;
    onApplyFilter(column, this.buildFilter(column, op1, val1, op2, val2));
  }

  buildFilter(column, op1, val1, op2, val2) {
    const filter1 = {
      type: op1,
      colName: column.name,
      value: parseFloat(val1)
    };

    if (op1 === 'EQ' || op1 === 'NE' || val2 === '') {
      return filter1;
    }

    const filter2 = {
      type: op2,
      colName: column.name,
      value: parseFloat(val2)
    };
    return {
      type: 'AND',
      filters: [filter1, filter2],
      isNumeric: true
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.filter !== this.props.filter) {
      console.log(`[NumberFilter] got new filter ${JSON.stringify(nextProps.filter)}`);
    }
  }

  selectRange(min, max) {
    console.log(`select range ${min} - ${max}`);
    const values = this.binnedValues;
    const loIdx = Math.ceil(min);
    const hiIdx = Math.floor(max);
    const lo = values[loIdx - 1][2];
    const hi = values[Math.min(hiIdx, values.length) - 1][3];
    console.log(`select Range ${loIdx} -  ${hiIdx} === ${lo} to ${hi}`);
    this.setState({
      op1: 'GE',
      val1: lo,
      op2: 'LE',
      val2: hi
    }, () => {
      this.apply();
    });
  }

  render() {
    const {
      column,
      className,
      height,
      width = column.width + 100,
      style = NO_STYLE$1,
      suppressHeader = false,
      suppressSearch = false,
      suppressFooter = false
    } = this.props;
    const {
      op1,
      val1,
      op2,
      val2
    } = this.state; // const width = column.width + 100;

    return React.createElement(FlexBox, {
      className: cx('NumberFilter', 'ColumnFilter', className),
      style: {
        width,
        height,
        visibility: style.visibility
      }
    }, suppressHeader !== true && React.createElement("div", {
      className: "col-header HeaderCell",
      style: {
        height: 25
      }
    }, React.createElement("div", {
      className: "col-header-inner",
      style: {
        width: column.width - 1
      }
    }, column.name)), React.createElement(FlexBox, {
      className: "filter-inner",
      style: {
        flex: 1
      }
    }, suppressSearch !== true && React.createElement(SearchBar, {
      style: {
        height: 25
      },
      inputWidth: column.width - 16,
      searchText: '',
      onSearchText: this.handleSearchText
    }), React.createElement("div", {
      className: "filter-chart",
      ref: c => this._filterChart = ReactDOM.findDOMNode(c),
      style: {
        width,
        height: 60
      }
    }), React.createElement("div", {
      className: "filter-control-row",
      style: {
        height: 24
      }
    }, React.createElement("div", {
      className: "input-wrapper"
    }, React.createElement("input", {
      name: "val1",
      type: "text",
      value: val1,
      onChange: e => this.onChange(e)
    })), React.createElement("div", {
      className: "input-wrapper"
    }, React.createElement("input", {
      name: "val2",
      type: "text",
      value: val2,
      onChange: e => this.onChange(e)
    }))), React.createElement("div", {
      className: "filter-control-row filter-select",
      style: {
        height: 20
      }
    }, React.createElement("div", {
      className: "input-wrapper"
    }, React.createElement("select", {
      name: "op1",
      value: op1,
      onChange: e => this.onChange(e)
    }, React.createElement("option", {
      value: "GE"
    }, "GE"), React.createElement("option", {
      value: "GT"
    }, "GT"), React.createElement("option", {
      value: "LE"
    }, "LE"), React.createElement("option", {
      value: "LT"
    }, "LT"), React.createElement("option", {
      value: "EQ"
    }, "EQ"), React.createElement("option", {
      value: "NE"
    }, "NE"))), React.createElement("div", {
      className: "input-wrapper"
    }, React.createElement("select", {
      name: "op2",
      value: op2,
      onChange: e => this.onChange(e)
    }, React.createElement("option", {
      value: "LE"
    }, "LE"), React.createElement("option", {
      value: "LT"
    }, "LT"), React.createElement("option", {
      value: "GE"
    }, "GE"), React.createElement("option", {
      value: "GT"
    }, "GT")))), React.createElement("div", {
      className: "filter-row",
      style: {
        flex: 1
      }
    }, React.createElement("span", null, "Save filter ...")), suppressFooter !== true && React.createElement("div", {
      key: "footer",
      className: "footer",
      style: {
        height: 26
      }
    }, React.createElement("button", {
      className: "filter-done-button",
      onClick: this.props.onClose
    }, "Done"))));
  } // note this range, if not [0,0] will cause selection to be highlighted in graph


  getRangeFromState() {
    const {
      val1,
      val2
    } = this.state;
    const values = this.binnedValues;
    console.log(`getRange from state ${val1} ${val2}`, values);

    if (val1 && val2) {
      const idx1 = indexOf(val1, values);
      const idx2 = indexOf(val2, values);

      if (idx1 === -1 || idx2 === -1) {
        return [0, 0];
      } else {
        return [idx1, idx2];
      }
    } else {
      return [0, 0];
    }
  }

  createGraph() {
    const values = this.binnedValues;

    if (!values || values.length === 0) {
      return;
    }

    console.log(values);
    let [_minX = 0, _maxX = 0] = this.getRangeFromState();
    console.log(`cdm (${_minX}) (${_maxX})`);

    const _maxRange = values.length + 1;

    const _values = values.map(([x, y]) => [x, y]);

    const graph = window.graph = this.graph = new Dygraph(this._filterChart, _values, {
      width: 240,
      height: 60,
      axes: {
        x: {
          drawAxis: false,
          drawGrid: false
        },
        y: {
          drawAxis: false,
          drawGrid: false
        }
      },
      xRangePad: 3,
      animatedZooms: false,
      zoomCallback: (minDate, maxDate
      /*, yRanges*/
      ) => {
        console.log(`zoomCallback (${minDate}) (${maxDate})`);
        _minX = minDate;
        _maxX = maxDate;
        graph.updateOptions({
          dateWindow: [0, _maxRange],
          valueRange: null
        });
        this.selectRange(minDate, maxDate);
      },
      underlayCallback: function (canvas, area, g) {
        console.log(`underlayCallback (${_minX}) (${_maxX})`);
        const bottom_left = g.toDomCoords(_minX, -20);
        const top_right = g.toDomCoords(_maxX, +20);
        const left = bottom_left[0];
        const right = top_right[0];
        canvas.fillStyle = 'rgba(255, 255, 102, 1.0)';
        canvas.fillRect(left, area.y, right - left, area.h);
      },
      dateWindow: [0, _maxRange],
      includeZero: true,
      showLabelsOnHighlight: false,
      plotter: barChartPlotter
    });
  }

}

function indexOf(val, values) {
  for (let i = 0; i < values.length; i++) {
    if (val >= values[i][2] && val <= values[i][3]) {
      return i + 1;
    }
  }

  return -1;
}

class MultiColumnFilter extends React.Component {
  render() {
    console.log(`RENDER MULTI COLUMN FILTER`);
    const {
      column,
      className,
      height,
      width,
      dataView,
      onSelectionChange
    } = this.props;
    const {
      columns,
      width: columnWidth
    } = column;
    return React.createElement(FlexBox, {
      className: cx('MultiColumnFilter', 'FilterPanel', className),
      style: {
        width,
        height
      }
    }, React.createElement("div", {
      className: "column-selector",
      style: {
        height: 0
      }
    }), React.createElement(TabbedContainer, {
      className: "tabbed-filters",
      style: {
        flex: 1
      },
      tabstripHeight: 25,
      onTabSelectionChanged: idx => this.handleSwitchFilter(idx)
    }, columns.map((column, i) => React.createElement(SetFilter, {
      key: i,
      title: column.name,
      dataView: dataView,
      column: { ...column,
        width: columnWidth
      },
      width: width,
      height: height,
      suppressHeader: true,
      suppressFooter: true,
      onSearchText: this.props.onSearchText,
      onSelectionChange: (selected, filterMode) => onSelectionChange(selected, filterMode, column)
    }))), React.createElement("div", {
      className: "footer",
      style: {
        height: 24,
        backgroundColor: 'red'
      }
    }, React.createElement("button", {
      className: "filter-done-button",
      onClick: this.props.onClose
    }, "Done")));
  }

  handleSwitchFilter(idx) {
    const column = this.props.column.columns[idx];
    console.log(`switching column to ${JSON.stringify(column)}`);
    this.props.dataView.getFilterData(column);
  }

  componentWillUnmount() {
    if (this.props.onHide) {
      this.props.onHide();
    }
  }

}

const List = ({
  items,
  onMouseDown,
  onItemAdded,
  style
}) => {
  const handleMouseDown = ({
    target,
    pageX,
    pageY
  }, column) => {
    onMouseDown(column, target.getBoundingClientRect(), pageX, pageY);
  };

  const {
    width,
    height
  } = style;
  const listItems = items.map((item, idx) => {
    let mouseDownHandler = item.inUse ? null : e => handleMouseDown(e, item.column);
    return React.createElement("div", {
      key: item.column.name,
      onMouseDown: mouseDownHandler,
      className: "ListItem demo8-item",
      style: {
        width: width - 15,
        height: 23,
        lineHeight: '22px',
        backgroundColor: item.inUse ? '#ccc' : 'white',
        boxShadow: `rgba(0, 0, 0, 0.2) 0px 1px 2px 0px`,
        transform: `translate3d(0, ${idx * 24}px, 0)`,
        zIndex: idx
      }
    }, React.createElement("span", null, `${idx + 1}  ${item.column.name}`), item.inUse ? null : React.createElement("div", {
      className: "button add",
      onClick: () => onItemAdded(item),
      onMouseDown: e => e.stopPropagation()
    }, React.createElement("i", {
      className: "material-icons"
    }, "add")));
  });
  return React.createElement("div", {
    className: "List",
    style: style
  }, React.createElement("div", {
    className: "ViewPort",
    style: {
      position: 'absolute',
      overflow: 'hidden',
      top: 0,
      left: 0,
      width,
      height
    }
  }, React.createElement("div", {
    className: "scrollable-content",
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      width,
      height,
      overflow: 'auto'
    }
  }, React.createElement("div", {
    className: "scrolling-canvas-container",
    style: {
      width: width - 15,
      height: items.length * 24
    }
  }, listItems))));
};

const springConfig = {
  stiffness: 300,
  damping: 50
};

const noop = () => {};

function clamp(n, min, max) {
  return Math.max(Math.min(n, max), min);
}

function reinsert(arr, from, to) {
  const _arr = arr.slice(0);

  const val = _arr[from];

  _arr.splice(from, 1);

  _arr.splice(to, 0, val);

  return _arr;
}

const List$1 = ({
  className,
  dragged = {
    item: null
  },
  // should we rely on this being passed in ?
  dragging,
  // not sura about this one
  items,
  mouseMoveX,
  mouseMoveY,
  onItemRemoved = noop,
  onMeasure = noop,
  onReorder = noop,
  onTarget,
  style
}) => {
  const delta = useRef(0);
  const dragOffset = useRef({
    x: 0,
    y: 0
  });
  const el = useRef(null);
  const isPressed = useRef(false);
  const lastPressed = useRef(null);
  const lastItems = useRef(items);
  const lastPressedPos = useRef(0);
  const orderedItems = useRef(Array.from(Array(items.length), (_, i) => i));
  const [state, setState] = useState({
    isDragging: false,
    mouse: 0
  });

  if (lastItems.current !== items) {
    lastItems.current = items;
    orderedItems.current = Array.from(Array(items.length), (_, i) => i);
  }

  useEffect(() => {
    var {
      left,
      top,
      right,
      bottom
    } = el.current.getBoundingClientRect();
    setState(currentState => ({ ...currentState,
      left,
      top,
      right,
      bottom
    }));
    onMeasure({
      left,
      top,
      right,
      bottom
    });
  }, []);
  useEffect(() => {
    if (dragged.item) {
      dragOffset.current = {
        x: dragged.rect.left - state.left,
        y: dragged.rect.top - state.top
      };
    }
  }, [dragged]);

  const handleMouseDown = (item, pos, pressY, {
    pageY
  }) => {
    isPressed.current = true;
    lastPressed.current = item;
    lastPressedPos.current = pos;
    delta.current = pageY - pressY;
    setState(currentState => ({ ...currentState,
      isDragging: true,
      mouse: pressY
    }));
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = useCallback(({
    pageY
  }) => {
    if (isPressed.current) {
      const mouse = pageY - delta.current;
      const row = clamp(Math.round(mouse / 24), 0, items.length - 1);
      const order = orderedItems.current;
      orderedItems.current = reinsert(order, order.indexOf(lastPressedPos.current), row);
      setState(currentState => ({ ...currentState,
        mouse
      }));
    }
  }, [items.length]);
  const handleMouseUp = useCallback(() => {
    // pass all these in callback, so parent can feed them back in
    isPressed.current = false;
    delta.current = 0;
    onReorder(orderedItems.current);
    setState(currentState => ({ ...currentState,
      isDragging: false
    }));
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }, []);
  const {
    mouse
  } = state;
  const {
    x: dragOffsetX,
    y: dragOffsetY
  } = dragOffset.current;
  const content = items.map((item, idx) => {
    const order = orderedItems.current;
    const motionStyle = lastPressed.current === item && isPressed.current ? {
      scale: spring(1.01, springConfig),
      shadow: spring(16, springConfig),
      x: 0,
      y: mouse
    } : item === dragged.item && onTarget ? dragging ? {
      scale: spring(1.01, springConfig),
      shadow: spring(16, springConfig),
      x: dragOffsetX + mouseMoveX,
      y: dragOffsetY + mouseMoveY
    } : {
      // Dropped onto target, slot into final resting place
      scale: spring(1, springConfig),
      shadow: spring(1, springConfig),
      x: spring(0, springConfig),
      y: spring(order.indexOf(idx) * 24, springConfig)
    } : {
      scale: spring(1, springConfig),
      shadow: spring(1, springConfig),
      x: 0,
      y: spring(order.indexOf(idx) * 24, springConfig)
    };
    return React.createElement(Motion, {
      style: motionStyle,
      key: item.name
    }, ({
      scale,
      shadow,
      x,
      y
    }) => React.createElement("div", {
      onMouseDown: e => handleMouseDown(item, idx, y, e),
      className: "ListItem demo8-item",
      style: {
        width: style.width,
        height: 23,
        boxShadow: `rgba(0, 0, 0, 0.2) 0px ${shadow}px ${2 * shadow}px 0px`,
        transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
        zIndex: item === lastPressed.current || item === dragged.item ? 99 : idx
      }
    }, React.createElement("span", null, `${order.indexOf(idx) + 1}  ${item.name}`), dragging && item === dragged.item ? null : React.createElement("div", {
      className: "button remove",
      onClick: () => onItemRemoved(item)
    }, React.createElement("i", {
      className: "material-icons"
    }, "clear"))));
  });

  if (dragged.item && !onTarget) {
    const style2 = dragging ? {
      scale: spring(1.01, springConfig),
      shadow: spring(16, springConfig),
      x: dragOffsetX + mouseMoveX,
      y: dragOffsetY + mouseMoveY
    } : {
      // No Drop - return to base - need to remove node at end
      scale: spring(1, springConfig),
      shadow: spring(1, springConfig),
      x: spring(dragOffsetX, springConfig),
      y: spring(dragOffsetY, springConfig)
    };
    content.push(React.createElement(Motion, {
      style: style2,
      key: "dragged"
    }, ({
      scale,
      shadow,
      x,
      y
    }) => React.createElement("div", {
      className: "ListItem demo8-item",
      style: {
        width: style.width,
        backgroundColor: dragging ? 'yellow' : 'white',
        boxShadow: `rgba(0, 0, 0, 0.2) 0px ${shadow}px ${2 * shadow}px 0px`,
        transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
        zIndex: 99
      }
    }, `${dragged.item.name}`)));
  }

  return React.createElement("div", {
    ref: el,
    className: cx('List', className),
    style: style
  }, content);
};

const uuid = require('uuid');

class ColumnPicker extends Component {
  constructor(props) {
    super(props);
    this.state = {
      layoutModel: this.getLayoutModel(),
      selectedColumns: this.props.columns
    };
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
  }

  render() {
    const {
      availableColumns
    } = this.props;
    const {
      selectedColumns,
      dragged,
      dragging,
      mouseMoveX,
      mouseMoveY,
      pageX,
      pageY,
      onTarget
    } = this.state;
    const availableItems = availableColumns.map(column => ({
      column,
      inUse: selectedColumns.findIndex(({
        name
      }) => name === column.name) !== -1
    }));
    var className = cx(this.props.className, 'ColumnPicker');
    return React.createElement(FlexBox, {
      className: className,
      style: this.props.style
    }, React.createElement(FlexBox, {
      style: {
        flex: 1,
        flexDirection: 'row',
        paddingLeft: 12,
        paddingRight: 12,
        paddingTop: 15,
        paddingBottom: 9
      }
    }, React.createElement(List, {
      style: {
        flex: 1
      },
      items: availableItems,
      onItemAdded: item => this.handleItemAdded(item),
      onMouseDown: (item, rect, x, y) => this.handleDragStartAvailableItem(item, rect, x, y)
    }), React.createElement(List$1, {
      style: {
        flex: 1,
        backgroundColor: 'white'
      },
      items: selectedColumns,
      dragged: dragged,
      dragging: dragging,
      pageX: pageX,
      pageY: pageY,
      onTarget: onTarget,
      mouseMoveX: mouseMoveX,
      mouseMoveY: mouseMoveY,
      onItemRemoved: item => this.handleItemRemoved(item),
      onMeasure: rect => this.handleMeasure(rect),
      onReorder: order => this.handleReorder(order)
    })));
  }

  getLayoutModel() {
    if (this.state) {
      return this.state.layoutModel;
    } else {
      var {
        top = 0,
        left = 0,
        width,
        height
      } = this.props.style;
      return {
        type: 'FlexBox',
        $id: this.props.id || uuid.v1(),
        $path: '0',
        $version: 1,
        style: {
          position: 'absolute',
          width,
          height,
          flexDirection: 'column'
        },
        $position: {
          top,
          left,
          width,
          height
        },
        children: []
      };
    }
  } // submit = () => {
  //     this.props.onCommit(this.state.selectedColumns);
  // };
  // cancel = () => {
  //     this.props.onCancel();
  // };


  handleMeasure(rect) {
    console.log(`targetListRect`, rect);
    this.setState({
      targetListRect: rect
    });
  }

  handleReorder(order) {
    console.log(`handleReorder ${JSON.stringify(order)}`);
    var {
      selectedColumns
    } = this.state;
    var columns = [];
    order.forEach((idx, i) => {
      columns[i] = selectedColumns[idx];
    });
    this.setState({
      selectedColumns: columns
    });
    this.props.onChange({
      columns
    });
  }

  handleItemAdded(item) {
    var selectedColumns = this.state.selectedColumns.concat(item.column);
    this.setState({
      selectedColumns
    });
    this.props.onChange({
      columns: selectedColumns
    });
  }

  handleItemRemoved(item) {
    var selectedColumns = this.state.selectedColumns.filter(col => col !== item);
    this.setState({
      selectedColumns
    });
    this.props.onChange({
      columns: selectedColumns
    });
  }

  // layout BpxModel contains an identical function
  containsPoint(rect, x, y) {
    var {
      top,
      left,
      right,
      bottom
    } = rect;
    return x >= left && x < right && y >= top && y < bottom;
  }

  handleDragStartAvailableItem(item, rect, x, y) {
    this.setState({
      dragged: {
        item,
        rect,
        // offset of exact mouse position from item left,top
        offetX: x - rect.left,
        offsetY: y - rect.top,
        startX: x,
        startY: y
      },
      mouseMoveX: 0,
      mouseMoveY: 0,
      onTarget: false,
      dragging: true
    });
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);
  }

  handleMouseMove({
    pageX,
    pageY
  }) {
    const {
      onTarget: wasOnTarget,
      targetListRect,
      dragged: {
        startX,
        startY,
        item
      },
      selectedColumns
    } = this.state;
    var onTarget = this.containsPoint(this.state.targetListRect, pageX, pageY);

    if (onTarget && !wasOnTarget) {
      let pos = Math.floor((pageY - targetListRect.top) / 24);
      let columns = selectedColumns.slice();
      columns.splice(pos, 0, item);
      this.setState({
        onTarget,
        selectedColumns: columns
      });
    } else if (wasOnTarget && !onTarget) {
      let idx = selectedColumns.indexOf(item);

      if (idx !== -1) {
        let columns = selectedColumns.slice();
        columns.splice(idx, 1);
        this.setState({
          onTarget,
          selectedColumns: columns
        });
      }
    } else if (onTarget && wasOnTarget) {
      //onsole.log(`insert pos ${pos}`);
      let pos = Math.floor((pageY - targetListRect.top) / 24);
      let idx = selectedColumns.indexOf(item);

      if (idx !== -1 && idx !== pos) {
        let columns = selectedColumns.slice();
        columns.splice(idx, 1);
        columns.splice(pos, 0, item);
        this.setState({
          onTarget,
          selectedColumns: columns
        });
      }
    }

    this.setState({
      mouseMoveX: pageX - startX,
      mouseMoveY: pageY - startY,
      pageX,
      pageY
    });
  }

  handleMouseUp() {
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);
    this.setState({
      dragging: false
    });
    this.props.onChange({
      columns: this.state.selectedColumns
    });
  }

}
ColumnPicker.defaultProps = {
  style: {},
  selectedColumns: [],
  onChange: config => {
    console.log(`[ColumnPicker] onChange ${JSON.stringify(config, null, 2)}`);
  },
  onCommit: config => console.log(`[ColumnPicker] onCommit ${JSON.stringify(config, null, 2)}`),
  onCancel: () => console.log(`[ColumnPicker] onCancel`)
};

var dialog = (({
  buttons,
  children,
  onButtonClick,
  title
}) => {
  const buttonBar = buttons ? React.createElement("div", {
    className: "buttons"
  }, buttons.map(key => getButton(key, onButtonClick))) : null;
  return React.createElement("div", {
    className: "dialog"
  }, React.createElement(Draggable, {
    onDrag: moveFilter
  }, React.createElement("div", {
    className: "title"
  }, React.createElement("span", null, title), React.createElement("i", {
    className: "material-icons"
  }, "clear"))), React.createElement("div", {
    className: "content-container"
  }, children, buttonBar));
});

function moveFilter(e, deltaX, deltaY) {
  PopupService.movePopup(deltaX, deltaY);
}

const getButton = (key, onClick) => React.createElement("button", {
  key: key,
  onClick: () => onClick(key)
}, key);

export { ColumnPicker, dialog as Dialog, EXCLUDE, INCLUDE, MultiColumnFilter, NumberFilter, SetFilter };
//# sourceMappingURL=index.js.map
