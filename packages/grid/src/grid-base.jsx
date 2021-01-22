//@ts-nocheck
import React, {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import cx from "classnames";
import { useEffectSkipFirst } from "@heswell/utils";
import GridContext from "./grid-context";
import { MenuProvider } from "./context-menu/menu-context";
import { ComponentProvider } from "./component-context";
import modelReducer, { initModel } from "./grid-model-reducer";
import useAdornments from "./use-adornments";
import useDataSourceModelBindings from "./use-datasource-model-bindings";
import Viewport from "./viewport";
import { measureColumns } from "./grid-model-utils";
import components from "./standard-renderers";

import "./grid-base.css";

/** @type {GridComponent} */
const GridBase = (props) => {
  // TODO height needs to default to auto
  const gridEl = useRef(null);
  const viewport = useRef(null);
  // const scrollableHeader = useRef(null);
  const initialRender = useRef(true);
  /** @type {[ColumnDragData, React.Dispatch<ColumnDragData>]} */
  const [columnDragData, setColumnDragData] = useState(null);
  const draggingColumn = useRef(false);

  const [dataSource, setDataSource] = useState(props.dataSource);

  const handleSelectionChange = useCallback(
    ({ idx, row, rangeSelect, keepExistingSelection }) => {
      console.log(
        `Grid onSelectionChange idx=${idx} rangeSelect=${rangeSelect} keepExistingSelection=${keepExistingSelection}`
      );
      dataSource.select(idx, rangeSelect, keepExistingSelection);
      //if (onSelectionChange){
      //const isSelected = row[model.meta.SELECTED] === 1;
      // TODO what about range selections
      //onSelectionChange && onSelectionChange(idx, row, !isSelected)
      //}
      // if (selected.length === 1 && onSingleSelect) {
      //     onSingleSelect(selected[0], selectedItem);
      // }
    },
    []
  );

  const handleHorizontalScrollStart = () => {
    if (!draggingColumn.current) {
      viewport.current.beginHorizontalScroll();
      gridEl.current.classList.add("scrolling-x");
      gridEl.current.style.paddingTop = gridModel.customHeaderHeight + "px";
    }
  };

  const handleHorizontalScrollEnd = () => {
    if (!draggingColumn.current) {
      viewport.current.endHorizontalScroll();
      gridEl.current.classList.remove("scrolling-x");
      const {
        headerHeight,
        headingDepth,
        customHeaderHeight,
        customInlineHeaderHeight,
      } = gridModel;
      const totalHeaderHeight =
        headerHeight * headingDepth +
        customHeaderHeight +
        customInlineHeaderHeight;
      gridEl.current.style.paddingTop = totalHeaderHeight + "px";
    }
  };

  const invokeDataSourceOperation = (operation) => {
    switch (operation.type) {
      case "group":
        return dataSource.group(operation.columns);
      case "sort":
        return dataSource.sort(operation.columns);
      default:
        console.log(
          `[GridBase] dataSourceOperation: unknown operation ${operation.type}`
        );
    }
  };

  const dispatchGridAction = (action) =>
    ({
      group: invokeDataSourceOperation,
      sort: invokeDataSourceOperation,
      selection: handleSelectionChange,
      "scroll-end-horizontal": handleHorizontalScrollEnd,
      "scroll-start-horizontal": handleHorizontalScrollStart,
    }[action.type](action));

  const custom = useAdornments(props);

  const [gridModel, dispatchGridModel] = useReducer(
    modelReducer,
    [props, custom],
    initModel
  );

  const datasourceHandler = useCallback((eventName, ...args) => {
    switch (eventName) {
      case "group":
        return dispatchGridModel({ type: "group", columns: args[0] });
      case "sort":
        return dispatchGridModel({ type: "sort", columns: args[0] });
      default:
    }
  }, []);

  // New
  useEffect(() => {
    dataSource.on("*", datasourceHandler);
    return () => {
      dataSource.removeListener("*", datasourceHandler);
    };
  }, [dataSource]);

  //TODO do we need to useCallback here - can we ever send stale props ?
  useEffectSkipFirst(() => {
    dispatchGridModel({ type: "initialize", props });
    if (props.dataSource !== dataSource) {
      setDataSource(props.dataSource);
    }
  }, [props.columns, props.columnSizing, props.dataSource, props.groupBy]);

  useDataSourceModelBindings(dataSource, gridModel);

  const handleColumnDragStart = useCallback(
    (phase, ...args) => {
      const [columnGroupIdx, column, columnPosition, mousePosition] = args;
      const { left } = gridEl.current.getBoundingClientRect();
      const columnGroup = gridModel.columnGroups[columnGroupIdx];
      handleHorizontalScrollStart();
      setColumnDragData({
        column,
        columnGroupIdx,
        columnIdx: columnGroup.columns.findIndex(
          (col) => col.key === column.key
        ),
        initialColumnPosition: columnPosition - left,
        columnPositions: measureColumns(gridModel, left),
        mousePosition,
      });
      draggingColumn.current = true;
    },
    [gridModel]
  );
  const handleColumnDrop = useCallback(
    (phase, ...args) => {
      const [column, insertIdx] = args;
      setColumnDragData(null);
      draggingColumn.current = false;
      // TODO we need the final scrollLeft here
      handleHorizontalScrollEnd();
      dispatchGridModel({ type: "add-col", column, insertIdx });
    },
    [gridModel]
  );

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
    } else {
      dispatchGridModel({
        type: "resize",
        height: props.height,
        width: props.width,
      });
    }
  }, [props.height, props.width]);

  const { height, width, headerHeight, headingDepth } = gridModel;
  const totalHeaderHeight =
    custom.header.height +
    headerHeight * headingDepth +
    custom.inlineHeader.height;
  return (
    // Question, how much overhead are we introducing be adding gridModel to GridContext ? Perhaps it belongs in it's own context
    <GridContext.Provider
      value={{
        custom,
        dataSource,
        dispatchGridAction,
        dispatchGridModelAction: dispatchGridModel,
        gridModel,
      }}
    >
      <MenuProvider>
        <ComponentProvider components={components}>
          <div
            className={cx("Grid", props.className)}
            ref={gridEl}
            style={{ width, height, paddingTop: totalHeaderHeight }}
          >
            {custom.header.component}
            <Viewport
              custom={custom}
              dataSource={dataSource}
              gridModel={gridModel}
              columnDragData={columnDragData}
              onColumnDragStart={handleColumnDragStart}
              onColumnDrop={handleColumnDrop}
              ref={viewport}
            />
            {custom.footer.component}
          </div>
        </ComponentProvider>
      </MenuProvider>
    </GridContext.Provider>
  );
};

export default GridBase;
