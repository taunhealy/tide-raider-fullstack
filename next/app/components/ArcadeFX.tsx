"use client";

import { useEffect, useState } from "react";

export default function ArcadeFX() {
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setScore((prev) => prev + 100);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Scanlines Effect */}
      <div className="absolute inset-0 bg-scanlines opacity-10"></div>

      {/* CRT Screen Edge Effect */}
      <div className="absolute inset-0 rounded-lg shadow-inner border border-black/20"></div>

      {/* Top HUD */}
      <div className="absolute top-6 right-6 flex items-center space-x-8">
        {/* Lives */}
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            {[...Array(lives)].map((_, i) => (
              <div
                key={i}
                className="w-6 h-6 text-[var(--color-tertiary)] animate-pulse"
                style={{ filter: "drop-shadow(0 0 2px var(--color-tertiary))" }}
              >
                ❤︎
              </div>
            ))}
          </div>
        </div>

        {/* Score */}
      </div>

      {/* Screen Flicker Animation */}
      <div className="absolute inset-0 bg-white opacity-0 mix-blend-overlay animate-screen-flicker"></div>

      <style jsx>{`
        .bg-scanlines {
          background: linear-gradient(
            to bottom,
            transparent 30%,
            rgba(0, 0, 0, 0.05) 50%
          );
          background-size: 100% 2px;
        }

        @keyframes screen-flicker {
          0% {
            opacity: 0;
          }
          5% {
            opacity: 0.02;
          }
          10% {
            opacity: 0;
          }
          15% {
            opacity: 0.04;
          }
          20% {
            opacity: 0;
          }
          100% {
            opacity: 0;
          }
        }

        .animate-screen-flicker {
          animation: screen-flicker 8s infinite;
        }
      `}</style>
    </div>
  );
}
