"use client";
import { motion, AnimatePresence } from "framer-motion";

interface RippleLoaderProps {
  isLoading: boolean;
}

export default function RippleLoader({ isLoading }: RippleLoaderProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm"
        >
          <motion.div
            className="relative w-24 h-24 rounded-full"
            style={{
              background: `
                radial-gradient(circle at 65% 35%,
                  hsl(180 80% 70% / 0.9),
                  hsl(192 80% 50% / 0.8) 30%,
                  hsl(210 80% 40% / 0.6) 60%,
                  transparent 80%
                ),
                linear-gradient(45deg,
                  hsl(172 100% 60% / 0.9),
                  hsl(183 100% 60% / 0.8),
                  hsl(195 100% 60% / 0.9)
                )`,
              boxShadow: "inset 0 0 20px rgba(164, 255, 247, 0.2)",
            }}
            animate={{
              rotate: 360,
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {/* Edge Gradient */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                mask: "linear-gradient(transparent, white 20%, white 80%, transparent)",
                background:
                  "linear-gradient(90deg, transparent, rgba(164, 255, 247, 0.4), transparent)",
              }}
            >
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                  rotate: -360,
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </div>

            {/* Particles */}
            <div className="absolute inset-0 rounded-full">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute h-1 w-1 bg-cyan-400/40 rounded-full"
                  style={{
                    left: `${Math.cos((i * 45 * Math.PI) / 180) * 30 + 50}%`,
                    top: `${Math.sin((i * 45 * Math.PI) / 180) * 30 + 50}%`,
                  }}
                  animate={{
                    scale: [0, 0.7, 0],
                    opacity: [0, 0.7, 0],
                  }}
                  transition={{
                    duration: 1.2 + Math.random(),
                    delay: Math.random(),
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
