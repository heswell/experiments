import React, {
  forwardRef,
  createContext,
  memo,
  useRef,
  useContext,
  useLayoutEffect,
  useImperativeHandle,
  useMemo,
} from "react";
import PropTypes from "prop-types";
import classnames from "classnames";
import { FixedSizeList, VariableSizeList, areEqual } from "react-window";
import { getWithDefault, refType, useForkRef, useId } from "../utils";
import { useDensity } from "../theme";
import ListItemBase from "./ListItemBase";
import ListItemContext from "./ListItemContext";
import { useListStateContext } from "./ListStateContext";
import { useListItem, useVirtualizedListItem } from "./useListItem";
import { useListItemHeight } from "./internal/useListItemHeight";
import { useListAutoSizer } from "./internal/useListAutoSizer";
import { scrollIntoView } from "./internal/scrollIntoView";
import { calcPreferredListHeight } from "./internal/calcPreferredListHeight";
import { itemToString as defaultItemToString } from "./itemToString";

import "./List.css";

// export const useStyles = createUseStyles(
//   (theme) => {
//     const {
//       container: { getContainer },
//       disabled: { getDisabled },
//     } = theme.toolkit;

//     return {
//       root: {
//         boxSizing: "border-box",
//         overflowY: "auto",
//         "&:not($borderless)": getContainer(),
//         "&:focus": {
//           outline: "none",
//         },
//       },
//       wrapper: {
//         position: "relative",
//       },
//       borderless: {
//         border: "none",
//       },
//       disabled: getDisabled(),
//       touchDensity: {},
//       lowDensity: {},
//       mediumDensity: {},
//       highDensity: {},
//     };
//   },
//   { name: "List" }
// );

const ListboxContext = createContext();
const DefaultItem = memo(function DefaultItem(props) {
  const { item, itemToString, itemProps } = useListItem(props);
  return <ListItemBase {...itemProps}>{itemToString(item)}</ListItemBase>;
}, areEqual);

const DefaultVirtualizedItem = memo(function DefaultVirtualizedItem(props) {
  const { item, itemToString, itemProps } = useVirtualizedListItem(props);
  return <ListItemBase {...itemProps}>{itemToString(item)}</ListItemBase>;
}, areEqual);

/**
 * Listbox is the container for all list items. It is used as `outerElement` for
 * `react-window`.
 *
 * forwardRef gives `react-window` a way to attach a ref to listen to "scroll" events.
 * And `onScroll` is added by `react-window` so we pass it on.
 */
const Listbox = forwardRef(function Listbox(props, ref) {
  const { style, onScroll, children } = props;

  const {
    className,
    borderless,
    density,
    disabled,
    disableFocus,
    listRef,
    style: styleProp,
    onScroll: onScrollProp,
    ...restListProps
  } = useContext(ListboxContext);

  const setListRef = useForkRef(ref, listRef);

  const handleScroll = (event) => {
    if (onScroll) {
      onScroll(event);
    }

    if (onScrollProp) {
      onScrollProp(event);
    }
  };

  return (
    <div
      className={classnames(
        "List",
        `${density}Density`,
        {
          borderless,
          disabled,
        },
        className
      )}
      onScroll={handleScroll}
      ref={setListRef}
      style={{ ...style, ...styleProp }}
      tabIndex={disabled || disableFocus ? null : 0}
      {...restListProps}
    >
      {children}
    </div>
  );
});

Listbox.propTypes = {
  children: PropTypes.node.isRequired,
  onScroll: PropTypes.func,
  style: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ),
};

const ListBase = forwardRef(function ListBase(props, ref) {
  const density = useDensity(props.density);

  const { state } = useListStateContext();

  // Getting list id in the following order:
  // 1. Use the id prop if it's defined, otherwise..
  // 2. Use the id from list context if it's defined, or finally...
  // 3. Generate a random id.
  const generatedId = useId(props.id);
  const defaultId = getWithDefault(state.id, generatedId);

  const defaultItemHeight = useListItemHeight(density);
  const hasIndexer = typeof props.getItemAtIndex === "function";
  const hasVariableHeight = typeof props.getItemHeight === "function";

  const {
    id = defaultId,
    source = [],
    borderless,
    children,
    itemTextHighlightPattern,
    itemCount = source.length,
    itemToString = defaultItemToString,
    itemHeight = defaultItemHeight,
    getItemHeight = () => itemHeight,
    getItemId = (index) => `${id}-item-${index}`,
    getItemIndex = (item) => source.indexOf(item),
    getItemAtIndex,
    overscanCount = 10,
    displayedItemCount = 10,
    virtualized,
    width,
    height,
    maxWidth,
    maxHeight,
    minWidth,
    minHeight,
    ListPlaceholder,
    ListItem = virtualized ? DefaultVirtualizedItem : DefaultItem,
    listRef: listRefProp,
    ...restProps
  } = props;

  const { highlightedIndex } = state;

  const preferredHeight = getWithDefault(
    height,
    calcPreferredListHeight({
      borderless,
      displayedItemCount,
      itemCount,
      itemHeight,
      getItemHeight,
    })
  );

  const [containerRef, autoSize] = useListAutoSizer({
    responsive: width === undefined || height === undefined,
    height: preferredHeight,
    width,
  });

  /**
   * This is used to access `react-window` API
   * @see https://react-window.now.sh/#/api/FixedSizeList (under `Methods`)
   */
  const virtualizedListRef = useRef();
  const listRef = useRef();

  const setListRef = useForkRef(listRef, listRefProp);
  const setContainerRef = useForkRef(ref, containerRef);

  const scrollToIndex = (itemIndex) => {
    scrollIntoView(
      listRef.current.querySelector(`[data-option-index="${itemIndex}"]`),
      listRef
    );
  };

  const scrollHandles = useMemo(
    () => ({
      scrollToIndex,
      scrollToItem: (item) => {
        scrollToIndex(getItemIndex(item));
      },
      scrollTo: (scrollOffset) => {
        listRef.current.scrollTop = scrollOffset;
      },
    }),
    [getItemIndex]
  );

  const virtualizedScrollHandles = useMemo(
    () => ({
      scrollToIndex: (itemIndex) => {
        virtualizedListRef.current.scrollToItem(itemIndex);
      },
      scrollToItem: (item) => {
        virtualizedListRef.current.scrollToItem(getItemIndex(item));
      },
      scrollTo: (scrollOffset) => {
        virtualizedListRef.current.scrollTo(scrollOffset);
      },
    }),
    [getItemIndex]
  );

  useImperativeHandle(
    ref,
    () => {
      if (virtualized && virtualizedListRef.current) {
        return virtualizedScrollHandles;
      } else if (listRef.current) {
        return scrollHandles;
      }
    },
    [virtualized, scrollHandles, virtualizedScrollHandles]
  );

  useLayoutEffect(() => {
    if (highlightedIndex == null) {
      return;
    }

    if (virtualized && virtualizedListRef.current) {
      virtualizedListRef.current.scrollToItem(highlightedIndex);
    } else if (listRef.current) {
      scrollToIndex(highlightedIndex);
    }
  }, [highlightedIndex, virtualized]);

  const renderList = () => {
    if (React.Children.count(children)) {
      return (
        <Listbox style={autoSize}>
          <ListItemContext.Provider
            value={{
              density,
              getItemId,
              getItemHeight,
              itemToString,
              itemTextHighlightPattern,
            }}
          >
            {children}
          </ListItemContext.Provider>
        </Listbox>
      );
    }

    if (virtualized) {
      const VirtualizedList = hasVariableHeight
        ? VariableSizeList
        : FixedSizeList;

      return (
        <ListItemContext.Provider
          value={{
            density,
            getItemId,
            itemToString,
            itemTextHighlightPattern,
          }}
        >
          <VirtualizedList
            height={autoSize.height}
            itemCount={itemCount}
            itemData={source}
            itemSize={hasVariableHeight ? getItemHeight : itemHeight}
            outerElementType={Listbox}
            overscanCount={overscanCount}
            ref={virtualizedListRef}
            width={autoSize.width}
          >
            {ListItem}
          </VirtualizedList>
        </ListItemContext.Provider>
      );
    }

    return (
      <Listbox style={autoSize}>
        <ListItemContext.Provider
          value={{
            density,
            getItemId,
            getItemHeight,
            itemToString,
            itemTextHighlightPattern,
          }}
        >
          {(hasIndexer ? Array.from({ length: itemCount }) : source).map(
            (item, index) => (
              <ListItem
                index={index}
                item={hasIndexer ? getItemAtIndex(index) : item}
                key={getItemId(index)}
              />
            )
          )}
        </ListItemContext.Provider>
      </Listbox>
    );
  };

  // TODO It's weird that List itself isn't the root element, ListWrapper is
  // THat means if client passes style, with margin, for example, it will break;
  return (
    <div
      className="List-wrapper"
      ref={setContainerRef}
      style={{
        minWidth,
        minHeight,
        width: getWithDefault(width, "100%"),
        height: getWithDefault(height, "100%"),
        maxWidth: getWithDefault(maxWidth, width),
        maxHeight: getWithDefault(maxHeight, preferredHeight),
      }}
    >
      {itemCount === 0 && ListPlaceholder !== undefined ? (
        <ListPlaceholder style={autoSize} />
      ) : (
        <ListboxContext.Provider
          value={{
            ...restProps,
            listRef: setListRef,
            id,
            density,
            borderless,
          }}
        >
          {renderList()}
        </ListboxContext.Provider>
      )}
    </div>
  );
});

ListBase.propTypes = {
  /**
   * The component used for item instead of the default.
   */
  ListItem: PropTypes.func,
  /**
   * The component used when there are no items.
   */
  ListPlaceholder: PropTypes.func,
  /**
   * If `true`, the component will have no border.
   */
  borderless: PropTypes.bool,
  /**
   * Item nodes if the component is used declaratively.
   */
  children: PropTypes.node,
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
   * The function for getting item's index.
   *
   * @param {object} item The item.
   */
  getItemIndex: PropTypes.func,
  /**
   * Height of the component.
   */
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /**
   * Id of the component. If omitted a randomly generated id will be used.
   */
  id: PropTypes.string,
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
   * Data source used. It should be an array of objects or strings.
   */
  source: PropTypes.arrayOf(PropTypes.any),
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

export default ListBase;
