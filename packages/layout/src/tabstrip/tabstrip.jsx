import React, { useLayoutEffect, useRef } from 'react';
import classnames from 'classnames';
import useTabstrip from './useTabstrip';
import {AddButton} from "../action-buttons";
import { OverflowMenu, useOverflowObserver } from '../responsive';
import ActivationIndicator from './ActivationIndicator';

import './Tabstrip.css';

// const AddTabButton = ({ className, title, ...props }) => {
//   return (
//     <Button
//       className={classnames('tab-add', className)}
//       {...props}
//       variant="secondary"
//       tabIndex={0}
//     >
//       <Icon name="add" accessibleText={title} />
//     </Button>
//   );
// };

const Tabstrip = (props) => {
  const root = useRef(null);

  const {
    centered = false,
    children,
    className: classNameProp,
    defaultValue,
    enableAddTab,
    keyBoardActivation: _1,
    onAddTab,
    onDeleteTab: _2,
    // doesn't feel like a great prop name ...
    noBorder = false,
    orientation = 'horizontal',
    // don't like this prop name either ...
    overflowMenu = true,
    showActivationIndicator = true,
    style,
    title,
    value: valueProp,
    ...rootProps
  } = props;

  const childCount = useRef(React.Children.count(children));
  const classRoot = 'hwTabstrip';

  const [
    innerContainerRef,
    overflowedItems,
    ,
    resetOverflow,
  ] = useOverflowObserver(orientation, 'Tabstrip');

  const { activateTab, tabProps, tabRefs, value } = useTabstrip(props, root);
  const selectedIndex = useRef(value ?? 0);

  const handleOverflowChange = (e, tab) => {
    activateTab(e, tab.index);
  };

  const handleLabelEdited = (evt, index, label) => {
    // TODO need to redraw activation indicatr
    console.log(`Label Edited [${index}] = ${label}`);
  };

  const handleTabMouseDown = (e, index) => {
    if (rootProps.onMouseDown) {
      e.stopPropagation();
      rootProps.onMouseDown(e, index);
    }
  };

  // shouldn't we use ref for this ?
  useLayoutEffect(() => {
    // We don't care about changes to overflowedItems here, the overflowObserver
    // always does the right thing. We only care about changes to selected tab
    if (selectedIndex.current !== value && overflowMenu) {
      // We might want to do this only if the selected tab is overflowed ?
      resetOverflow();
      selectedIndex.current = value;
    }
  }, [overflowMenu, resetOverflow, value]);

  useLayoutEffect(() => {
    if (React.Children.count(children) !== childCount.current) {
      childCount.current = React.Children.count(children);
      resetOverflow();
    }
  }, [children, resetOverflow]);

  const renderContent = () => {
    const tabs = [];

    React.Children.toArray(children).forEach((child, index) => {
      const selected = index === value;
      const onLabelEdited = child.props.editable
        ? handleLabelEdited
        : undefined;
      const overflowed =
        overflowedItems.findIndex((item) => item.index === index) !== -1;
      tabs.push(
        React.cloneElement(child, {
          index,
          ...tabProps,
          'data-index': index,
          'data-priority': selected ? 1 : 3,
          'data-overflowed': overflowed ? true : undefined,
          onLabelEdited,
          onMouseDown: handleTabMouseDown,
          orientation,
          ref: tabRefs[index],
          selected,
        }),
      );
    });

    if (overflowMenu) {
      tabs.push(
        <OverflowMenu
          className={`${classRoot}-overflowMenu`}
          data-priority={0}
          data-index={tabs.length}
          data-overflow-indicator
          key="overflow"
          onChange={handleOverflowChange}
          source={overflowedItems}
        />,
      );
    }

    if (enableAddTab) {
      tabs.push(
        <AddButton
          data-priority={2}
          data-index={tabs.length}
          key="Tabstrip-addButton"
          onClick={onAddTab}
          title={title}
        />,
      );
    }

    return tabs;
  };

  console.log(`Tabstrip render`);

  const selectedTabOverflowed = overflowedItems.some(
    (item) => item.index === value,
  );
  const className = classnames(classRoot, `${classRoot}-${orientation}`, {
    [`${classRoot}-centered`]: centered,
  });
  return (
    <div
      {...rootProps}
      className={className}
      ref={root}
      role="tablist"
      style={style}
    >
      <div
        className={`${classRoot}-inner`}
        ref={innerContainerRef}
        style={{ lineHeight: '36px' }}
      >
        {renderContent()}
      </div>
      {showActivationIndicator ? (
        <ActivationIndicator
          hideThumb={selectedTabOverflowed}
          hideBackground={noBorder}
          orientation={orientation}
          tabRef={tabRefs[value ?? 0]}
        />
      ) : null}
    </div>
  );
};

Tabstrip.displayName = 'Tabstrip';

export default Tabstrip;
