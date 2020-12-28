import React, { forwardRef, useRef } from "react";
import PropTypes from "prop-types";
import classnames from "classnames";
import { useTheme } from "../theme";
import { refType, useForkRef } from "../utils";
import { Popper, usePopperPositioning } from "../popper";

import { ListBase, ListStateContext } from "../list";
import DropdownButton from "./DropdownButton";
import { useDropdown } from "./useDropdown";

import "./Dropdown.css";

/**
 * Renders a basic dropdown with selectable item
 */
const Dropdown = forwardRef(function Dropdown(props, ref) {
  const { className, PopperProps, ...restProps } = props;
  const {
    rootProps,
    buttonProps: { buttonRef, ...buttonProps },
    listContext,
    listProps,
  } = useDropdown(restProps);

  const listRef = useRef(null);
  const { id: themeId } = useTheme();

  const {
    density,
    disabled,
    fullWidth,
    isOpen,
    ref: rootRef,
    ...restRootProps
  } = rootProps;

  const [popperPosition, maxListHeight] = usePopperPositioning(
    rootRef,
    listRef,
    isOpen
  );
  return (
    <div
      className={classnames(
        "Dropdown",
        `Dropdown-${density}Density`,
        {
          "Dropdown-disabled": disabled,
          "Dropdown-fullwidth": fullWidth,
        },
        className
      )}
      ref={useForkRef(rootRef, ref)}
      {...restRootProps}
    >
      {props.children ? (
        props.children({
          DropdownButtonProps: { buttonRef, ...buttonProps },
          isOpen,
          itemToString: listProps.itemToString,
          selectedItem: listContext.state.selectedItem,
        })
      ) : (
        <DropdownButton {...buttonProps} ref={buttonRef} />
      )}
      {rootRef.current && (
        <Popper
          anchorEl={rootRef.current}
          className={classnames("Dropdown-popper", themeId)}
          open={isOpen}
          placement={popperPosition}
          role={null}
          {...PopperProps}
        >
          <ListStateContext.Provider value={listContext}>
            <ListBase
              data-jpmui-test="dropdown-list"
              {...listProps}
              maxHeight={maxListHeight || listProps.maxHeight}
              ref={listRef}
            />
          </ListStateContext.Provider>
        </Popper>
      )}
    </div>
  );
});

Dropdown.defaultProps = {
  iconName: "down-arrow",
};

Dropdown.propTypes = {
  /**
   * Props to be applied on the default button component
   */
  // eslint-disable-next-line react/forbid-prop-types
  ButtonProps: PropTypes.object,
  /**
   * The component used for item instead of the default.
   */
  ListItem: PropTypes.func,
  /**
   * Properties applied to the `List` element.
   */
  // eslint-disable-next-line react/forbid-prop-types
  ListProps: PropTypes.object,
  /**
   * @external - react-popper
   * Override react-popper props
   */
  // eslint-disable-next-line react/forbid-prop-types
  PopperProps: PropTypes.object,
  /**
   * Object that houses ADA-related props.
   *
   * @property {bool} virtualized Set to `true` to boost browser performance
   * for long lists by rendering only the items currently scrolled into view
   * (plus overscan items). JSX: `adaExceptions={{virtualized:true}}`
   * For better ADA support, omit (or set to `false`).
   */
  adaExceptions: PropTypes.shape({
    virtualized: PropTypes.bool,
  }),
  /**
   * If the component has no border.
   */
  borderless: PropTypes.bool,
  /**
   * A ref to the button
   */
  buttonRef: refType,
  /**
   * Override the triggering component
   */
  children: PropTypes.func,
  /**
   * The className(s) of the component
   */
  className: PropTypes.string,
  /**
   * The density of a component affects the style of the layout.
   * A high density component uses minimal sizing and spacing to convey the intended UI design.
   * Conversely, a low density component, maximizes the use of space and size to convey the UI Design.
   */
  density: PropTypes.oneOf(["touch", "low", "medium", "high"]),
  /**
   * Disable user interaction
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
   * If `true`, the Dropdown will occupy the full width of it's container
   */
  fullWidth: PropTypes.bool,
  /**
   * Sets the icon name, default is 'down-arrow'
   */
  iconName: PropTypes.string,
  /**
   * Sets the size of the down arrow icon. If this is not specified, a default size based on density is used.
   */
  iconSize: PropTypes.number,
  /**
   * Sets the id of the component.
   */
  id: PropTypes.string,
  /**
   * This is the initial isOpen value.
   *
   * @default false
   */
  initialIsOpen: PropTypes.bool,
  /**
   * Pass an item that should be selected by default.
   */
  // eslint-disable-next-line react/forbid-prop-types
  initialSelectedItem: PropTypes.any,
  /**
   * Whether the menu should be considered open or closed. Some aspects of the
   * downshift component respond differently based on this value (for example,
   * if isOpen is true when the user hits "Enter" on the input field, then the
   * item at the highlightedIndex item is selected).
   */
  isOpen: PropTypes.bool,
  /**
   * Used to determine the string value for the selected item.
   */
  itemToString: PropTypes.func,
  /**
   * Used to provide a custom list renderer. This should only be used in
   * rare occasions, like for custom elements.
   */
  listRenderer: PropTypes.func,
  /**
   * Customize width of the Dropdown List. This supersedes `width`.
   */
  listWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /**
   * @external - material-ui
   * Callback fired by the input component onBlur.
   *
   * @param {object} event The event source of the callback
   */
  onBlur: PropTypes.func,
  /**
   * Called when user clicks on the dropdown button.
   *
   * @param {object} event The event source of the callback
   */
  onButtonClick: PropTypes.func,
  /**
   * Called when the user selects an item and the selected item has changed.
   *
   * @param {object} event The event source of the callback
   * @param {any} selectedItem The item that was just selected
   */
  onChange: PropTypes.func,
  /**
   * @external - material-ui
   * Callback fired by the input component onFocus.
   *
   * @param {object} event The event source of the callback
   */
  onFocus: PropTypes.func,
  /**
   * Called when the user mouses off the button.
   */
  onMouseLeave: PropTypes.func,
  /**
   * Called when the user mouses over the button.
   */
  onMouseOver: PropTypes.func,
  /**
   * Called when the user selects an item, regardless of the previous selected
   * item.
   *
   * @param {object} event The event source of the callback
   * @param {any} selectedItem The item that was just selected
   */
  onSelect: PropTypes.func,
  /**
   * The currently selected item.
   */
  // eslint-disable-next-line react/forbid-prop-types
  selectedItem: PropTypes.any,
  /**
   * List of items when using a Dropdown.
   */
  source: PropTypes.arrayOf(PropTypes.any).isRequired,
  /**
   Customize width of Dropdown. Also controls Dropdown List if `listWidth` prop is not set.
   */
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default Dropdown;
