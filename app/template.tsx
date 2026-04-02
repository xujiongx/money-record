"use client";

import { motion } from "framer-motion";

/** 路由切换时避免位移 + 过长淡入，减轻与 RSC 水合叠加时的卡顿感 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.12 }}
    >
      {children}
    </motion.div>
  );
}
