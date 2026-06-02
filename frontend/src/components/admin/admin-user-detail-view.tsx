"use client";

import Link from "next/link";
import { useState } from "react";
import { getLocalAdminErrorMessage } from "@/lib/api/local-admin";
import { useAdminUser } from "@/lib/hooks/use-admin";
import { formatDate } from "@/lib/utils";
import { userRoleLabel, userStatusLabel } from "@/lib/admin/admin-utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusAlert } from "@/components/ui/status-alert";
import { getBadgeClassName, getButtonClassName } from "@/components/ui/style-primitives";
import { AdminUserStatusButton } from "./admin-user-status-button";

type AdminUserDetailViewProps = {
  id: string;
};

function UserDetailSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Skeleton className="h-80 rounded-lg" />
      <Skeleton className="h-56 rounded-lg" />
    </div>
  );
}

export function AdminUserDetailView({ id }: AdminUserDetailViewProps) {
  const { data: user, isLoading, error } = useAdminUser(id, Boolean(id));
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (isLoading) {
    return <UserDetailSkeleton />;
  }

  if (error) {
    return (
      <StatusAlert tone="error" className="p-5">
        {getLocalAdminErrorMessage(error)}
      </StatusAlert>
    );
  }

  if (!user) {
    return (
      <EmptyState
        title="User not found"
        description="This account may have been removed or the user id may be invalid."
        action={
          <Link href="/admin/users" className={getButtonClassName("secondary")}>
            Back to users
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-6">
      {message ? (
        <StatusAlert tone="success">
          {message}
        </StatusAlert>
      ) : null}
      {actionError ? (
        <StatusAlert tone="error">
          {actionError}
        </StatusAlert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-lg border border-line bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
                {userRoleLabel(user)}
              </p>
              <h2 className="mt-2 break-words text-2xl font-semibold text-ink">{user.name}</h2>
              <p className="mt-1 break-all text-sm text-muted">{user.email}</p>
            </div>
            <AdminUserStatusButton
              user={user}
              onError={setActionError}
              onSuccess={(nextUser) => {
                setActionError(null);
                setMessage(`${nextUser.email} is now ${userStatusLabel(nextUser).toLowerCase()}.`);
              }}
            />
          </div>

          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Status</dt>
              <dd className="mt-1 font-semibold text-ink">{userStatusLabel(user)}</dd>
            </div>
            <div>
              <dt className="text-muted">Phone</dt>
              <dd className="mt-1 font-semibold text-ink">{user.phone || "Not set"}</dd>
            </div>
            <div>
              <dt className="text-muted">Created</dt>
              <dd className="mt-1 font-semibold text-ink">{formatDate(user.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-muted">Updated</dt>
              <dd className="mt-1 font-semibold text-ink">{formatDate(user.updatedAt)}</dd>
            </div>
            {user.deletedAt ? (
              <div className="sm:col-span-2">
                <dt className="text-muted">Disabled at</dt>
                <dd className="mt-1 font-semibold text-danger-700">{formatDate(user.deletedAt)}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        <aside className="grid gap-6 self-start">
          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-lg font-semibold text-ink">Account actions</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Inactive users cannot sign in. Existing historical orders and reviews stay available.
            </p>
            <div className="mt-5">
              <AdminUserStatusButton
                user={user}
                className="w-full"
                onError={setActionError}
                onSuccess={(nextUser) => {
                  setActionError(null);
                  setMessage(`${nextUser.email} is now ${userStatusLabel(nextUser).toLowerCase()}.`);
                }}
              />
            </div>
          </section>
        </aside>
      </div>

      <section className="rounded-lg border border-line bg-white p-5">
        <h2 className="text-lg font-semibold text-ink">Addresses</h2>
        {!user.addresses?.length ? (
          <p className="mt-4 rounded-md bg-surface p-4 text-sm text-muted">No saved addresses.</p>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {user.addresses.map((address) => (
              <article key={address._id} className="rounded-lg border border-line p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-ink">{address.label || "Address"}</h3>
                  {address.isDefault ? (
                    <span className={getBadgeClassName("info", "px-2.5 py-1")}>
                      Default
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-sm leading-6 text-muted">{address.address}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
