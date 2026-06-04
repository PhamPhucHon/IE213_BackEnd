"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { User } from "@/types/models";
import {
  getAdminUsersPagination,
  userStatusLabel
} from "@/lib/admin/admin-utils";
import { useAdminUsers } from "@/lib/hooks/use-admin";
import { cn, formatDate } from "@/lib/utils";
import { AdminUserStatusButton } from "./admin-user-status-button";

function pageFromSearchParams(searchParams: URLSearchParams) {
  const page = Number(searchParams.get("page"));
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function UserStatusBadge({ user }: { user: User }) {
  const isActive = user.isActive !== false;

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
        isActive
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-red-200 bg-red-50 text-red-700"
      )}
    >
      {userStatusLabel(user)}
    </span>
  );
}

function UsersSkeleton() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-24 rounded-lg bg-surface" />
      ))}
    </div>
  );
}

export function AdminUsersView() {
  const searchParams = useSearchParams();
  const page = pageFromSearchParams(searchParams);
  const limit = 10;
  const { data: response, isLoading, error } = useAdminUsers(page, limit);
  const users = response?.data ?? [];
  const pagination = getAdminUsersPagination(response?.meta);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function pageHref(nextPage: number) {
    const params = new URLSearchParams(searchParams);
    if (nextPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }

    const query = params.toString();
    return query ? `/admin/users?${query}` : "/admin/users";
  }

  if (isLoading) {
    return <UsersSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        Could not load users. Please refresh or sign in with an admin account.
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      {message ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}
      {actionError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{pagination.total} customers</p>
        <p className="text-sm text-muted">Page {pagination.currentPage} of {pagination.totalPages}</p>
      </div>

      {!users.length ? (
        <div className="rounded-lg border border-line bg-white p-8 text-center">
          <h2 className="text-xl font-semibold text-ink">No customers found</h2>
          <p className="mt-2 text-sm text-muted">Customer accounts will appear here after registration.</p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border border-line bg-white xl:block">
            <table className="min-w-full divide-y divide-line text-sm">
              <thead className="bg-surface text-left text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.map((user) => (
                  <tr key={user._id}>
                    <td className="px-4 py-4">
                      <Link href={`/admin/users/${user._id}`} className="break-words font-semibold text-ink">
                        {user.name}
                      </Link>
                      <p className="mt-1 break-all text-muted">{user.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <UserStatusBadge user={user} />
                      {user.deletedAt ? (
                        <p className="mt-1 text-xs text-muted">Disabled {formatDate(user.deletedAt)}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-muted">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/users/${user._id}`}
                          className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink hover:bg-surface"
                        >
                          Detail
                        </Link>
                        <AdminUserStatusButton
                          user={user}
                          onError={setActionError}
                          onSuccess={(nextUser) => {
                            setActionError(null);
                            setMessage(`${nextUser.email} is now ${userStatusLabel(nextUser).toLowerCase()}.`);
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 xl:hidden">
            {users.map((user) => (
              <article key={user._id} className="rounded-lg border border-line bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/admin/users/${user._id}`} className="break-words font-semibold text-ink">
                      {user.name}
                    </Link>
                    <p className="mt-1 break-all text-sm text-muted">{user.email}</p>
                  </div>
                  <UserStatusBadge user={user} />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted">Joined {formatDate(user.createdAt)}</span>
                </div>
                <div className="mt-4 grid gap-2 min-[390px]:flex min-[390px]:flex-wrap">
                  <Link
                    href={`/admin/users/${user._id}`}
                    className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md bg-ink px-3 text-sm font-semibold text-white"
                  >
                    Detail
                  </Link>
                  <AdminUserStatusButton
                    user={user}
                    onError={setActionError}
                    onSuccess={(nextUser) => {
                      setActionError(null);
                      setMessage(`${nextUser.email} is now ${userStatusLabel(nextUser).toLowerCase()}.`);
                    }}
                  />
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {pagination.totalPages > 1 ? (
        <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <p className="text-sm text-muted">
            Page {pagination.currentPage} of {pagination.totalPages}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={pageHref(Math.max(1, pagination.currentPage - 1))}
              className="focus-ring inline-flex min-h-11 items-center rounded-md border border-line bg-white px-3 text-sm font-medium text-ink aria-disabled:pointer-events-none aria-disabled:opacity-50"
              aria-disabled={pagination.currentPage <= 1}
              tabIndex={pagination.currentPage <= 1 ? -1 : undefined}
            >
              Previous
            </Link>
            <Link
              href={pageHref(Math.min(pagination.totalPages, pagination.currentPage + 1))}
              className="focus-ring inline-flex min-h-11 items-center rounded-md border border-line bg-white px-3 text-sm font-medium text-ink aria-disabled:pointer-events-none aria-disabled:opacity-50"
              aria-disabled={pagination.currentPage >= pagination.totalPages}
              tabIndex={pagination.currentPage >= pagination.totalPages ? -1 : undefined}
            >
              Next
            </Link>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
