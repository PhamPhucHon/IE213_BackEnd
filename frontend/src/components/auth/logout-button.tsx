"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { logout } from "@/lib/api/local-auth";
import { clearSessionQueries } from "@/lib/query/session-cache";
import { cn } from "@/lib/utils";

type LogoutButtonProps = {
  className?: string;
  redirectTo?: string;
  showIcon?: boolean;
};

export function LogoutButton({
  className,
  redirectTo = "/login",
  showIcon = true
}: LogoutButtonProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  async function handleLogout() {
    setIsPending(true);

    try {
      await logout();
    } finally {
      await clearSessionQueries(queryClient);
      router.push(redirectTo);
      router.refresh();
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      className={cn(
        "focus-ring inline-flex min-h-11 items-center justify-center rounded-md px-3 text-sm font-medium text-ink transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      onClick={handleLogout}
      disabled={isPending}
      aria-busy={isPending}
    >
      {showIcon ? <LogOut className="mr-2 h-4 w-4" /> : null}
      {isPending ? "Logging out..." : "Logout"}
    </button>
  );
}
