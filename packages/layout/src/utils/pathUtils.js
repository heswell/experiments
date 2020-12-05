import React from "react";

// TODO isn't this equivalent to containerOf ?
export function followPathToParent(layout, path) {
  if (path === "0") return null;
  if (path === layout.props.path) return null;

  return followPath(layout, path.replace(/.\d+$/, ""));
}

export function containerOf(layout, target) {
  if (target === layout) {
    return null;
  } else {
    let { idx, finalStep } = nextStep(layout.props.path, target.props.path);
    if (finalStep) {
      return layout;
    } else if (
      layout.props.children === undefined ||
      layout.props.children[idx] === undefined
    ) {
      return null;
    } else {
      return containerOf(layout.props.children[idx], target);
    }
  }
}

export function followPath(source, path) {
  let isElement = React.isValidElement(source);
  const sourcePath = isElement ? source.props.path : source.path;

  if (path.indexOf(sourcePath) !== 0) {
    throw Error(
      `pathUtils.followPath path ${path} is not within model.path ${sourcePath}`
    );
  }

  var route = path.slice(sourcePath.length + 1);
  if (route === "") {
    return source;
  }
  var paths = route.split(".");

  for (var i = 0; i < paths.length; i++) {
    if (
      (isElement && React.Children.count(source.props.children) === 0) ||
      (!isElement && source.children === undefined)
    ) {
      console.log(
        `model at 0.${paths
          .slice(0, i)
          .join(
            "."
          )} has no children, so cannot fulfill rest of path ${paths
          .slice(i)
          .join(".")}`
      );
      return;
    }

    source = isElement
      ? source.props.children[paths[i]]
      : source.children[paths[i]];
    isElement = React.isValidElement(source);

    if (source === undefined) {
      console.log(
        `model at 0.${paths
          .slice(0, i)
          .join(
            "."
          )} has no children that fulfill next step of path ${paths
          .slice(i)
          .join(".")}`
      );
      return;
    }
  }
  return source;
}

export function nextStep(pathSoFar, targetPath) {
  if (pathSoFar === targetPath) {
    return { idx: -1, finalStep: true };
  }
  var regex = new RegExp(`^${pathSoFar}.`);
  // check that pathSoFar startsWith targetPath and if not, throw
  var paths = targetPath
    .replace(regex, "")
    .split(".")
    .map((n) => parseInt(n, 10));
  return { idx: paths[0], finalStep: paths.length === 1 };
}

export function resetPath(model, path) {
  if (model.props.path === path) {
    return model;
  }
  const children = [];
  // React.Children.map rewrites keys, forEach does not
  React.Children.forEach(model.props.children, (child, i) => {
    if (!child.props.path) {
      children.push(child);
    } else {
      children.push(resetPath(child, `${path}.${i}`));
    }
  });
  return React.cloneElement(model, { path }, children);
}
