import { useMemo, useRef } from "react";
import { useForkRef, useA11yProps, useId, useControlled } from "../utils";
import { useFormFieldProps } from "../form-field-context";
import {
  itemToString as defaultItemToString,
  useList,
  useTypeSelect,
} from "../list";
import { useDensity } from "../theme";

import { useResizeObserver } from "./internal/useResizeObserver";

export function useDropdown(props = {}, isMultiSelect = false) {
  const a11yProps = useA11yProps();
  const {
    fullWidth: formFieldFullWidth,
    onFocus: formFieldOnFocus,
    onBlur: formFieldOnBlur,
  } = useFormFieldProps();

  const {
    ButtonProps = {},
    ListItem,
    ListProps,
    adaExceptions: { virtualized } = {},
    borderless = false,
    buttonRef: buttonRefProp,
    children,
    density: densityProp,
    disabled,
    displayedItemCount,
    fullWidth: fullWidthProp = formFieldFullWidth,
    iconName,
    iconSize,
    id: idProp,
    initialIsOpen = false,
    initialSelectedItem,
    isOpen: isOpenProp,
    itemToString = defaultItemToString,
    listWidth: listWidthProp,
    onBlur: onBlurProp,
    onButtonClick: onButtonClickProp,
    onChange: onChangeProp,
    onFocus: onFocusProp,
    onMouseLeave,
    onMouseOver,
    onSelect,
    selectedItem: selectedItemProp,
    source,
    width: widthProp,
    ...rest
  } = props;

  const id = useId(idProp);
  const buttonRef = useRef(null);
  const density = useDensity(densityProp);

  const isFullWidth =
    fullWidthProp !== undefined ? fullWidthProp : formFieldFullWidth;

  const { ref: rootRef, width: observedWidth } = useResizeObserver({
    fullWidth: isFullWidth,
  });

  const {
    onKeyDown: onButtonKeyDown,
    onKeyDownCapture: onButtonKeyDownCapture,
    ...restButtonProps
  } = ButtonProps;

  const [isOpen, setIsOpen] = useControlled({
    controlled: isOpenProp,
    default: initialIsOpen,
    name: "useDropdown",
    state: "isOpen",
  });

  const listWidth = useMemo(() => {
    if (isFullWidth) {
      return observedWidth ? observedWidth : undefined;
    } else {
      return listWidthProp ? listWidthProp : widthProp;
    }
  }, [isFullWidth, listWidthProp, observedWidth, widthProp]);

  const { focusableRef, state, helpers, listProps } = useList({
    ListItem,
    displayedItemCount,
    id: `${id}-list`,
    initialSelectedItem,
    itemToString,
    onChange: onChangeProp,
    onSelect,
    selectedItem: selectedItemProp,
    selectionVariant: isMultiSelect ? "multiple" : "default",
    source,
    tabToSelect: !isMultiSelect,
    virtualized,
    width: listWidth,
    ...ListProps,
  });

  const { selectedItem, highlightedIndex } = state;

  const { setHighlightedIndex, setFocusVisible } = helpers;

  const {
    onBlur: onListBlur,
    onClick: onListClick,
    onFocus: onListFocus,
    onKeyDown: onListKeyDown,
    id: listId,
    "aria-activedescendant": ariaActivedescendant,
    "aria-multiselectable": ariaMultiselectable,
    getItemAtIndex,
    getItemIndex,
    itemCount,
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

  const getSelectedItemLabel = () => {
    if (isMultiSelect && Array.isArray(selectedItem)) {
      if (selectedItem.length === 0) {
        return undefined;
      } else if (selectedItem.length === 1) {
        return itemToString(selectedItem[0]);
      } else {
        return `${selectedItem.length} items selected`;
      }
    } else {
      return selectedItem == null ? undefined : itemToString(selectedItem);
    }
  };

  const syncListFocus = (event) => {
    if (!isOpen) {
      onListFocus(event);
    } else {
      onListBlur(event);
    }
  };

  const handleButtonClick = (event) => {
    // Do not trigger menu open for 'Enter' and 'SPACE' key as they're handled in `handleButtonKeyDown`
    if (["Enter", " "].indexOf(event.key) === -1) {
      setIsOpen((value) => !value);
      syncListFocus(event);
    }

    if (onButtonClickProp) {
      onButtonClickProp(event);
    }
  };

  // eslint-disable-next-line complexity
  const handleButtonKeyDown = (event) => {
    if ("Escape" === event.key) {
      event.preventDefault();
      if (isOpen) {
        setIsOpen(false);
        onListBlur(event);
      }
    } else if ("ArrowDown" === event.key) {
      event.preventDefault();
      if (event.altKey) {
        event.stopPropagation();
      }
      if (!isOpen) {
        setIsOpen(true);
        onListFocus(event);
      }
    } else if ("Tab" === event.key) {
      if (isOpen) {
        setIsOpen(false);
        onListBlur(event);
      }
    } else if (["Enter", " "].indexOf(event.key) !== -1) {
      event.preventDefault();
      if (!isMultiSelect || !isOpen) {
        setIsOpen((value) => !value);
        syncListFocus(event);
      }
    }

    // A lot of keyDown events are shared in the List already
    onListKeyDown(event);

    if (onButtonKeyDown) {
      onButtonKeyDown(event);
    }
  };

  const handleButtonKeyDownCapture = (event) => {
    if (disabled) {
      return;
    }

    if (onTypeSelectKeyDownCapture) {
      onTypeSelectKeyDownCapture(event);
    }

    if (onButtonKeyDownCapture) {
      onButtonKeyDownCapture(event);
    }
  };

  const handleListMouseDown = (event) => {
    // Prevent blur from button
    event.preventDefault();
  };

  const handleListClick = (event) => {
    if (onListClick) {
      onListClick(event);
    }

    if (!isMultiSelect) {
      setIsOpen(false);
    }
  };

  const handleButtonBlur = (event) => {
    setIsOpen(false);

    if (onListBlur) {
      onListBlur(event);
    }

    if (onBlurProp) {
      onBlurProp(event);
    }

    if (formFieldOnBlur) {
      formFieldOnBlur(event);
    }
  };

  const handleButtonFocus = (event) => {
    if (isOpen) {
      onListFocus(event);
    }

    if (onFocusProp) {
      onFocusProp(event);
    }

    if (formFieldOnFocus) {
      formFieldOnFocus(event);
    }
  };

  const dropdownButtonLabelId = `${listId}--label`;

  const dropdownButtonProps = {
    "aria-activedescendant":
      isOpen && ariaActivedescendant
        ? ariaActivedescendant
        : dropdownButtonLabelId,
    "aria-expanded": isOpen,
    "aria-multiselectable": ariaMultiselectable,
    "aria-owns": isOpen ? listId : undefined,
    ariaHideOptionRole: isOpen,
    role: "listbox",

    buttonRef: useForkRef(buttonRef, useForkRef(focusableRef, buttonRefProp)),
    // classes: {
    //   content: classes.content,
    //   buttonLabel: classes.buttonLabel,
    //   icon: classes.icon,
    //   formField: classes.formField,
    //   fullWidth: classes.fullWidth,
    // },
    density,
    disabled,
    fullWidth: isFullWidth,
    iconName,
    iconSize,
    id: rest.id,
    isOpen,
    label: getSelectedItemLabel(),
    labelId: dropdownButtonLabelId,
    // `fullWidth` is handled separately in `DropdownButton`
    style: { width: isFullWidth ? undefined : widthProp },

    onBlur: handleButtonBlur,
    onClick: disabled ? undefined : handleButtonClick,
    onFocus: handleButtonFocus,
    onKeyDown: disabled ? undefined : handleButtonKeyDown,
    onKeyDownCapture: disabled ? undefined : handleButtonKeyDownCapture,
    onMouseLeave,
    onMouseOver,

    ...restButtonProps,
    ...a11yProps,
  };
  return {
    rootProps: {
      ...rest,
      "aria-expanded": undefined,
      "aria-haspopup": undefined,
      "aria-labelledby": undefined,
      "data-jpmui-test": "dropdown",
      disabled,
      density,
      id: idProp,
      isOpen,
      fullWidth: isFullWidth,
      role: undefined,
      ref: rootRef,
    },
    buttonProps: dropdownButtonProps,
    listContext: { state, helpers },
    listProps: {
      "aria-multiselectable": ariaMultiselectable,
      "aria-labelledby": a11yProps["aria-labelledby"],
      id: listId,
      borderless,
      density,
      disableFocus: true,
      onBlur: onListBlur,
      onClick: handleListClick,
      onFocus: onListFocus,
      onKeyDown: onListKeyDown,
      onMouseDown: handleListMouseDown,
      getItemAtIndex,
      getItemIndex,
      itemCount,
      ...restListProps,
    },
  };
}
