// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";

describe("useDebouncedSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes with default empty values", () => {
    const { result } = renderHook(() => useDebouncedSearch());
    expect(result.current.inputValue).toBe("");
    expect(result.current.debouncedValue).toBe("");
  });

  it("initializes with provided initial value", () => {
    const { result } = renderHook(() => useDebouncedSearch("initial"));
    expect(result.current.inputValue).toBe("initial");
    expect(result.current.debouncedValue).toBe("initial");
  });

  it("updates inputValue immediately", () => {
    const { result } = renderHook(() => useDebouncedSearch());
    act(() => {
      result.current.setInputValue("test");
    });
    expect(result.current.inputValue).toBe("test");
    expect(result.current.debouncedValue).toBe("");
  });

  it("updates debouncedValue after delay", () => {
    const { result } = renderHook(() => useDebouncedSearch("", 300));
    act(() => {
      result.current.setInputValue("vaccine");
    });
    expect(result.current.debouncedValue).toBe("");

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.debouncedValue).toBe("vaccine");
  });

  it("resets debounce timer on rapid input", () => {
    const { result } = renderHook(() => useDebouncedSearch("", 300));

    act(() => {
      result.current.setInputValue("v");
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    act(() => {
      result.current.setInputValue("va");
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    act(() => {
      result.current.setInputValue("vac");
    });

    // Still within debounce window
    expect(result.current.debouncedValue).toBe("");

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.debouncedValue).toBe("vac");
  });

  it("uses custom delay", () => {
    const { result } = renderHook(() => useDebouncedSearch("", 500));
    act(() => {
      result.current.setInputValue("test");
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.debouncedValue).toBe("");
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.debouncedValue).toBe("test");
  });
});
