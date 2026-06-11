"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { Loader2Icon } from "lucide-react";

type ScanLoadingContextValue = {
  isScanLoading: boolean;
  startScanLoading: () => void;
  stopScanLoading: () => void;
};

const ScanLoadingContext = createContext<ScanLoadingContextValue | null>(null);

export function ScanLoadingProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [isScanLoading, setIsScanLoading] = useState(false);

  const startScanLoading = useCallback(() => {
    setIsScanLoading(true);
  }, []);

  const stopScanLoading = useCallback(() => {
    setIsScanLoading(false);
  }, []);

  const value = useMemo(
    () => ({
      isScanLoading,
      startScanLoading,
      stopScanLoading
    }),
    [isScanLoading, startScanLoading, stopScanLoading]
  );

  return (
    <ScanLoadingContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {isScanLoading ? (
          <motion.div
            key="scan-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-warden-dark/30 backdrop-blur-md"
            aria-live="polite"
            aria-busy="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-4 rounded-2xl border border-border/60 bg-card px-10 py-8 shadow-card-hover"
            >
              <Loader2Icon className="size-9 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-medium text-foreground">Running scan</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Analyzing your repository. This may take a moment.
                </p>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </ScanLoadingContext.Provider>
  );
}

export function useScanLoading() {
  const context = useContext(ScanLoadingContext);

  if (!context) {
    throw new Error("useScanLoading must be used within ScanLoadingProvider");
  }

  return context;
}
