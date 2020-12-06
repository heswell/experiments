import React from "react";
import { uuid } from "@heswell/utils";
import { expandFlex, typeOf } from "./utils";
import { ComponentRegistry, isContainer, isView } from "./registry/ComponentRegistry";

export const getManagedDimension = (style) =>
  style.flexDirection === "column" ? ["height", "width"] : ["width", "height"];

const theKidHasNoStyle = {};

export const applyLayoutProps = (component, dispatch) => {
  return getLayoutChild(component, dispatch, "0");
};

export const applyLayout = (type, props, dispatch) => {
  if (type === "DraggableLayout") {
    if (props.layout) {
      return layoutFromJson(props.layout, dispatch, "0");
    } else {
      return getLayoutChild(props.children, dispatch, "0", type);
    }
  } else {
    const layoutProps = getLayoutProps(type, props, dispatch, "0");
    const children = getLayoutChildren(type, props.children, dispatch, "0")
    return {
      ...props,
      ...layoutProps,
      children
    };
  }
};

function getLayoutProps(type, props, dispatch, path="0", parentType=null){

  const isNativeElement = type[0].match(/[a-z]/);
  const id = uuid();
  const key = id;
  const style = getStyle(type, props, parentType);

  return isNativeElement
    ? { id, key, style } 
    : { layoutId: id, key, dispatch, path, style };
}

function getLayoutChildren(type, children, dispatch, path = "0") {
  return isContainer(type) || isView(type)
    ? React.Children.map(children, (child, i) =>
      getLayoutChild(child, dispatch, `${path}.${i}`, type)
    )
    : children;
}

const getLayoutChild = (child, dispatch, path = "0", parentType = null) => {
  const { children } = child.props;
  const type = typeOf(child);
   return React.cloneElement(
    child, getLayoutProps(type, child.props, dispatch, path, parentType),
    getLayoutChildren(type, children, dispatch, path)
  );

};

const getStyle = (type, props, parentType) => {
  let { style = theKidHasNoStyle } = props;
  if (type === "Flexbox") {
    style = {
      flexDirection: props.column ? "column" : "row",
      ...style,
      display: "flex"
    };
  }

  if (style.flex) {
    const { flex, ...otherStyles } = style;
    style = {
      ...otherStyles,
      ...expandFlex(flex)
    };
  } else if (parentType === "Stack") {
    style = {
      ...style,
      ...expandFlex(1)
    };
  }

  return style;
};

function layoutFromJson({ type, children, props }, dispatch, path) {
  if (type === "DraggableLayout") {
    return layoutFromJson(children[0], dispatch, "0");
  }

  const componentType = type.match(/^[a-z]/) ? type : ComponentRegistry[type];

  if (componentType === undefined) {
    throw Error(`Unable to create component from JSON, unknown type ${type}`);
  }
  const id = uuid();
  return React.createElement(
    componentType,
    {
      ...props,
      dispatch,
      id,
      key: id,
      path
    },
    children
      ? children.map((child, i) =>
          layoutFromJson(child, dispatch, `${path}.${i}`)
        )
      : undefined
  );
}

export function layoutToJSON(type, props, component) {
  const start = performance.now();
  const result = componentToJson(component);
  const end = performance.now();
  console.log(`toJSON took ${end - start}ms`);

  if (type === "DraggableLayout") {
    return {
      type,
      children: [result]
    };
  }

  return result;
}

function componentToJson(component) {
  const {
    type,
    props: { children, ...props }
  } = component;
  return {
    type: serializeType(type),
    props: serializeProps(props),
    children: React.Children.map(children, componentToJson)
  };
}

function serializeType(elementType) {
  if (typeof elementType === "function" || typeof elementType === "object") {
    return (
      elementType.displayName || elementType.name || elementType?.type.name
    );
  } else if (typeof elementType === "string") {
    return elementType;
  }
}

function serializeProps(props) {
  if (props) {
    // Question, will there ever be a requirement to preserve id value ?
    const { id, path, ...otherProps } = props;
    const result = {};
    for (let [key, value] of Object.entries(otherProps)) {
      if (typeof value === "object") {
        result[key] = serializeProps(value);
      } else if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        result[key] = value;
      }
    }
    return result;
  }
}
