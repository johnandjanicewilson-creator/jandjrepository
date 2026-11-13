"use client";

import { useEffect, useRef } from "react";

export function EmailOctopusSignup() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const script = document.createElement("script");
    script.async = true;
    script.src =
      "https://eomail6.com/form/40ffa52c-331e-11f0-99c1-2f1382fb75ac.js";
    script.setAttribute(
      "data-form",
      "40ffa52c-331e-11f0-99c1-2f1382fb75ac"
    );

    container.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return <div ref={containerRef} className="min-w-0" />;
}
