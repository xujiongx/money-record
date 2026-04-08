"use client";

import { motion } from "framer-motion";

/** 思考中：三颗跳动圆点 */
export function ChatTypingDots() {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-2"
      role="status"
      aria-label="正在回复"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 shadow-sm"
          animate={{ y: [0, -5, 0], opacity: [0.45, 1, 0.45] }}
          transition={{
            duration: 0.75,
            repeat: Infinity,
            delay: i * 0.14,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
