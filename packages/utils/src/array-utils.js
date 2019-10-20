export function partition(array, test, pass = [], fail = []) {

  for (let i = 0, len = array.length; i < len; i++) {
      (test(array[i], i) ? pass : fail).push(array[i]);
  }

  return [pass, fail];
}
