"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  BellOff,
  X,
  BookOpen,
  GraduationCap,
  Sparkles,
  CalendarClock,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import { strings, type Lang } from "@/lib/i18n";
import type { AppNotification, NotificationType } from "@/lib/notifications-data";

const EASE = [0.16, 1, 0.3, 1] as const;

const TYPE_ICON: Record<NotificationType, LucideIcon> = {
  studyReminder: BookOpen,
  examReminder: GraduationCap,
  aiRecommendation: Sparkles,
  scheduleUpdate: CalendarClock,
  systemUpdate: Megaphone,
};

const popoverVariants = {
  hidden: { opacity: 0, y: -6, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

function NotificationRow({
  notification,
  lang,
  onMarkRead,
  onDismiss,
}: {
  notification: AppNotification;
  lang: Lang;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const Icon = TYPE_ICON[notification.type];
  return (
    <div
      onClick={() => onMarkRead(notification.id)}
      className={`group relative flex cursor-pointer gap-3 rounded-lg py-2.5 pl-2.5 pr-8 transition-colors duration-150 hover:bg-surface-muted ${
        notification.read ? "" : "bg-accent-soft"
      }`}
    >
      <div
        className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
          notification.read ? "bg-surface-muted text-foreground-muted" : "bg-surface text-accent"
        }`}
      >
        <Icon size={14} strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-1.5">
          <p className={`min-w-0 flex-1 text-sm ${notification.read ? "text-foreground-muted" : "font-medium text-foreground"}`}>
            {notification.title[lang]}
          </p>
          {!notification.read && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />}
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-foreground-muted">{notification.description[lang]}</p>
        <p className="mt-1 text-[10px] text-foreground-faint">{notification.time[lang]}</p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(notification.id);
        }}
        aria-label={strings.notificationDismissLabel[lang]}
        className="absolute right-1.5 top-1.5 rounded-md p-1 text-foreground-faint opacity-0 transition-opacity duration-150 hover:bg-surface hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100"
      >
        <X size={12} strokeWidth={2} />
      </button>
    </div>
  );
}

export function NotificationBell({
  lang,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDismiss,
}: {
  lang: Lang;
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDismiss: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={strings.notificationsTitle[lang]}
        className="relative rounded-md border border-border p-1.5 text-foreground-muted transition-colors duration-150 hover:text-foreground"
      >
        <Bell size={14} strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-medium leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={popoverVariants}
            transition={{ duration: 0.18, ease: EASE }}
            className="absolute right-0 top-full z-30 mt-2 max-h-[70vh] w-[min(22rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-border bg-surface p-3 shadow-lg"
          >
            <div className="flex items-center justify-between gap-3 px-1 pb-2">
              <p className="text-sm font-semibold text-foreground-strong">{strings.notificationsTitle[lang]}</p>
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllRead}
                  className="text-xs font-medium text-accent transition-opacity duration-150 hover:opacity-75"
                >
                  {strings.notificationsMarkAllReadBtn[lang]}
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <BellOff size={18} strokeWidth={1.75} />
                </div>
                <p className="text-sm font-medium">{strings.notificationsEmptyTitle[lang]}</p>
                <p className="max-w-[220px] text-xs text-foreground-muted">{strings.notificationsEmptyDesc[lang]}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {notifications.map((n) => (
                  <NotificationRow key={n.id} notification={n} lang={lang} onMarkRead={onMarkRead} onDismiss={onDismiss} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
