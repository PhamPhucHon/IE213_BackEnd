"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type ConfirmRequest = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(
    (value: boolean) => {
      request?.resolve(value);
      setRequest(null);
    },
    [request]
  );

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setRequest({ ...options, resolve });
    });
  }, []);

  useEffect(() => {
    if (!request) return;

    cancelButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, request]);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {request ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <section
            aria-modal="true"
            role="dialog"
            aria-labelledby="confirm-dialog-title"
            aria-describedby={request.description ? "confirm-dialog-description" : undefined}
            className="w-full max-w-md rounded-lg border border-line bg-white p-5 shadow-soft"
          >
            <h2 id="confirm-dialog-title" className="text-lg font-semibold text-ink">
              {request.title}
            </h2>
            {request.description ? (
              <p id="confirm-dialog-description" className="mt-2 text-sm leading-6 text-muted">
                {request.description}
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                ref={cancelButtonRef}
                type="button"
                className="focus-ring rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
                onClick={() => close(false)}
              >
                {request.cancelLabel ?? "Cancel"}
              </button>
              <button
                type="button"
                className={
                  request.destructive
                    ? "focus-ring rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
                    : "focus-ring rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-black"
                }
                onClick={() => close(true)}
              >
                {request.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);

  if (!context) {
    throw new Error("useConfirm must be used inside ConfirmProvider");
  }

  return context.confirm;
}
