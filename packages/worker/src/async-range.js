export default function createRange(from, to, pauseDuration=5, pauseFrequency=30){
  return {
    from,
    to,
    [Symbol.asyncIterator]() {
      return {
        current: this.from,
        last: this.to,
        async next() {
          if (this.current <= this.last) {
            if (this.current % pauseFrequency === 0){
              await new Promise(resolve => setTimeout(resolve, pauseDuration));
            }
            return { done: false, value: this.current++ };
          } else {
            return { done: true };
          }
        }
      };
    }
  };
}
