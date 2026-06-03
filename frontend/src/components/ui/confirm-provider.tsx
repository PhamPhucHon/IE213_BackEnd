"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";
import { getButtonClassName, modalOverlayClassName, modalPanelClassName } from "./style-primitives";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string | null;
  destructive?: boolean;
};

type ConfirmRequest = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

type InertElementState = {
  element: HTMLElement;
  ariaHidden: string | null;
  inert: boolean;
};

function makeDialogBackgroundInert(overlay: HTMLElement) {
  const backgroundElements = Array.from(document.body.children).filter(
    (element): element is HTMLElement => element instanceof HTMLElement && element !== overlay
  );
  const previousStates: InertElementState[] = backgroundElements.map((element) => ({
    element,
    ariaHidden: element.getAttribute("aria-hidden"),
    inert: Boolean((element as HTMLElement & { inert?: boolean }).inert)
  }));

  backgroundElements.forEach((element) => {
    (element as HTMLElement & { inert?: boolean }).inert = true;
    element.setAttribute("aria-hidden", "true");
  });

  return () => {
    previousStates.forEach(({ element, ariaHidden, inert }) => {
      (element as HTMLElement & { inert?: boolean }).inert = inert;

      if (ariaHidden === null) {
        element.removeAttribute("aria-hidden");
      } else {
        element.setAttribute("aria-hidden", ariaHidden);
      }
    });
  };
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

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

    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    (cancelButtonRef.current ?? confirmButtonRef.current)?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close(false);
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
        )
      );

      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    };
  }, [close, request]);

  useEffect(() => {
    if (!request || !overlayRef.current) return;
    return makeDialogBackgroundInert(overlayRef.current);
  }, [request]);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {request && typeof document !== "undefined" ? createPortal(
        <div
          ref={overlayRef}
          className={modalOverlayClassName}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              close(false);
            }
          }}
        >
          <section
            ref={dialogRef}
            aria-modal="true"
            role="dialog"
            aria-labelledby="confirm-dialog-title"
            aria-describedby={request.description ? "confirm-dialog-description" : undefined}
            className={`${modalPanelClassName} max-w-md p-4 sm:p-5`}
          >
            <div className="flex items-start gap-3">
              {request.destructive ? (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-danger-50 text-danger-700">
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                </span>
              ) : null}
              <div className="min-w-0">
                <h2 id="confirm-dialog-title" className="break-words text-lg font-semibold text-ink">
                  {request.title}
                </h2>
                {request.description ? (
                  <p id="confirm-dialog-description" className="mt-2 break-words text-sm leading-6 text-muted">
                    {request.description}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="mt-5 grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
              {request.cancelLabel !== null ? (
                <button
                  ref={cancelButtonRef}
                  type="button"
                  className={getButtonClassName("secondary", "w-full sm:w-auto")}
                  onClick={() => close(false)}
                >
                  {request.cancelLabel ?? "Cancel"}
                </button>
              ) : null}
              <button
                ref={confirmButtonRef}
                type="button"
                className={getButtonClassName(request.destructive ? "danger" : "primary", "w-full sm:w-auto")}
                onClick={() => close(true)}
              >
                {request.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </section>
        </div>,
        document.body
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
