export const findFirstOverflow = (elements, height) => {
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].offsetTop >= height) {
      return i;
    }
  }
  return -1;
};
