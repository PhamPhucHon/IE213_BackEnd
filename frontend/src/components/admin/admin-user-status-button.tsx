"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@/types/models";
import { getLocalAdminErrorMessage, toggleAdminUserStatus } from "@/lib/api/local-admin";
import { cn } from "@/lib/utils";
import { adminUserQueryKey, adminUsersQueryKey } from "@/lib/hooks/use-admin";
import { useConfirm } from "@/components/ui/confirm-provider";
import { useToast } from "@/components/ui/toast-provider";
import { getButtonClassName } from "@/components/ui/style-primitives";

type AdminUserStatusButtonProps = {
  user: User;
  className?: string;
  onError?: (message: string) => void;
  onSuccess?: (user: User) => void;
};

export function AdminUserStatusButton({
  user,
  className,
  onError,
  onSuccess
}: AdminUserStatusButtonProps) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { showToast } = useToast();
  const isActive = user.isActive !== false;
  const mutation = useMutation({
    mutationFn: () => toggleAdminUserStatus(user._id),
    onSuccess: (nextUser) => {
      queryClient.setQueryData(adminUserQueryKey(nextUser._id), nextUser);
      queryClient.invalidateQueries({ queryKey: adminUsersQueryKey });
      showToast({
        title: "User status updated",
        description: `${nextUser.email} is now ${nextUser.isActive === false ? "inactive" : "active"}.`,
        variant: "success"
      });
      onSuccess?.(nextUser);
    },
    onError: (error) => {
      const message = getLocalAdminErrorMessage(error);
      showToast({ title: "Could not update user", description: message, variant: "error" });
      onError?.(message);
    }
  });

  return (
    <button
      type="button"
      className={cn(
        getButtonClassName(isActive ? "danger" : "success", "px-3"),
        className
      )}
      disabled={mutation.isPending}
      onClick={async () => {
        const action = isActive ? "deactivate" : "reactivate";
        const confirmed = await confirm({
          title: `Confirm ${action} account`,
          description: `${user.email} will be ${isActive ? "blocked from signing in" : "allowed to sign in again"}.`,
          confirmLabel: isActive ? "Deactivate" : "Reactivate",
          destructive: isActive
        });

        if (confirmed) {
          mutation.mutate();
        }
      }}
    >
      {mutation.isPending ? "Saving..." : isActive ? "Deactivate" : "Reactivate"}
    </button>
  );
}
