import React, { forwardRef, useRef, useContext } from "react";
import PropTypes from "prop-types";

import { refType, useForkRef } from "../utils";
import ListBase from "./ListBase";
import ListStateContext from "./ListStateContext";
import { useList } from "./useList";
import { useTypeSelect } from "./useTypeSelect";

import DescendantContext, {
  DescendantProvider,
} from "./internal/DescendantContext";
// import TooltipContext from "./TooltipContext";

const ListWithDescendants = forwardRef(function ListWithDescendants(
  props,
  ref
) {
  const { items } = useContext(DescendantContext);

  const { focusableRef, state, helpers, listProps } = useList({
    source: items.current.length ? items.current : [],
    ...props,
  });

  const { highlightedIndex } = state;
  const { setHighlightedIndex, setFocusVisible } = helpers;

  const {
    disabled,
    disableTypeToSelect,
    getItemAtIndex,
    itemCount,
    itemToString,
    onKeyDownCapture: onListKeyDownCapture,
    ...restListProps
  } = listProps;

  const { onKeyDownCapture: onTypeSelectKeyDownCapture } = useTypeSelect({
    getItemAtIndex,
    highlightedIndex,
    itemCount,
    itemToString,
    setFocusVisible,
    setHighlightedIndex,
  });

  const setListRef = useForkRef(focusableRef, props.listRef);

  const handleKeyDownCapture = (event) => {
    if (disabled) {
      return;
    }

    if (onListKeyDownCapture) {
      onListKeyDownCapture(event);
    }

    if (!disableTypeToSelect && onTypeSelectKeyDownCapture) {
      onTypeSelectKeyDownCapture(event);
    }
  };

  return (
    <ListStateContext.Provider value={{ state, helpers }}>
      <ListBase
        listRef={setListRef}
        ref={ref}
        {...restListProps}
        disabled={disabled}
        getItemAtIndex={getItemAtIndex}
        itemCount={itemCount}
        itemToString={itemToString}
        onKeyDownCapture={handleKeyDownCapture}
      />
    </ListStateContext.Provider>
  );
});

ListWithDescendants.propTypes = {
  listRef: refType,
};

const List = forwardRef(function List(props, ref) {
  const {
    Tooltip,
    tooltipEnterDelay,
    tooltipLeaveDelay,
    tooltipPlacement,
    ...restProps
  } = props;

  const itemsRef = useRef([]);

  return (
    // <TooltipContext.Provider
    //   value={{
    //     Tooltip,
    //     enterDelay: tooltipEnterDelay,
    //     leaveDelay: tooltipLeaveDelay,
    //     placement: tooltipPlacement
    //   }}
    // >
    <DescendantProvider items={itemsRef}>
      <ListWithDescendants ref={ref} {...restProps} />
    </DescendantProvider>
    // </TooltipContext.Provider>
  );
});

List.propTypes = {
  /**
   * The component used for item instead of the default.
   */
  ListItem: PropTypes.func,
  /**
   * The component used when there are no items.
   */
  ListPlaceholder: PropTypes.func,
  /**
   * The component used for tooltip instead of the default.
   */
  Tooltip: PropTypes.func,
  /**
   * If `true`, the component will have no border.
   */
  borderless: PropTypes.bool,
  /**
   * The className(s) of the component.
   */
  className: PropTypes.string,
  /**
   * The density of a component affects the style of the layout.
   *
   * A high density component uses minimal sizing and spacing to convey the intended UI design.
   * Conversely, a low density component, maximizes the use of space and size to convey the UI Design.
   */
  density: PropTypes.oneOf(["touch", "low", "medium", "high"]),
  /**
   * If `true`, the component will not receive focus.
   *
   * Useful when list is used with other components to form a tightly coupled atomic component where
   * other components should receive focus instead. For instance, when used with an input to form a
   * combo box the list should not be focusable, the input should receive focus instead.
   */
  disableFocus: PropTypes.bool,
  /**
   * User can quickly type first few characters of item by keyboard and highlight item matching
   * start of the label text. This feature can be turned off by setting this to `true`.
   *
   * @default false
   */
  disableTypeToSelect: PropTypes.bool,
  /**
   * If `true`, the component will be disabled.
   */
  disabled: PropTypes.bool,
  /**
   * The number of items displayed in the visible area.
   *
   * Note that this determines the max height of the list if the list height is not set to 100%.
   *
   * @default 10
   */
  displayedItemCount: PropTypes.number,
  /**
   * The indexer function used when there is no source. It should return a number.
   *
   * @param {number} index The item index.
   */
  getItemAtIndex: PropTypes.func,
  /**
   * Used for providing customized item height. It should return a number or a string if item height
   * is in percentage. When used with `virtualized` prop a variable-height list will be rendered instead
   * of a fixed-height one.
   *
   * @param {number} index The item index.
   */
  getItemHeight: PropTypes.func,
  /**
   * Used for providing customized item ids.
   *
   * @param {number} index The item index.
   */
  getItemId: PropTypes.func,
  /**
   * The indexer function used when there is no source. It should return a number.
   *
   * @param {number} item The item.
   */
  getItemIndex: PropTypes.func,
  /**
   * Height of the component.
   */
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /**
   * Used for a controlled component.
   *
   * @see `selectedItem` prop
   */
  highlightedIndex: PropTypes.number,
  /**
   * Id of the component. If omitted a randomly generated id will be used.
   */
  id: PropTypes.string,
  /**
   * The item selected initially.
   */
  // eslint-disable-next-line react/forbid-prop-types
  initialSelectedItem: PropTypes.any,
  /**
   * The total number of items.
   *
   * Used for keyboard navigation (when `End` key is pressed) and when the list is virtualized.
   *
   * @default source.length
   */
  itemCount: PropTypes.number,
  /**
   * Height of an item. I can be a number or a string if item height is in percentage. If omitted
   * default height values from Toolkit theme will be used.
   *
   * Note that when using a percentage value, the list must have a height.
   */
  itemHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /**
   * Used for providing text highlight.
   *
   * It can be a capturing regex or a string for a straightforward string matching.
   */
  itemTextHighlightPattern: PropTypes.oneOfType([
    PropTypes.instanceOf(RegExp),
    PropTypes.string,
  ]),
  /**
   * Item `toString` function when list is not used declaratively and its items are objects
   * instead of strings. The string value is also used in tooltip when item text is truncated.
   *
   * If omitted, component will look for a `label` property on the data object.
   *
   * @param {object} item The item.
   */
  itemToString: PropTypes.func,
  /**
   * Used for accessing the scrollable list node inside of the component. If you want to access
   * the outer wrapper node use `ref` instead.
   */
  listRef: refType,
  /**
   * Maximum list height.
   */
  maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /**
   * Maximum list width.
   */
  maxWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /**
   * Minimum list height.
   */
  minHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /**
   * Minimum list width.
   */
  minWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /**
   * Callback fired when item selection is changed.
   *
   * Note the selection will be an array if `selectionVariant` is set to `multiple`.
   *
   * @param {object} event The event source of the callback.
   * @param {object} item The selected item(s).
   */
  onChange: PropTypes.func,
  /**
   * Callback fired when item is selected, no matter whether a change is made.
   *
   * @param {object} event The event source of the callback.
   * @param {object} item The selected item.
   */
  onSelect: PropTypes.func,
  /**
   * @external - react-window
   *
   * The number of items to render outside of the visible area.
   *
   * @default 10
   */
  overscanCount: PropTypes.number,
  /**
   * If `true`, the component will remember the last keyboard-interacted position
   * and highlight it when list is focused again.
   */
  restoreLastFocus: PropTypes.bool,
  /**
   * Used for a controlled component.
   *
   * @see `highlightedIndex` prop
   */
  // eslint-disable-next-line react/forbid-prop-types
  selectedItem: PropTypes.any,
  /**
   * If `true`, multiple items can be selected or deselected.
   */
  selectionVariant: PropTypes.oneOf(["default", "deselectable", "multiple"]),
  /**
   * Data source used. It should be an array of objects or strings.
   */
  source: PropTypes.arrayOf(PropTypes.any),
  /**
   * When set to `true`, 'Tab' key selects current highlighted item before focus is blurred away
   * from the component. This would be the desirable behaviour for any dropdown menu based
   * components like dropdown, combobox.
   *
   * @default false
   */
  tabToSelect: PropTypes.bool,
  /**
   * The number of milliseconds to wait before showing the tooltip.
   *
   * @default 1500
   */
  tooltipEnterDelay: PropTypes.number,
  /**
   * The number of milliseconds to wait before hiding the tooltip.
   *
   * @default 0
   */
  tooltipLeaveDelay: PropTypes.number,
  /**
   * The position of the tooltip.
   *
   * @default top
   */
  tooltipPlacement: PropTypes.oneOf(["right", "top", "left", "bottom"]),
  /**
   * @external - react-window
   *
   * If `true`, list will be virtualized.
   * @see https://github.com/bvaughn/react-window
   */
  virtualized: PropTypes.bool,
  /**
   * Width of the component.
   */
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default List;
