import { useRef, useState } from "react";
import { useLongPress } from "../hooks/useLongPress";

export function Pressable({ children, style, onTap, onLongPress }) {
  const [pressed, setPressed] = useState(false);
  const longPressed = useRef(false);
  const longPressProps = useLongPress(() => {
    longPressed.current = true;
    setPressed(false);
    onLongPress?.();
  });

  return (
    <div
      {...longPressProps}
      onClick={() => {
        if (longPressed.current) {
          longPressed.current = false;
          return;
        }
        onTap?.();
      }}
      onContextMenu={(event) => event.preventDefault()}
      style={{
        ...style,
        transform: pressed ? "scale(.97)" : "scale(1)",
        transition: "transform .12s,background .15s",
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      {children}
    </div>
  );
}
