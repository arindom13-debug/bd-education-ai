"use client";

import { useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WifiOff } from "lucide-react";
import { strings, type Lang } from "@/lib/i18n";

const EASE = [0.16, 1, 0.3, 1] as const;

function subscribeToConnectivity(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

// Assumed online during SSR — corrected on the client right after hydration,
// which useSyncExternalStore handles without a hydration-mismatch warning.
function getServerSnapshot() {
  return true;
}

function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribeToConnectivity, getOnlineSnapshot, getServerSnapshot);
}

export function OfflineBanner({ lang }: { lang: Lang }) {
  const online = useOnlineStatus();

  return (
    <AnimatePresence initial={false}>
      {!online && (
        <motion.div
          role="status"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          className="overflow-hidden"
        >
          <div className="flex items-center justify-center gap-1.5 border-b border-warning/30 bg-warning/10 px-4 py-1.5 text-xs font-medium text-warning">
            <WifiOff size={13} strokeWidth={1.75} />
            {strings.offlineLabel[lang]}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
