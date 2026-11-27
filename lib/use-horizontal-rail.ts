"use client";

import { useRef, type MouseEvent, type PointerEvent } from "react";

type Drag = { id: number; x: number; y: number; left: number; horizontal: boolean };

export function useHorizontalRail({ mouse = false } = {}) {
  const drag = useRef<Drag | null>(null);
  const blockClick = useRef(false);

  function finish(event: PointerEvent<HTMLDivElement>, settle = false) {
    const gesture = drag.current;
    if (gesture?.id !== event.pointerId) return;
    const rail = event.currentTarget;
    drag.current = null;
    const end = rail.scrollLeft;
    delete rail.dataset.dragging;
    if (!settle || !gesture.horizontal || Math.abs(end - gesture.left) < 36) return;
    if (getComputedStyle(rail).scrollSnapType === "none") return;

    const frame = rail.getBoundingClientRect();
    const max = rail.scrollWidth - rail.clientWidth;
    const direction = Math.sign(end - gesture.left);
    const stops = Array.from(rail.children).flatMap((item) => {
      const align = getComputedStyle(item).scrollSnapAlign.split(" ").at(-1);
      if (!align || align === "none") return [];
      const bounds = item.getBoundingClientRect();
      const delta = align === "center" ? (bounds.left + bounds.right - frame.left - frame.right) / 2
        : align === "end" ? bounds.right - frame.right : bounds.left - frame.left;
      return [Math.max(0, Math.min(max, rail.scrollLeft + delta))];
    });
    const target = stops.reduce<number | undefined>((nearest, stop) => {
      if ((stop - gesture.left) * direction <= 3) return nearest;
      return nearest === undefined || Math.abs(end - stop) < Math.abs(end - nearest) ? stop : nearest;
    }, undefined);
    if (target !== undefined) rail.scrollTo({
      left: target,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }

  return {
    onPointerDown(event: PointerEvent<HTMLDivElement>) {
      if (!event.isPrimary || event.button !== 0) return;
      blockClick.current = false;
      if (event.pointerType !== "touch" && !(mouse && event.pointerType === "mouse")) return;
      const rail = event.currentTarget;
      if (rail.scrollWidth <= rail.clientWidth + 2) return;
      drag.current = {
        id: event.pointerId, x: event.clientX, y: event.clientY,
        left: rail.scrollLeft, horizontal: false,
      };
    },
    onPointerMove(event: PointerEvent<HTMLDivElement>) {
      const gesture = drag.current;
      if (!gesture || event.pointerId !== gesture.id) return;
      const rail = event.currentTarget;
      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      if (!gesture.horizontal) {
        const touch = event.pointerType === "touch";
        if (touch && Math.abs(dy) > 8 && Math.abs(dx) < Math.abs(dy) * 1.6) {
          drag.current = null;
          return;
        }
        if (Math.abs(dx) < (touch ? 16 : 5)) return;
        gesture.horizontal = true;
        blockClick.current = true;
        rail.dataset.dragging = "true";
        rail.setPointerCapture(gesture.id);
      }
      rail.scrollLeft = gesture.left - dx;
    },
    onPointerUp: (event: PointerEvent<HTMLDivElement>) => finish(event, true),
    onPointerCancel: (event: PointerEvent<HTMLDivElement>) => finish(event),
    onLostPointerCapture(event: PointerEvent<HTMLDivElement>) {
      if (event.target === event.currentTarget) finish(event);
    },
    onPointerLeave(event: PointerEvent<HTMLDivElement>) {
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) finish(event);
    },
    onClickCapture(event: MouseEvent<HTMLDivElement>) {
      if (!blockClick.current || event.detail === 0) return;
      blockClick.current = false;
      event.preventDefault();
      event.stopPropagation();
    },
  };
}
