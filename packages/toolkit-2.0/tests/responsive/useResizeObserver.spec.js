import { renderHook, act } from "@testing-library/react-hooks";
import { Element } from "./__mocks__/ResizeObserver";
import useResizeObserver from "../../src/responsive/useResizeObserver";

document.fonts = { ready: true };

let target1, target2;

beforeEach(() => {
  target1 = new Element(100, 50);
  target2 = new Element(200, 100);
});

describe("useResizeObserver", () => {
  it("Only ever creates a single Resize Observer", () => {
    renderHook(() => {
      const ref = { current: target1 };
      return useResizeObserver(ref, ["height"]);
    });
    renderHook(() => {
      const ref = { current: target2 };
      return useResizeObserver(ref, ["height"]);
    });
    expect(ResizeObserver.count).toEqual(1);
  });

  it.skip("throws if we attempty to observe the same element more than once", () => {
    const test = () => {
      const ref = { current: target1 };
      return useResizeObserver(ref, ["height"]);
    };

    renderHook(test);

    try {
      const { result } = renderHook(test);
    } catch (e) {
      expect(e.message).toBe(
        "useResizeObserver attemping to observe same element twice"
      );
    }
  });

  it("reports only changes to subscribed dimensions", async () => {
    const onResize = jest.fn();
    renderHook(() => {
      const ref = { current: target1 };
      return useResizeObserver(ref, ["height"], onResize);
    });

    await document.fonts.ready;

    target1.setSize(100, 55); // height changed
    target1.setSize(100, 55); // no change
    target1.setSize(100, 60); // height changed
    target1.setSize(120, 60); // no change
    expect(onResize).toHaveBeenCalledTimes(2);
  });

  it("multiple targets can be observed for different dimensions", async () => {
    const onResize1 = jest.fn();
    const onResize2 = jest.fn();

    renderHook(() => {
      const ref = { current: target1 };
      return useResizeObserver(ref, ["height"], onResize1);
    });

    renderHook(() => {
      const ref = { current: target2 };
      return useResizeObserver(ref, ["width"], onResize2);
    });

    await document.fonts.ready;

    target1.setSize(100, 55); // height changed
    target2.setSize(200, 150); // no width change
    target1.setSize(100, 60); // height changed
    target1.setSize(120, 60); // no change
    target2.setSize(200, 500); // no width change
    target2.setSize(220, 500); // width change

    expect(onResize1).toHaveBeenCalledTimes(2);
    expect(onResize2).toHaveBeenCalledTimes(1);
  });

  it("multiple dimensions can be subscribed for a single target", async () => {
    const onResize = jest.fn();
    renderHook(() => {
      const ref = { current: target1 };
      return useResizeObserver(ref, ["height", "width"], onResize);
    });

    await document.fonts.ready;

    target1.setSize(100, 55); // height changed
    target1.setSize(101, 55); // width change
    target1.setSize(100, 60); // height changed
    target1.setSize(120, 62); //  both change
    expect(onResize).toHaveBeenCalledTimes(4);
  });

  it("unhooks observer when new ref is passed", async () => {
    const onResize = jest.fn();
    const ref1 = { current: target1 };
    const ref2 = { current: target2 };
    const dimensions = ["height"];

    const { rerender } = renderHook(
      ({ _ref, _dimensions, _onResize }) =>
        useResizeObserver(_ref, _dimensions, _onResize),
      {
        initialProps: {
          _ref: ref1,
          _dimensions: dimensions,
          _onResize: onResize,
        },
      }
    );

    await document.fonts.ready;

    target1.setSize(100, 55); // height changed
    expect(onResize).toHaveBeenCalledTimes(1);

    rerender({
      _ref: ref2,
      _dimensions: dimensions,
      _onResize: onResize,
    });
    expect(onResize).toHaveBeenCalledTimes(1);

    await document.fonts.ready;

    target2.setSize(100, 55); // height changed
    expect(onResize).toHaveBeenCalledTimes(2);

    // This won't callback vecause we're no longer observing it
    target1.setSize(99, 99); // height changed, but no longer observed
    expect(onResize).toHaveBeenCalledTimes(2);
  });

  it("allows tracked dimensions to be changed on the fly", async () => {
    const onResize = jest.fn();
    const ref = { current: target1 };
    const dimensions = ["height"];

    const { rerender } = renderHook(
      ({ _ref, _dimensions, _onResize }) =>
        useResizeObserver(_ref, _dimensions, _onResize),
      {
        initialProps: {
          _ref: ref,
          _dimensions: dimensions,
          _onResize: onResize,
        },
      }
    );

    await document.fonts.ready;

    target1.setSize(120, 50);
    expect(onResize).toHaveBeenCalledTimes(0);

    rerender({
      _ref: ref,
      _dimensions: ["height", "width"],
      _onResize: onResize,
    });

    // this will trigger resize even though width/height have not changed
    // In real world, left or top may have changed
    target1.setSize(120, 50);
    expect(onResize).toHaveBeenCalledTimes(0);

    target1.setSize(130, 60);
    expect(onResize).toHaveBeenCalledTimes(1);

    rerender({
      _ref: ref,
      _dimensions: ["height"],
      _onResize: onResize,
    });

    target1.setSize(150, 60);
    expect(onResize).toHaveBeenCalledTimes(1);
  });
});
