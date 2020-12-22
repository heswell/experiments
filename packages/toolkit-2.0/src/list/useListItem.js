import { useEffect, useMemo, useCallback } from "react";

import { useListStateContext } from "./ListStateContext";
import { useListItemContext } from "./ListItemContext";

export function useListItem(props = {}) {
  validateProps(props);

  const context = useListItemContext();
  const { state, helpers } = useListStateContext();
  const { setHighlightedIndex, setFocusVisible, handleSelect } = helpers;
  const {
    focusVisible,
    highlightedIndex,
    selectedItem,
    isDisabled,
    isMultiSelect
  } = state;

  const {
    index,
    item,
    onClick,
    onMouseMove,
    density = context.density,
    id = context.getItemId(index),
    itemHeight = context.getItemHeight(index),
    itemToString = context.itemToString,
    // An item can be disabled by
    // 1. Setting disabled attribute on the item object, or
    // 2. Passing a disabled prop directly or
    // 3. Using the disabled state in list context
    disabled = item.disabled || isDisabled,
    ariaProps: ariaPropsProp,
    style: styleProp,
    ...restProps
  } = props;

  const style = useMemo(
    () => ({
      height: itemHeight,
      ...styleProp
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [itemHeight, JSON.stringify(styleProp)]
  );

  const highlighted = index === highlightedIndex;
  const selected = isMultiSelect
    ? selectedItem.indexOf(item) !== -1
    : item === selectedItem;

  const handleClick = useCallback(
    (event) => {
      handleSelect(event, index, item);

      if (onClick) {
        onClick(event);
      }
    },
    [handleSelect, index, item, onClick]
  );

  const handleMouseMove = useCallback(
    (event) => {
      setHighlightedIndex(index);
      setFocusVisible(false);

      if (onMouseMove) {
        onMouseMove(event);
      }
    },
    [index, setFocusVisible, setHighlightedIndex, onMouseMove]
  );

  const disableMouseDown = useCallback((event) => {
    event.preventDefault();
  }, []);

  const eventHandlers = {
    onClick: handleClick,
    onMouseMove: handleMouseMove
  };

  const ariaProps = {
    role: "option",
    ...(selected && { "aria-selected": true }),
    ...(disabled && { "aria-disabled": true }),
    ...ariaPropsProp
  };

  return {
    item,
    itemToString,
    itemProps: {
      "data-option-index": index,
      id,
      style,
      density,
      disabled,
      selected,
      highlighted,
      focusVisible: focusVisible && highlighted,
      tooltipText: itemToString(item),
      ...ariaProps,
      ...restProps,
      // Disable `mousedown` so that activeElement doesn't change when clicking on a disabled item
      ...(disabled ? { onMouseDown: disableMouseDown } : eventHandlers)
    }
  };
}

export const useVirtualizedListItem = (props = {}) => {
  const { index, data, style = {} } = props;
  // Filter out inline width added by `react-window` so that it can only be defined using css.
  const { width: _unusedWidth, height: itemHeight, ...restStyle } = style;

  return useListItem({
    index,
    itemHeight,
    style: restStyle,
    item: data[index],
    ariaProps: {
      "aria-posinset": index + 1,
      "aria-setsize": data.length
    }
  });
};

const validateProps = (props) => {
  const { index, item } = props;

  /* eslint-disable react-hooks/rules-of-hooks */
  useEffect(() => {
    if (item === undefined) {
      console.warn("useListItem needs `item`.");
    }
    if (index === undefined) {
      console.warn("useListItem needs to know item's index.");
    }
  }, [index, item]);
  /* eslint-enable react-hooks/rules-of-hooks */
};
