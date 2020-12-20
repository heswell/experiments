import React from "react";
import PropTypes from "prop-types";

import { isPlainObject } from "./internal/helpers";
import { useDescendant } from "./internal/DescendantContext";
import { useListItem } from "./useListItem";
import ListItemBase from "./ListItemBase";

const ListItem = (props) => {
  const {
    children,
    item = props.item === undefined && !isPlainObject(children)
      ? children
      : props.item,
    ...restProps
  } = props;

  const { itemToString, itemProps } = useListItem({
    index: useDescendant(item),
    item,
    ...restProps,
  });

  const itemText = itemToString(item);

  return (
    <ListItemBase tooltipText={itemText} {...itemProps}>
      {children !== undefined ? children : itemText}
    </ListItemBase>
  );
};

ListItem.propTypes = {
  /**
   * The content of the item.
   */
  children: PropTypes.node,
  /**
   * The className(s) of the component.
   */
  className: PropTypes.string,
  /**
   * Useful to extend the style applied to components.
   */
  classes: PropTypes.objectOf(PropTypes.string),
  /**
   * The density of a component affects the style of the layout.
   *
   * A high density component uses minimal sizing and spacing to convey the intended UI design.
   * Conversely, a low density component, maximizes the use of space and size to convey the UI Design.
   */
  density: PropTypes.oneOf(["touch", "low", "medium", "high"]),
  /**
   * If `true`, the component will be disabled.
   */
  disabled: PropTypes.bool,
  /**
   * Object used for the item.
   */
  // eslint-disable-next-line react/forbid-prop-types
  item: PropTypes.any,
  /**
   * Item `toString` function when the item prop is used.
   *
   * If omitted, component will look for a `label` property on the data object.
   *
   * @param {object} item The item.
   */
  itemToString: PropTypes.func,
};

export default ListItem;
