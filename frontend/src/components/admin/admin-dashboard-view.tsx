"use client";

import Image from "next/image";
import Link from "next/link";
import { Boxes, PackageCheck, TrendingUp, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { getLocalAdminErrorMessage } from "@/lib/api/local-admin";
import { useAdminOverview, useAdminTopProducts } from "@/lib/hooks/use-admin";
import { formatCurrency } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusAlert } from "@/components/ui/status-alert";

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function compactNumber(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-lg" />
    </div>
  );
}

export function AdminDashboardView() {
  const overviewQuery = useAdminOverview();
  const topProductsQuery = useAdminTopProducts(8);
  const overview = overviewQuery.data;
  const topProducts = topProductsQuery.data ?? [];

  if (overviewQuery.isLoading) {
    return <DashboardSkeleton />;
  }

  if (overviewQuery.error) {
    return (
      <StatusAlert tone="error" className="p-5">
        {getLocalAdminErrorMessage(overviewQuery.error)}
      </StatusAlert>
    );
  }

  const kpis = [
    {
      label: "Users",
      value: formatNumber(overview?.totalUsers ?? 0),
      detail: "Registered accounts",
      icon: Users,
      href: "/admin/users"
    },
    {
      label: "Orders",
      value: formatNumber(overview?.totalOrders ?? 0),
      detail: "All order records",
      icon: PackageCheck,
      href: "/admin/orders"
    },
    {
      label: "Revenue this month",
      value: formatCurrency(overview?.revenueThisMonth ?? 0),
      detail: "Delivered orders only",
      icon: TrendingUp,
      href: "/admin/orders?status=Delivered"
    },
    {
      label: "Low stock",
      value: formatNumber(overview?.lowStockCount ?? 0),
      detail: "Available stock below 10",
      icon: Boxes,
      href: "/admin/inventory?lowStock=true"
    }
  ];

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={kpi.label}
              href={kpi.href}
              className="focus-ring rounded-lg border border-line bg-white p-5 transition hover:border-brand-100 hover:shadow-soft"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-muted">{kpi.label}</p>
                  <p className="mt-3 text-2xl font-semibold text-ink">{kpi.value}</p>
                </div>
                <span className="rounded-md bg-brand-50 p-2 text-brand-600">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-4 text-sm text-muted">{kpi.detail}</p>
            </Link>
          );
        })}
      </div>

      <section className="rounded-lg border border-line bg-white p-5 shadow-subtle">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink">Top selling products</h2>
            <p className="mt-1 text-sm text-muted">Delivered orders ranked by quantity sold.</p>
          </div>
          <Link href="/admin/products" className="text-sm font-semibold text-brand-600">
            Manage products
          </Link>
        </div>

        {topProductsQuery.isLoading ? (
          <Skeleton className="mt-6 h-72 rounded-md" />
        ) : topProductsQuery.error ? (
          <StatusAlert tone="error" className="mt-6">
            {getLocalAdminErrorMessage(topProductsQuery.error)}
          </StatusAlert>
        ) : !topProducts.length ? (
          <EmptyState
            title="No top products yet"
            description="Delivered orders will appear here once enough sales data is available."
            className="mt-6 p-6"
          />
        ) : (
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
            <div className="h-72 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => String(value).slice(0, 14)}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => compactNumber(Number(value))}
                  />
                  <Tooltip />
                  <Bar dataKey="totalRevenue" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid gap-3">
              {topProducts.map((product, index) => (
                <article
                  key={`${product._id}-${index}`}
                  className="grid grid-cols-[56px_1fr] gap-3 rounded-lg border border-line p-3"
                >
                  <div className="relative aspect-square overflow-hidden rounded-md bg-surface">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="truncate text-sm font-semibold text-ink">{product.name}</h3>
                      <span className="shrink-0 text-xs font-semibold text-muted">#{index + 1}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted">
                      <p>
                        Sold <span className="font-semibold text-ink">{formatNumber(product.totalSold)}</span>
                      </p>
                      <p className="text-right font-semibold text-ink">
                        {formatCurrency(product.totalRevenue)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
