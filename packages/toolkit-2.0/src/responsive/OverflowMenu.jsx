import React, { forwardRef } from "react";
import cx from "classnames";
import { Button, Dropdown, Icon } from "@heswell/toolkit-2.0";

import "./OverflowMenu.css";

const OverflowMenu = forwardRef(function OverflowMenu(
  { className, overflowOffsetLeft: left, source = [], ...rest },
  ref
) {
  console.log(`OverFlowMenu source.length = ${source.length}`);

  return source.length > 0 ? (
    <Dropdown
      ListProps={{
        width: 200,
      }}
      ref={ref}
      source={source}
      {...rest}
    >
      {({ DropdownButtonProps, isOpen }) => {
        const { style, ...restButtonProps } = DropdownButtonProps;

        const {
          onClick,
          onKeyDown,
          onFocus,
          onBlur,
          "aria-expanded": menuOpen, // do we use this or isOpen ?
        } = DropdownButtonProps;
        const defaultProps = {
          "data-jpmui-test": "dropdown-button",
          "aria-label": "toggle overflow",
          "aria-haspopup": true,
          className: cx("OverflowMenu-dropdown", {
            "OverflowMenu-open": isOpen,
          }),
          onBlur,
          onClick,
          onFocus,
          onKeyDown,
          title: "Overflow Menu",
          type: "button",
          variant: "secondary",
        };

        return (
          <Button {...defaultProps}>
            <Icon
              accessibleText="overflow menu"
              className="OverflowMenu-icon"
              name="more"
            />
          </Button>
        );
      }}
    </Dropdown>
  ) : null;
});

OverflowMenu.defaultProps = {
  PopperProps: {
    modifiers: {
      offset: {
        offset: "0, 0",
      },
    },
    placement: "bottom-end",
  },
  // placeholder: "",
};

export default OverflowMenu;
