"use client";

import { useEffect, useState } from "react";

const FRAMES = [
  "/aibode.png",
  "/aibodefrente.png",
  "/aibodecosta.png",
];

const HOLD_MS  = 3200;
const FADE_MS  = 700;

export function FishMorph({ className = "" }: { className?: string }) {
  const [current, setCurrent] = useState(0);
  const [next, setNext]       = useState<number | null>(null);
  const [fading, setFading]   = useState(false);

  useEffect(() => {
    const hold = setTimeout(() => {
      const n = (current + 1) % FRAMES.length;
      setNext(n);
      setFading(true);

      const done = setTimeout(() => {
        setCurrent(n);
        setNext(null);
        setFading(false);
      }, FADE_MS);

      return () => clearTimeout(done);
    }, HOLD_MS);

    return () => clearTimeout(hold);
  }, [current]);

  return (
    <div className={className} style={{ position: "relative" }}>
      {/* frame atual — some durante o fade */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={FRAMES[current]}
        alt=""
        style={{
          width: "100%", height: "100%", objectFit: "contain",
          position: "absolute", inset: 0,
          opacity: fading ? 0 : 1,
          transform: fading ? "scale(0.96)" : "scale(1)",
          transition: `opacity ${FADE_MS}ms ease-in-out, transform ${FADE_MS}ms ease-in-out`,
        }}
      />
      {/* próximo frame — aparece durante o fade */}
      {next !== null && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={FRAMES[next]}
          alt=""
          style={{
            width: "100%", height: "100%", objectFit: "contain",
            position: "absolute", inset: 0,
            opacity: fading ? 1 : 0,
            transform: fading ? "scale(1)" : "scale(1.04)",
            transition: `opacity ${FADE_MS}ms ease-in-out, transform ${FADE_MS}ms ease-in-out`,
          }}
        />
      )}
    </div>
  );
}
