'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** 与下方 Tailwind w-[var(--swipe-actions)] 保持一致 */
const ACTION_WIDTH = 120;

type SwipeTransactionRowProps = {
  rowId: string;
  openSwipeId: string | null;
  setOpenSwipeId: (id: string | null) => void;
  onEdit: () => void;
  onDelete: () => void;
  children: React.ReactNode;
};

export function SwipeTransactionRow({
  rowId,
  openSwipeId,
  setOpenSwipeId,
  onEdit,
  onDelete,
  children,
}: SwipeTransactionRowProps) {
  const [tx, setTx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const txRef = useRef(0);
  const startRef = useRef({ x: 0, tx: 0 });
  const activeRef = useRef(false);

  useEffect(() => {
    txRef.current = tx;
  }, [tx]);

  useEffect(() => {
    if (openSwipeId !== rowId) {
      setTx(0);
      txRef.current = 0;
    }
  }, [openSwipeId, rowId]);

  const closeRow = useCallback(() => {
    setTx(0);
    txRef.current = 0;
    setOpenSwipeId(null);
  }, [setOpenSwipeId]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    activeRef.current = true;
    setDragging(true);
    if (openSwipeId != null && openSwipeId !== rowId) {
      setOpenSwipeId(null);
    }
    startRef.current = { x: e.clientX, tx: txRef.current };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeRef.current) return;
    const dx = e.clientX - startRef.current.x;
    let next = startRef.current.tx + dx;
    next = Math.max(-ACTION_WIDTH, Math.min(0, next));
    setTx(next);
    txRef.current = next;
  };

  const endPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeRef.current) return;
    const el = e.currentTarget;
    try {
      el.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    activeRef.current = false;
    setDragging(false);

    const mid = -ACTION_WIDTH / 2;
    if (txRef.current <= mid) {
      setTx(-ACTION_WIDTH);
      txRef.current = -ACTION_WIDTH;
      setOpenSwipeId(rowId);
    } else {
      setTx(0);
      txRef.current = 0;
      setOpenSwipeId(null);
    }
  };

  return (
    <div className='relative isolate w-full max-w-full overflow-hidden'>
      {/* 底层操作区：纯色 + 白字；仅左滑后露出，避免与金额叠在同一视觉层 */}
      <div
        className='absolute inset-y-0 right-0 z-0 flex'
        style={{ width: ACTION_WIDTH }}
        aria-hidden
      >
        <button
          type='button'
          className='flex flex-1 items-center justify-center bg-orange-500 text-xs font-semibold text-white transition active:bg-orange-600'
          onClick={() => {
            closeRow();
            onEdit();
          }}
        >
          编辑
        </button>
        <button
          type='button'
          className='flex flex-1 items-center justify-center border-l border-white/25 bg-rose-600 text-xs font-semibold text-white transition active:bg-rose-700'
          onClick={() => {
            closeRow();
            onDelete();
          }}
        >
          删除
        </button>
      </div>

      {/* 前景必须不透明且铺满行宽，否则会与金额、底层按钮叠色 */}
      <div
        className={`relative z-10 w-full min-w-0 select-none bg-white shadow-[4px_0_12px_-8px_rgba(0,0,0,0.12)] touch-pan-y ${
          dragging ? '' : 'transition-[transform] duration-200 ease-out'
        }`}
        style={{ transform: `translate3d(${tx}px,0,0)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
      >
        {children}
      </div>
    </div>
  );
}
