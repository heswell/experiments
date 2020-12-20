import { useEffect, useCallback, useRef, useState } from "react";
import {
  getWithDefault,
  ownerDocument,
  useForkRef,
  useId,
  useControlled,
  useIsFocusVisible,
} from "../utils";
import warning from "warning";

export function useList(props = {}) {
  validateProps(props);

  const generatedId = useId(props.id);

  const {
    id = generatedId,
    source = [],
    itemCount = source.length,
    getItemId = (index) => `${id}-item-${index}`,
    getItemAtIndex: getItemAtIndexProp,
    getItemIndex: getItemIndexProp,
    displayedItemCount = 10,
    initialSelectedItem,
    selectionVariant,
    disabled,
    onBlur,
    onChange,
    onFocus,
    onKeyDown,
    onMouseLeave,
    onSelect,
    restoreLastFocus,
    highlightedIndex: highlightedIndexProp,
    selectedItem: selectedItemProp,
    tabToSelect,
    ...restProps
  } = props;

  const {
    isFocusVisible,
    onBlurVisible,
    ref: focusVisibleRef,
  } = useIsFocusVisible();

  const { current: isDeselectable } = useRef(
    selectionVariant === "deselectable"
  );
  const { current: isMultiSelect } = useRef(
    selectionVariant === "multiple" ||
      Array.isArray(initialSelectedItem) ||
      Array.isArray(selectedItemProp)
  );

  let getItemIndex = useCallback((item) => source.indexOf(item), [source]);
  let getItemAtIndex = useCallback((index) => source[index], [source]);

  const indexComparator = useCallback(
    (a, b) => getItemIndex(a) - getItemIndex(b),
    [getItemIndex]
  );

  // Only use getItemIndex and getItemAtIndex if both are defined; otherwise keep the defaults
  if (
    typeof getItemIndexProp === "function" &&
    typeof getItemAtIndexProp === "function"
  ) {
    getItemIndex = getItemIndexProp;
    getItemAtIndex = getItemAtIndexProp;
  }

  const rootRef = useRef();
  const [focusVisible, setFocusVisible] = useState(false);
  const [lastFocusedIndex, setLastFocusedIndex] = useState(-1);

  const [selectedItem, setSelectedItem] = useControlled({
    controlled: selectedItemProp,
    default: getWithDefault(initialSelectedItem, isMultiSelect ? [] : null),
    name: "useList",
    state: "selectedItem",
  });

  const [highlightedIndex, setHighlightedIndex] = useControlled({
    controlled: highlightedIndexProp,
    name: "useList",
    state: "highlightedIndex",
  });

  const handleSingleSelect = useCallback(
    (event, index, item) => {
      const isSelected = item === selectedItem;
      let nextItem;

      if (isSelected && !isDeselectable) {
        return;
      }

      if (!isSelected) {
        nextItem = item;
        setHighlightedIndex(index);
      } else {
        nextItem = null;
      }

      setSelectedItem(nextItem);

      if (onChange) {
        onChange(event, nextItem);
      }
    },
    [
      isDeselectable,
      onChange,
      selectedItem,
      setHighlightedIndex,
      setSelectedItem,
    ]
  );

  const handleMultiSelect = useCallback(
    (event, index, item) => {
      const isSelected = selectedItem.indexOf(item) !== -1;
      let nextItems = selectedItem;

      if (!isSelected) {
        nextItems = nextItems.concat(item).sort(indexComparator);
        setHighlightedIndex(index);
      } else {
        nextItems = nextItems.filter((selected) => selected !== item);
      }

      setSelectedItem(nextItems);

      if (onChange) {
        onChange(event, nextItems);
      }
    },
    [
      indexComparator,
      onChange,
      selectedItem,
      setHighlightedIndex,
      setSelectedItem,
    ]
  );

  const handleSelect = useCallback(
    (event, index, item) => {
      if (item == null || item.disabled) {
        return;
      }

      if (onSelect) {
        onSelect(event, item);
      }

      if (isMultiSelect) {
        handleMultiSelect(event, index, item);
      } else {
        handleSingleSelect(event, index, item);
      }
    },
    [handleMultiSelect, handleSingleSelect, isMultiSelect, onSelect]
  );

  const saveFocusedIndex = (index) => {
    setLastFocusedIndex(index);
    return index;
  };

  const keyDownHandlers = {
    ArrowUp: (event) => {
      event.preventDefault();
      setHighlightedIndex((prevHighlightedIndex) =>
        saveFocusedIndex(Math.max(0, prevHighlightedIndex - 1))
      );
    },
    ArrowDown: (event) => {
      event.preventDefault();
      setHighlightedIndex((prevHighlightedIndex) =>
        saveFocusedIndex(Math.min(itemCount - 1, prevHighlightedIndex + 1))
      );
    },
    PageUp: (event) => {
      event.preventDefault();
      setHighlightedIndex((prevHighlightedIndex) =>
        saveFocusedIndex(Math.max(0, prevHighlightedIndex - displayedItemCount))
      );
    },
    PageDown: (event) => {
      event.preventDefault();
      setHighlightedIndex((prevHighlightedIndex) =>
        saveFocusedIndex(
          Math.min(itemCount - 1, prevHighlightedIndex + displayedItemCount)
        )
      );
    },
    Home: (event) => {
      event.preventDefault();
      setHighlightedIndex(saveFocusedIndex(0));
    },
    End: (event) => {
      event.preventDefault();
      setHighlightedIndex(saveFocusedIndex(itemCount - 1));
    },
    Enter: (event) => {
      event.preventDefault();
      handleSelect(event, highlightedIndex, getItemAtIndex(highlightedIndex));
    },
    [" "]: (event) => {
      event.preventDefault();
      handleSelect(event, highlightedIndex, getItemAtIndex(highlightedIndex));
    },
    Tab: (event) => {
      if (tabToSelect) {
        handleSelect(event, highlightedIndex, getItemAtIndex(highlightedIndex));
      } else {
        setHighlightedIndex(undefined);
      }
    },
  };

  const handleKeyDown = (event) => {
    if (isFocusVisible(event)) {
      setFocusVisible(true);
    }

    const handler = keyDownHandlers[event.key];

    if (handler) {
      handler(event);
    }

    if (onKeyDown) {
      onKeyDown(event);
    }
  };

  const handleFocus = (event) => {
    if (isFocusVisible(event)) {
      setFocusVisible(true);
    }

    // Work out the index to highlight
    if (highlightedIndex === undefined) {
      const firstSelectedItem = isMultiSelect ? selectedItem[0] : selectedItem;

      setHighlightedIndex(
        Math.max(
          restoreLastFocus ? lastFocusedIndex : getItemIndex(firstSelectedItem),
          0
        )
      );
    }

    if (onFocus) {
      onFocus(event);
    }
  };

  const handleBlur = (event) => {
    setHighlightedIndex(undefined);
    setFocusVisible(false);
    onBlurVisible();

    if (onBlur) {
      onBlur(event);
    }
  };

  const handleMouseLeave = (event) => {
    if (focusVisible) {
      // Get the root node of the component if we have access to it otherwise default to current document
      const rootNode = (
        rootRef.current || ownerDocument(event.currentTarget)
      ).getRootNode();

      const listNode = rootNode.getElementById(id);

      // Safety check as `mouseleave` could have been accidentally triggered by an opening tooltip
      // when you use keyboard to navigate, hence the focusVisible check earlier
      if (listNode.contains(event.target)) {
        setHighlightedIndex(undefined);
      }
    } else {
      setHighlightedIndex(undefined);
    }

    if (onMouseLeave) {
      onMouseLeave(event);
    }
  };

  const eventHandlers = {
    onFocus: handleFocus,
    onBlur: handleBlur,
    onKeyDown: handleKeyDown,
    onMouseLeave: handleMouseLeave,
  };

  const ariaProps = {
    role: "listbox",
    "aria-activedescendant":
      highlightedIndex >= 0 ? getItemId(highlightedIndex) : null,
  };

  if (isMultiSelect) {
    ariaProps["aria-multiselectable"] = true;
  }

  return {
    focusableRef: useForkRef(rootRef, focusVisibleRef),
    state: {
      id,
      focusVisible,
      selectedItem,
      highlightedIndex,
      isMultiSelect,
      isDisabled: disabled,
    },
    helpers: {
      setFocusVisible,
      setSelectedItem,
      setHighlightedIndex,
      keyDownHandlers,
      isFocusVisible,
      onBlurVisible,
      handleSelect,
    },
    listProps: {
      id,
      source,
      itemCount,
      displayedItemCount,
      getItemAtIndex,
      getItemIndex,
      getItemId,
      disabled,
      ...ariaProps,
      ...restProps,
      ...(disabled ? {} : eventHandlers),
    },
  };
}

const validateProps = (props) => {
  if (process.env.NODE_ENV !== "production") {
    const { source, itemCount, getItemIndex, getItemAtIndex } = props;

    const hasIndexer =
      typeof getItemIndex === "function" &&
      typeof getItemAtIndex === "function";

    const hasNoIndexer =
      getItemIndex === undefined && getItemAtIndex === undefined;

    /* eslint-disable react-hooks/rules-of-hooks */
    useEffect(() => {
      warning(
        source == null || Array.isArray(source),
        "`source` for useList must be an array."
      );
    }, [source]);

    useEffect(() => {
      warning(
        hasNoIndexer || hasIndexer,
        "useList needs to have both `getItemIndex` and `getItemAtIndex`."
      );

      warning(
        hasNoIndexer || itemCount !== undefined,
        "useList needs to have `itemCount` if an indexer is used."
      );
    }, [hasIndexer, hasNoIndexer, itemCount]);
    /* eslint-enable react-hooks/rules-of-hooks */
  }
};
