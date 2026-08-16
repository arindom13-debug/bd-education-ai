"use client";

import { useEffect, useId, useRef } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

function getFocusable(container: HTMLElement): HTMLElement[] {
  const nodes = container.querySelectorAll<HTMLElement>("a[href], button, textarea, input, select, [tabindex]");
  return Array.from(nodes).filter(
    (el) => !el.hasAttribute("disabled") && el.getAttribute("tabindex") !== "-1" && el.offsetParent !== null
  );
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Move focus into the dialog on open, and hand it back to whatever
  // triggered the modal once it unmounts (covers every close path — X,
  // backdrop, Escape, Cancel/Confirm — since they all unmount this instance).
  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => {
      previouslyFocused.current?.focus?.();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = getFocusable(panelRef.current);
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: EASE }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <motion.button
        onClick={onClose}
        aria-label="Close"
        tabIndex={-1}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: EASE }}
        className="absolute inset-0 bg-black/40"
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2, ease: EASE }}
        className="relative flex max-h-[85dvh] w-full max-w-lg flex-col rounded-2xl border border-border bg-surface shadow-lg"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 id={titleId} className="min-w-0 truncate text-base font-semibold tracking-tight">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-md p-1 text-foreground-muted transition-colors duration-150 hover:bg-surface-muted hover:text-foreground"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </motion.div>
    </motion.div>
  );
}
