import React, { forwardRef } from "react";
import cx from "classnames";
import { Dropdown } from "@heswell/toolkit-1.0";
import { Button, Icon } from "@heswell/toolkit-2.0";
// Just until we get rid of toolkit 1.0
import useStyles from "./TabsStyle";

const OverflowMenu = forwardRef(function OverflowMenu(
  { className, overflowOffsetLeft: left, source = [], ...rest },
  ref
) {
  const classes = useStyles();
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
          "aria-expanded": menuOpen,
        } = DropdownButtonProps;
        const defaultProps = {
          "data-jpmui-test": "dropdown-button",
          "aria-label": "toggle overflow",
          "aria-haspopup": true,
          classes: { icon: classes.overflowIcon },
          className: cx(classes.dropdown, {
            [classes.overflowMenuOpen]: menuOpen,
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
            <Icon accessibleText="overflow menu" name="more" />
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
