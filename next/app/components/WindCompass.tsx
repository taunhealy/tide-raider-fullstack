import React, { useState } from "react";
import { degreesToCardinal } from "@/app/lib/surfUtils";

interface WindCompassProps {
  windDirection: string;
  windSpeed: number;
  swellDirection: number;
  swellHeight: number;
}

// Helper function to get opposite direction
function getOppositeDirection(direction: string): string {
  const opposites: { [key: string]: string } = {
    N: "S",
    S: "N",
    E: "W",
    W: "E",
    NE: "SW",
    SE: "NW",
    SW: "NE",
    NW: "SE",
    NNE: "SSW",
    ENE: "WSW",
    ESE: "WNW",
    SSE: "NNW",
    SSW: "NNE",
    WSW: "ENE",
    WNW: "ESE",
    NNW: "SSE",
  };
  return opposites[direction] || direction;
}

export default function WindCompass({
  windDirection,
  windSpeed,
  swellDirection,
  swellHeight,
}: WindCompassProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="absolute top-4 right-4 bg-white p-6 rounded-xl shadow-lg"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="relative w-40 h-40 mb-4">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Compass circle background */}
          <circle
            cx="50"
            cy="50"
            r="48"
            fill="white"
            stroke="#e2e8f0"
            strokeWidth="2"
          />

          {/* Compass degree marks */}
          {[...Array(72)].map((_, i) => {
            const rotation = i * 5;
            const isCardinal = i % 18 === 0;
            return (
              <line
                key={i}
                x1="50"
                y1="5"
                x2="50"
                y2={isCardinal ? "10" : "8"}
                stroke="#94a3b8"
                strokeWidth={isCardinal ? "2" : "1"}
                transform={`rotate(${rotation} 50 50)`}
              />
            );
          })}

          {/* Cardinal directions */}
          <text
            x="50"
            y="20"
            textAnchor="middle"
            fontSize="12"
            fontWeight="bold"
            fill="#475569"
          >
            N
          </text>
          <text
            x="80"
            y="52"
            textAnchor="middle"
            fontSize="12"
            fontWeight="bold"
            fill="#475569"
          >
            E
          </text>
          <text
            x="50"
            y="84"
            textAnchor="middle"
            fontSize="12"
            fontWeight="bold"
            fill="#475569"
          >
            S
          </text>
          <text
            x="20"
            y="52"
            textAnchor="middle"
            fontSize="12"
            fontWeight="bold"
            fill="#475569"
          >
            W
          </text>

          {/* Wind direction arrow */}
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="15"
            stroke="#3b82f6"
            strokeWidth="4"
            strokeLinecap="round"
            transform={`rotate(${windDirection} 50 50)`}
          />

          {/* Arrowhead pointing in wind direction */}
          <path
            d="M50 15 L54 25 L46 25 Z"
            fill="#3b82f6"
            transform={`rotate(${windDirection} 50 50)`}
          />

          {/* Swell arrow - rotated 180° and positioned on opposite side */}
          <g transform={`rotate(${Number(swellDirection) + 180} 50 50)`}>
            <path
              d="M50 60 L46 80 L50 76 L54 80 L50 60"
              fill="#22c55e"
              stroke="#22c55e"
            />
          </g>
        </svg>
        {showTooltip && (
          <div className="absolute -bottom-16 right-0 bg-black bg-opacity-75 text-white text-sm p-3 rounded-lg whitespace-nowrap z-50">
            <p>
              Wind is {windSpeed}kts from the {windDirection} (blowing toward{" "}
              {getOppositeDirection(windDirection)})
            </p>
            <p>
              Swell is coming from the {degreesToCardinal(swellDirection)} (
              {swellDirection}°)
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2 text-sm font-medium text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
          <span>
            Wind: {windSpeed} kts @ {windDirection}°
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#22c55e]"></div>
          <span>
            Swell: {swellHeight}m @ {swellDirection}°
          </span>
        </div>
      </div>
    </div>
  );
}
