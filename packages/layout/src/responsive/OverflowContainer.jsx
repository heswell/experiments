import React, { useRef } from 'react';
import cx from 'classnames';

import { OverflowMenu, useOverflowObserver } from '../responsive';

import './OverflowContainer.css';

const RESPONSIVE_ATTRIBUTE = {
  'data-collapsible': true,
  'data-pad-left': true,
  'data-pad-right': true,
};

const isResponsiveAttribute = (propName) => RESPONSIVE_ATTRIBUTE[propName];

const extractResponsiveProps = (props) => {
  return Object.keys(props).reduce(
    (result, propName) => {
      const [toolbarProps, rest] = result;
      if (isResponsiveAttribute(propName)) {
        toolbarProps[propName] = props[propName];
        rest[propName] = undefined;
      }
      return result;
    },
    [{}, {}],
  );
};

const renderTools = (items, collapsedItems = []) => {
  const tools = [];
  let index = tools.length - 1;
  let rightAlign = false;
  return tools.concat(
    items.map((tool) => {
      index += 1;
      // index is a fragile way to link these, we need some kind of id and map
      const collapsed =
        collapsedItems.findIndex((item) => item.index === index) === -1
          ? undefined
          : true;
      let dataPadLeft = undefined;
      if (React.isValidElement(tool)) {
        if (tool.props.align === 'right' && !rightAlign) {
          rightAlign = true;
          dataPadLeft = true;
        }

        const toolbarItemProps = {
          className: cx('Toolbar-item', tool.props.className),
          'data-index': index,
          'data-priority': tool.props['data-priority'] ?? 2,
          'data-pad-left': dataPadLeft,
          'data-collapsed': collapsed,
        };

        if (tool.type === Tooltray || tool.type === Tabstrip) {
          return React.cloneElement(tool, {
            ...toolbarItemProps,
            // collapsed,
          });
        } else if (tool.type === ToolbarField) {
          return React.cloneElement(tool, toolbarItemProps);
        } else {
          const [toolbarProps, props] = Object.keys(tool.props).some(
            isResponsiveAttribute,
          )
            ? extractResponsiveProps(tool.props)
            : [{}, tool.props];

          return (
            <ToolbarField {...toolbarProps} {...toolbarItemProps} key={index}>
              {props === tool.props ? tool : React.cloneElement(tool, props)}
            </ToolbarField>
          );
        }
      }
    }),
  );
};

const Toolbar = ({
  children,
  className,
  density: densityProp,
  id,
  maxRows: _1,
  orientation = 'horizontal',
  style,
  title,
  tools: toolsProp,
  stops,
  getTools = () => toolsProp || React.Children.toArray(children),
  ...rootProps
}) => {
  const root = useRef(null);
  const overflowButton = useRef(null);
  //TODO path is purely a layout concern

  const [
    innerContainerRef,
    overflowedItems,
    collapsedItems,
  ] = useOverflowObserver(orientation, 'Toolbar');

  const handleOverflowChange = (e, tab) => {
    console.log(`handleOverflowChange`, tab);
  };

  const tools = getTools();

  return (
    <div
      {...rootProps}
      id={id}
      // breakPoints={stops}
      className={cx(
        'ResponsiveContainer',
        `ResponsiveContainer-${orientation}`,
        className,
      )}
      ref={root}
      // onResize={setSize}
      style={style}
    >
      <div className="Responsive-inner" ref={innerContainerRef}>
        {renderTools(tools, collapsedItems)}
        <OverflowMenu
          className="ResponsiveContainer-overflowMenu"
          data-pad-left
          data-priority={1}
          data-index={tools.length - 1}
          key="overflow"
          onChange={handleOverflowChange}
          ref={overflowButton}
          source={overflowedItems}
        />
      </div>
    </div>
  );
};

export default Toolbar;

// registerComponent('Toolbar', Toolbar);
