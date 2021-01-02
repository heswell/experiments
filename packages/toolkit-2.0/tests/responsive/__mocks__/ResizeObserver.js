export function Element(width, height) {
  this.width = width;
  this.height = height;
  let resizeCallback = null;
  this.getBoundingClientRect = () => ({
    width: this.width,
    height: this.height,
  });
  this.setSize = (width, height) => {
    this.width = width;
    this.height = height;
    // fire event even when width/height have not changed
    resizeCallback && resizeCallback({ height, width });
  };
  this.setResizeCallback = (callback) => (resizeCallback = callback);
}

class MockResizeObserver {
  constructor(resizeObserverCallback) {
    MockResizeObserver.count += 1;
    this.observe = (target) => {
      target.setResizeCallback((contentRect) =>
        resizeObserverCallback([{ target, contentRect }])
      );
    };
    this.unobserve = (target) => {
      target.setResizeCallback(null);
    };
  }
}
MockResizeObserver.count = 0;

window.ResizeObserver = MockResizeObserver;
