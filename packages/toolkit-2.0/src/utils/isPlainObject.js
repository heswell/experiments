export const isPlainObject = (obj) =>
  Object.prototype.toString.call(obj) === "[object Object]";
