export function mergeStyles(s1, s2) {
  const result = { ...s1 };
  if (s2) {
    Object.entries(s2).forEach(([key, value]) => {
      if (!result[key]) {
        result[key] = value;
      } else {
        result[key] = `${result[key]} ${s2[key]}`;
      }
    });
  }
  return result;
}
