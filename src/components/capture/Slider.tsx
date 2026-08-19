"use client";

import { useCallback, useRef } from "react";
import { clampSliderValue, SLIDER_MAX, SLIDER_MIN, SLIDER_STEP } from "./validation";

export interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  "aria-label"?: string;
}

function valueFromClientX(track: HTMLDivElement, clientX: number, min: number, max: number, step: number): number {
  const rect = track.getBoundingClientRect();
  const fraction = rect.width <= 0 ? 0 : Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  return clampSliderValue(min + fraction * (max - min), min, max, step);
}

/**
 * The add sheet's amount slider (README: "pointer position across the track
 * sets the value; knob is a 16px lime circle with a 3px surface-coloured
 * ring"). Not one of the existing primitives — the handoff describes this
 * control only on screen 08, so it lives with the capture flow that owns it
 * rather than in `src/components/ui`.
 */
export function Slider({ value, min = SLIDER_MIN, max = SLIDER_MAX, step = SLIDER_STEP, onChange, ...rest }: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const handleMove = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return;
      onChange(valueFromClientX(el, clientX, min, max, step));
    },
    [onChange, min, max, step]
  );

  const clampedValue = Math.min(max, Math.max(min, value));
  const pct = max > min ? ((clampedValue - min) / (max - min)) * 100 : 0;

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={clampedValue}
      aria-label={rest["aria-label"] ?? "Amount"}
      onPointerDown={(e) => {
        draggingRef.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        handleMove(e.clientX);
      }}
      onPointerMove={(e) => {
        if (draggingRef.current) handleMove(e.clientX);
      }}
      onPointerUp={() => {
        draggingRef.current = false;
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange(clampSliderValue(value + step, min, max, step));
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange(clampSliderValue(value - step, min, max, step));
      }}
      style={{
        position: "relative",
        height: 16,
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
        touchAction: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: 4,
          borderRadius: "var(--radius-pill)",
          background: "var(--surface-inset)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          width: `${pct}%`,
          height: 4,
          borderRadius: "var(--radius-pill)",
          background: "var(--lime-fill)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: `calc(${pct}% - 8px)`,
          width: 16,
          height: 16,
          borderRadius: "var(--radius-pill)",
          background: "var(--lime-fill)",
          boxShadow: "0 0 0 3px var(--surface)",
        }}
      />
    </div>
  );
}
