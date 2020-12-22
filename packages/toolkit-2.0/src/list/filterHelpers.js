import { escapeRegExp } from "../utils/escapeRegExp";

export const getDefaultFilterRegex = (value) =>
  new RegExp(`(${escapeRegExp(value)})`, "gi");

export const getDefaultFilter = (
  inputValue = "",
  getFilterRegex = getDefaultFilterRegex
) => (itemValue = "") =>
  Boolean(itemValue.length) &&
  Boolean(inputValue.length) &&
  itemValue.trim().match(getFilterRegex(inputValue.trim())) !== null;
