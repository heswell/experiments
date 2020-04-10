export function getFullRange({lo,hi,bufferSize=0}){
  return {
      lo: Math.max(0, lo - bufferSize),
      hi: hi + bufferSize
  };
}
