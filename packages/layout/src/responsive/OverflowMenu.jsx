import React, { forwardRef } from "react";
import cx from "classnames";
import { Button, Dropdown, Icon } from "@heswell/toolkit-1.0";

// import "./OverflowMenu.css";

// const OverflowMenu = forwardRef(function Overflow({ show, ...props }, ref) {
//   return (
//     <Button variant="secondary" ref={ref} {...props} tabIndex={0}>
//       <Icon accessibleText="overflow menu" name="more" />
//     </Button>
//   );
// });

const OverflowMenu = forwardRef(function OverflowMenu(
  { className, overflowOffsetLeft: left, source = [], ...rest },
  ref
) {
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
        console.log({ DropdownButtonProps, isOpen });

        const {
          // classes,
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
          // classes: { icon: classes.overflowIcon },
          // className: cx(classes.dropdown, {
          //   [classes.overflowMenuOpen]: menuOpen,
          // }),
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
  placeholder: "",
};

export default OverflowMenu;

/*
      {({ getToggleButtonProps }) => {
        const {
          onClick,
          onKeyDown,
          onFocus,
          onBlur,
          "aria-expanded": menuOpen,
        } = getToggleButtonProps();
        const defaultProps = {
          "data-jpmui-test": "dropdown-button",
          "aria-label": "toggle overflow",
          "aria-haspopup": true,
          classes: { icon: classes.overflowIcon },
          className: classnames(classes.dropdown, {
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

*/
