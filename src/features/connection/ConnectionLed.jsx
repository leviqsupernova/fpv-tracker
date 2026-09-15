import React, { useEffect, useRef, useState } from "react";
import { Led } from "../../components";

/** Grey when never configured, green while the connection is good,
 *  red once it isn't — and blinks a few times right at the moment a
 *  previously-good connection drops, rather than just sitting red
 *  the whole time (which is easy to miss out of the corner of an eye). */
export function ConnectionLed({ configured, healthy }) {
  const [blinking, setBlinking] = useState(false);
  const prevHealthy = useRef(null);
  const blinkTimer = useRef(null);

  useEffect(() => {
    if (configured && prevHealthy.current === true && healthy === false) {
      setBlinking(true);
      if (blinkTimer.current) clearTimeout(blinkTimer.current);
      blinkTimer.current = setTimeout(() => setBlinking(false), 900);
    }
    prevHealthy.current = configured ? healthy : null;
  }, [configured, healthy]);

  useEffect(() => () => { if (blinkTimer.current) clearTimeout(blinkTimer.current); }, []);

  const color = !configured ? "var(--text-faint)" : healthy ? "var(--ready)" : "var(--repair)";

  return <Led color={color} size="sm" glow={configured} className={blinking ? "led-blink-loss" : ""} />;
}
