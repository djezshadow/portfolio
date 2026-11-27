"use client";

import { useLayoutEffect, useRef } from "react";

export function MobileViewportWidth() {
  const rulerRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const ruler = rulerRef.current;
    const shell = ruler?.parentElement;
    if (!ruler || !shell) return;

    const mobile = window.matchMedia("(max-width: 639px)");
    let frame = 0;

    function update() {
      frame = 0;
      if (!mobile.matches) {
        shell?.style.removeProperty("--portfolio-viewport-width");
        return;
      }
      const viewport = window.visualViewport;
      if (viewport && Math.abs(viewport.scale - 1) > 0.01) return;
      const width = ruler?.getBoundingClientRect().width ?? 0;
      if (width > 0) shell?.style.setProperty("--portfolio-viewport-width", width + "px");
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    const observer = new ResizeObserver(schedule);
    observer.observe(ruler);
    mobile.addEventListener("change", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    update();

    return () => {
      observer.disconnect();
      mobile.removeEventListener("change", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
      shell.style.removeProperty("--portfolio-viewport-width");
    };
  }, []);

  return <span aria-hidden="true" ref={rulerRef}
    className="pointer-events-none invisible fixed inset-x-0 top-0 h-px sm:hidden" />;
}
