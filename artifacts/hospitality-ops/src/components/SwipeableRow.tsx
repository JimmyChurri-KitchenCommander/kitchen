import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

const REVEAL_PX = 40;
const TRIGGER_PX = 80;
const MAX_TX = 110;

export type SwipeAction = {
  label: string;
  icon: React.ReactNode;
  bgClass: string;
  textClass?: string;
  onTrigger: () => void;
};

/**
 * Wraps any card in horizontal swipe gestures (touch-only — desktop users see existing buttons).
 *
 * Swipe RIGHT → reveals leftAction   (e.g. Claim  — blue)
 * Swipe LEFT  → reveals rightAction  (e.g. Done   — green)
 *
 * Release past 80 px triggers the action; shorter swipe snaps back.
 */
export function SwipeableRow({
  children,
  leftAction,
  rightAction,
  className,
}: {
  children: React.ReactNode;
  leftAction?: SwipeAction;
  rightAction?: SwipeAction;
  className?: string;
}) {
  const startX = useRef(0);
  const startY = useRef(0);
  const dir = useRef<"h" | "v" | null>(null);

  const [tx, setTx] = useState(0);
  const [active, setActive] = useState(false);
  const [triggered, setTriggered] = useState<"left" | "right" | null>(null);

  function down(e: React.PointerEvent) {
    if (e.pointerType !== "touch") return;
    startX.current = e.clientX;
    startY.current = e.clientY;
    dir.current = null;
    setActive(true);
    setTriggered(null);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function move(e: React.PointerEvent) {
    if (!active) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    if (dir.current === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      dir.current = Math.abs(dx) > Math.abs(dy) * 0.9 ? "h" : "v";
    }
    if (dir.current !== "h") return;
    e.preventDefault();
    const lo = rightAction ? -MAX_TX : 0;
    const hi = leftAction ? MAX_TX : 0;
    const clamped = Math.max(lo, Math.min(hi, dx));
    setTx(clamped);
    if (clamped >= TRIGGER_PX && leftAction) setTriggered("left");
    else if (clamped <= -TRIGGER_PX && rightAction) setTriggered("right");
    else setTriggered(null);
  }

  function up() {
    if (!active) return;
    setActive(false);
    if (triggered === "left") leftAction?.onTrigger();
    else if (triggered === "right") rightAction?.onTrigger();
    setTx(0);
    setTriggered(null);
    dir.current = null;
  }

  const showLeft = tx > REVEAL_PX && !!leftAction;
  const showRight = tx < -REVEAL_PX && !!rightAction;

  return (
    <div className={cn("relative overflow-hidden rounded-lg touch-pan-y", className)}>
      {/* Left action bg (swipe right = Claim) */}
      {leftAction && (
        <div
          className={cn(
            "absolute inset-0 flex items-center pl-5 rounded-lg transition-opacity duration-150",
            leftAction.bgClass,
            showLeft ? "opacity-100" : "opacity-0",
          )}
        >
          <div className={cn("flex items-center gap-2 font-semibold text-sm", leftAction.textClass ?? "text-white")}>
            {leftAction.icon}
            <span>
              {triggered === "left" ? "Release — " : ""}
              {leftAction.label}
            </span>
          </div>
        </div>
      )}

      {/* Right action bg (swipe left = Done) */}
      {rightAction && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-end pr-5 rounded-lg transition-opacity duration-150",
            rightAction.bgClass,
            showRight ? "opacity-100" : "opacity-0",
          )}
        >
          <div className={cn("flex items-center gap-2 font-semibold text-sm", rightAction.textClass ?? "text-white")}>
            <span>
              {triggered === "right" ? "Release — " : ""}
              {rightAction.label}
            </span>
            {rightAction.icon}
          </div>
        </div>
      )}

      {/* Card content */}
      <div
        style={{
          transform: `translateX(${tx}px)`,
          transition: active ? "none" : "transform 0.22s ease-out",
        }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        {children}
      </div>
    </div>
  );
}
