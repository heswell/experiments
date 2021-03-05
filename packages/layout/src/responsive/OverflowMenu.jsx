import React, { forwardRef } from 'react';
import {MoreSmallListVertButton} from "../action-buttons";

import './OverflowMenu.css';

const OverflowMenu = forwardRef(function OverflowMenu(
  { iconName = 'more', overflowOffsetLeft: left, source = [], ...rest },
  ref,
) {
  return source.length > 0 ? (
    <MoreSmallListVertButton />
    // <Dropdown
    //   ListProps={{
    //     width: 200,
    //   }}
    //   ref={ref}
    //   source={source}
    //   {...rest}
    // >
    //   {({ DropdownButtonProps, isOpen }) => {
    //     const { style, ...restButtonProps } = DropdownButtonProps;

    //     const {
    //       onClick,
    //       onKeyDown,
    //       onFocus,
    //       onBlur,
    //       'aria-expanded': menuOpen, // do we use this or isOpen ?
    //     } = DropdownButtonProps;
    //     const defaultProps = {
    //       'data-jpmui-test': 'dropdown-button',
    //       'aria-label': 'toggle overflow',
    //       'aria-haspopup': true,
    //       className: cx('OverflowMenu-dropdown', {
    //         'OverflowMenu-open': isOpen,
    //       }),
    //       onBlur,
    //       onPress: onClick,
    //       onFocus,
    //       onKeyDown,
    //       title: 'Overflow Menu',
    //       type: 'button',
    //       variant: 'secondary',
    //     };

    //     return (
    //       <MoreSmallListVertButton {...defaultProps}/>
    //     );
    //   }}
    // </Dropdown>
  ) : null;
});

export default OverflowMenu;
