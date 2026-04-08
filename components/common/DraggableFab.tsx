"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Draggable, {
  type DraggableData,
  type DraggableEvent,
} from "react-draggable";

export type DraggableFabProps = {
  /** localStorage 中保存的 `{ x, y }` 键名 */
  storageKey: string;
  /** 未发生明显拖动时的点击（短按） */
  onPress?: () => void;
  children: ReactNode;
  /** 按钮外观类（与 anchor 叠加） */
  className?: string;
  /** 相对 max-w-md 容器的绝对定位锚点类 */
  anchorClassName?: string;
  /** 最外层 fixed 容器的 z-index 类 */
  zIndexClassName?: string;
  /** 松手时位移小于该值视为点击（像素） */
  tapThresholdPx?: number;
} & Omit<
  React.ComponentProps<"button">,
  "children" | "style" | "type" | "className" | "ref"
>;

/**
 * 基于 [react-draggable](https://github.com/react-grid-layout/react-draggable)：
 * 在居中 max-w-md 栏内可拖动，`bounds="parent"` 限制不拖出父容器；偏移持久化到 localStorage。
 */
export function DraggableFab({
  storageKey,
  onPress,
  children,
  className = "",
  anchorClassName = "bottom-28 right-4",
  zIndexClassName = "z-[45]",
  tapThresholdPx = 8,
  ...buttonProps
}: DraggableFabProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLButtonElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  function persistPosition(x: number, y: number) {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ x, y }));
    } catch {
      /* ignore */
    }
  }

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const p = JSON.parse(raw) as { x?: number; y?: number };
        if (typeof p.x === "number" && typeof p.y === "number") {
          setPosition({ x: p.x, y: p.y });
        }
      }
    } catch {
      /* ignore */
    }
  }, [storageKey]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const onDragStart = (_e: DraggableEvent, data: DraggableData) => {
    dragStartRef.current = { x: data.x, y: data.y };
  };

  const onDrag = (_e: DraggableEvent, data: DraggableData) => {
    setPosition({ x: data.x, y: data.y });
  };

  const onDragStop = (_e: DraggableEvent, data: DraggableData) => {
    const { x, y } = data;
    setPosition({ x, y });
    persistPosition(x, y);
    const moved = Math.hypot(
      x - dragStartRef.current.x,
      y - dragStartRef.current.y,
    );
    if (moved < tapThresholdPx) {
      onPress?.();
    }
  };

  return (
    <div
      className={`pointer-events-none fixed inset-0 flex justify-center ${zIndexClassName}`}
    >
      <div className="relative h-full w-full max-w-md pointer-events-none">
        <Draggable
          nodeRef={nodeRef}
          bounds="parent"
          position={position}
          onStart={onDragStart}
          onDrag={onDrag}
          onStop={onDragStop}
          enableUserSelectHack={false}
        >
          <button
            {...buttonProps}
            ref={nodeRef}
            type="button"
            className={`pointer-events-auto absolute flex touch-none cursor-grab select-none items-center justify-center transition-shadow active:scale-[0.96] active:cursor-grabbing ${anchorClassName} ${className}`}
          >
            {children}
          </button>
        </Draggable>
      </div>
    </div>
  );
}
