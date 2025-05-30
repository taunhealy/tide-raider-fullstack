"use client";
import { motion } from "framer-motion";

interface ShurikenLoaderProps {
  className?: string;
}

export function ShurikenLoader({ className }: ShurikenLoaderProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1, rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className={`relative w-20 h-20 border-none cursor-pointer ${className}`}
        style={{
          background: `hsl(180 80% 60% / 0.9)`,
          boxShadow: "inset 0 0 24px rgba(164, 255, 247, 0.3)",
          borderRadius: "50%",
        }}
      >
        {[...Array(4)].map((_, i) => (
          <motion.span
            key={i}
            className="absolute bg-cyan-200/80"
            style={{
              width: "40px",
              height: "40px",
              clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
              top: `${[-20, 20, 60, 20][i]}px`,
              left: `${[20, -20, 20, 60][i]}px`,
              filter: "drop-shadow(0 0 2px hsl(180 100% 70% / 0.5))",
            }}
            animate={{ rotate: [0, 180] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </motion.button>
    </div>
  );
}
