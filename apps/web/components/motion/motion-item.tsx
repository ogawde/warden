"use client";

import { motion } from "motion/react";

type MotionItemProps = {
  children: React.ReactNode;
  index?: number;
  className?: string;
};

export function MotionItem({
  children,
  index = 0,
  className
}: MotionItemProps) {
  return (
    <motion.li
      className={className}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: index * 0.07,
        ease: [0.22, 1, 0.36, 1]
      }}
    >
      {children}
    </motion.li>
  );
}
