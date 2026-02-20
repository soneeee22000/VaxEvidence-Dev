"use client";

import { useState, useEffect, useRef } from "react";

const DEFAULT_DEBOUNCE_MS = 300;

/**
 * Hook that debounces a search input value.
 * Returns the current input value (for controlled input) and the debounced value (for queries).
 */
export function useDebouncedSearch(
  initialValue = "",
  delayMs = DEFAULT_DEBOUNCE_MS,
) {
  const [inputValue, setInputValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, delayMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [inputValue, delayMs]);

  return { inputValue, debouncedValue, setInputValue };
}
