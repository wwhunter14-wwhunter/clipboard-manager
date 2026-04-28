import { useCallback, useRef } from "react";

export function useLongPress(callback, delay = 500) {
  const timer = useRef(null);
  const moved = useRef(false);
  const active = useRef(false);

  const start = useCallback(
    (event) => {
      moved.current = false;
      active.current = true;
      timer.current = setTimeout(() => {
        if (!moved.current && active.current) callback(event);
      }, delay);
    },
    [callback, delay],
  );

  const move = useCallback(() => {
    moved.current = true;
  }, []);

  const end = useCallback(() => {
    active.current = false;
    clearTimeout(timer.current);
  }, []);

  return {
    onTouchStart: start,
    onTouchMove: move,
    onTouchEnd: end,
    onTouchCancel: end,
    onMouseDown: start,
    onMouseMove: move,
    onMouseUp: end,
    onMouseLeave: end,
  };
}
