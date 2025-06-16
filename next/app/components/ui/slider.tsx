"use client";

import * as React from "react";
import { cn } from "@/app/lib/utils";

export interface SliderProps
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    "defaultValue" | "value" | "onChange"
  > {
  value?: number[];
  defaultValue?: number[];
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number[]) => void;
  disabled?: boolean;
  starRating?: number[];
}

export const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  (
    {
      className,
      value,
      defaultValue = [0],
      min = 0,
      max = 100,
      step = 1,
      onValueChange,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const [values, setValues] = React.useState<number[]>(value || defaultValue);
    const trackRef = React.useRef<HTMLDivElement>(null);
    const thumbRefs = React.useRef<(HTMLDivElement | null)[]>([]);
    const [dragging, setDragging] = React.useState<number | null>(null);

    React.useEffect(() => {
      if (value !== undefined) {
        setValues(value);
      }
    }, [value]);

    const updateValue = React.useCallback(
      (clientX: number, thumbIndex: number) => {
        if (disabled || !trackRef.current) return;

        const trackRect = trackRef.current.getBoundingClientRect();
        const percent = Math.max(
          0,
          Math.min(1, (clientX - trackRect.left) / trackRect.width)
        );
        const rawValue = min + percent * (max - min);
        const steppedValue = Math.round(rawValue / step) * step;
        const clampedValue = Math.max(min, Math.min(max, steppedValue));

        const newValues = [...values];
        newValues[thumbIndex] = clampedValue;

        setValues(newValues);
        onValueChange?.(newValues);
      },
      [disabled, min, max, step, values, onValueChange]
    );

    const handleMouseDown = (e: React.MouseEvent, thumbIndex: number) => {
      if (disabled) return;
      setDragging(thumbIndex);
      updateValue(e.clientX, thumbIndex);

      const handleMouseMove = (e: MouseEvent) => {
        updateValue(e.clientX, thumbIndex);
      };

      const handleMouseUp = () => {
        setDragging(null);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };

    const getThumbPercent = (index: number) => {
      return ((values[index] - min) / (max - min)) * 100;
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        {...props}
      >
        <div
          ref={trackRef}
          className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-200"
        >
          <div
            className="absolute h-full bg-[var(--color-tertiary)]"
            style={{
              width: `${getThumbPercent(0)}%`,
            }}
          />
        </div>

        {values.map((value, index) => (
          <div
            key={index}
            ref={(el: HTMLDivElement | null) => {
              thumbRefs.current[index] = el;
            }}
            className={cn(
              "absolute block h-5 w-5 rounded-full border-2 border-[var(--color-tertiary)] bg-white",
              "transition-colors focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-[var(--color-tertiary)] focus-visible:ring-offset-2 disabled:pointer-events-none",
              dragging === index && "ring-2 ring-[var(--color-tertiary)]",
              disabled && "opacity-50"
            )}
            style={{
              left: `calc(${getThumbPercent(index)}% - 10px)`,
              top: "50%",
              transform: "translateY(-50%)",
            }}
            tabIndex={disabled ? -1 : 0}
            role="slider"
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value}
            onMouseDown={(e) => handleMouseDown(e, index)}
            onKeyDown={(e) => {
              if (disabled) return;

              const changeAmount = e.shiftKey ? step * 10 : step;
              let newValue = value;

              switch (e.key) {
                case "ArrowRight":
                case "ArrowUp":
                  newValue = Math.min(max, value + changeAmount);
                  break;
                case "ArrowLeft":
                case "ArrowDown":
                  newValue = Math.max(min, value - changeAmount);
                  break;
                case "Home":
                  newValue = min;
                  break;
                case "End":
                  newValue = max;
                  break;
                default:
                  return;
              }

              const newValues = [...values];
              newValues[index] = newValue;
              setValues(newValues);
              onValueChange?.(newValues);
            }}
          />
        ))}
      </div>
    );
  }
);

Slider.displayName = "Slider";
