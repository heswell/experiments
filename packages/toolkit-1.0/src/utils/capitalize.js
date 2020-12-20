export default (value) =>
  typeof value === "string" && value.length > 0
    ? value[0].toUpperCase() + value.slice(1)
    : value;
