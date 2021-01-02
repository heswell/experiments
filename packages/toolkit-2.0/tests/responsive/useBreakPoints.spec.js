import { renderHook, act } from "@testing-library/react-hooks";
import { Element } from "./__mocks__/ResizeObserver";
import useBreakPoints from "../../src/responsive/useBreakPoints";

document.fonts = { ready: true };

let target1, target2;

beforeEach(() => {
  target1 = new Element(100, 50);
  target2 = new Element(200, 100);
});

describe("useBreakPoints", () => {
  it("does nothing if no breakpoints specified", () => {
    const onResize = jest.fn();

    const { result } = renderHook(() => {
      const ref = { current: target1 };
      return useBreakPoints(ref, { onResize });
    });
    expect(result.current).toEqual([undefined, "lg"]);
    expect(onResize).toHaveBeenCalledTimes(0);
  });

  it("returns a minSize based on breakpoints specified", () => {
    const onResize1 = jest.fn();
    const onResize2 = jest.fn();

    const { result: result1 } = renderHook(() => {
      const ref = { current: target1 };
      return useBreakPoints(ref, {
        breakPoints: {
          xs: 0,
          sm: 600,
          lg: 1000,
        },
        onResize: onResize1,
      });
    });
    expect(result1.current).toEqual([0, "lg"]);
    expect(onResize1).toHaveBeenCalledTimes(1);
    expect(onResize1).toHaveBeenCalledWith("xs");

    const { result: result2 } = renderHook(() => {
      const ref = { current: target2 };
      return useBreakPoints(ref, {
        breakPoints: {
          xs: 60,
          sm: 600,
          lg: 1000,
        },
        onResize: onResize2,
      });
    });
    expect(result2.current).toEqual([60, "lg"]);
    expect(onResize2).toHaveBeenCalledTimes(1);
    expect(onResize1).toHaveBeenCalledWith("xs");
  });

  it("ignores size changes that do not cross breakpoint thresholds", async () => {
    const ref = { current: target1 };
    const breakPoints = {
      sm: 28,
      md: 600,
      lg: 1000,
    };
    const onResize = jest.fn();

    const { rerender, result } = renderHook(
      ({ _ref, _breakPoints, _onResize }) =>
        useBreakPoints(_ref, {
          breakPoints: _breakPoints,
          onResize: _onResize,
        }),
      {
        initialProps: {
          _ref: ref,
          _breakPoints: breakPoints,
          _onResize: onResize,
        },
      }
    );

    expect(result.current).toEqual([28, "lg" /* the default */]);
    expect(onResize).toHaveBeenCalledTimes(1);
    expect(onResize).toHaveBeenCalledWith("sm");

    await document.fonts.ready;

    target1.setSize(150, 50);
    target1.setSize(160, 50);
    target1.setSize(599, 50);
    expect(onResize).toHaveBeenCalledTimes(1);
  });

  it("invokes callback each time breakPoint threshold is crossed", async () => {
    const ref = { current: target1 };
    const breakPoints = {
      sm: 28,
      md: 600,
      lg: 1000,
    };
    const onResize = jest.fn();

    const { result } = renderHook(
      ({ _ref, _breakPoints, _onResize }) =>
        useBreakPoints(_ref, {
          breakPoints: _breakPoints,
          onResize: _onResize,
        }),
      {
        initialProps: {
          _ref: ref,
          _breakPoints: breakPoints,
          _onResize: onResize,
        },
      }
    );

    expect(onResize).toHaveBeenCalledTimes(1);

    await document.fonts.ready;

    target1.setSize(600, 50);
    expect(onResize).toHaveBeenCalledTimes(2);
    expect(onResize).toHaveBeenCalledWith("md");

    target1.setSize(1200, 50);
    expect(onResize).toHaveBeenCalledTimes(3);
    expect(onResize).toHaveBeenCalledWith("lg");

    target1.setSize(100, 50);
    expect(onResize).toHaveBeenCalledTimes(4);
    expect(onResize).toHaveBeenCalledWith("sm");

    target1.setSize(200, 50);
    expect(onResize).toHaveBeenCalledTimes(4);
  });
});
