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

    function reset() {
      shell?.style.removeProperty("--portfolio-viewport-width");
      shell?.removeAttribute("data-viewport-zoom");
    }

    function update() {
      frame = 0;
      if (!mobile.matches) {
        reset();
        return;
      }
      const layoutWidth = ruler?.getBoundingClientRect().width ?? 0;
      if (layoutWidth <= 0) return;
      const viewport = window.visualViewport;
      // Zooming in should magnify the existing layout. Zooming out can
      // expose space beyond it, so use that width to keep the center aligned.
      const zoomedOut = !!viewport && viewport.scale < 1 && viewport.width > layoutWidth + 1;
      const zoomedIn = !!viewport && viewport.scale > 1.01;
      const width = zoomedOut ? viewport.width : layoutWidth;
      const zoom = zoomedOut ? "out" : zoomedIn ? "in" : null;
      shell?.style.setProperty("--portfolio-viewport-width", width + "px");
      if (zoom) shell?.setAttribute("data-viewport-zoom", zoom);
      else shell?.removeAttribute("data-viewport-zoom");
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
      reset();
    };
  }, []);

  return <span aria-hidden="true" ref={rulerRef}
    className="pointer-events-none invisible fixed inset-x-0 top-0 h-px sm:hidden" />;
}
