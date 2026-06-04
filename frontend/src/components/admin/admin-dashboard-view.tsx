"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Boxes, ChevronDown, ChevronUp, PackageCheck, TrendingUp, Users } from "lucide-react";
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
import {
  useAdminOverview,
  useAdminRevenueSeries,
  useAdminTopProducts
} from "@/lib/hooks/use-admin";
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

function compactCurrency(value: number) {
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
      <Skeleton className="h-96 rounded-lg" />
    </div>
  );
}

export function AdminDashboardView() {
  const [showAllTopProducts, setShowAllTopProducts] = useState(false);
  const overviewQuery = useAdminOverview();
  const topProductsQuery = useAdminTopProducts(10);
  const revenueQuery = useAdminRevenueSeries("quarter");
  const overview = overviewQuery.data;
  const topProducts = topProductsQuery.data ?? [];
  const revenueSeries = revenueQuery.data ?? [];
  const topProductChartData = topProducts.map((product, index) => ({
    ...product,
    rankLabel: `#${index + 1}`
  }));
  const visibleTopProducts = showAllTopProducts ? topProducts : topProducts.slice(0, 3);
  const canToggleTopProducts = topProducts.length > 3;
  const revenueChartData = revenueSeries.map((point, index) => ({
    ...point,
    weekLabel: `W${index + 1}`
  }));
  const hasRevenueData = revenueSeries.some((point) => point.revenue > 0 || point.orders > 0);
  const totalRevenue = revenueSeries.reduce((sum, point) => sum + point.revenue, 0);
  const totalOrders = revenueSeries.reduce((sum, point) => sum + point.orders, 0);

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
            <p className="mt-1 text-sm text-muted">Top 10 delivered products ranked by revenue.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {canToggleTopProducts ? (
              <button
                type="button"
                onClick={() => setShowAllTopProducts((current) => !current)}
                className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm font-semibold text-ink transition hover:border-brand-100 hover:text-brand-600"
              >
                {showAllTopProducts ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                {showAllTopProducts ? "Show top 3" : "View all"}
              </button>
            ) : null}
            <Link href="/admin/products" className="text-sm font-semibold text-brand-600">
              Manage products
            </Link>
          </div>
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
                <BarChart data={topProductChartData} margin={{ left: 8, right: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="rankLabel"
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    tick={{ fontSize: 12, fontWeight: 600 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => compactNumber(Number(value))}
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
                    labelFormatter={(label) => {
                      const product = topProductChartData.find((item) => item.rankLabel === label);
                      return product?.name ?? label;
                    }}
                  />
                  <Bar dataKey="totalRevenue" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid gap-3">
              {visibleTopProducts.map((product, index) => (
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

      <section className="rounded-lg border border-line bg-white p-5 shadow-subtle">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink">Quarterly revenue</h2>
            <p className="mt-1 text-sm text-muted">Last 13 weeks of delivered revenue, grouped by week.</p>
          </div>
        </div>

        {revenueQuery.isLoading ? (
          <Skeleton className="mt-6 h-80 rounded-md" />
        ) : revenueQuery.error ? (
          <StatusAlert tone="error" className="mt-6">
            {getLocalAdminErrorMessage(revenueQuery.error)}
          </StatusAlert>
        ) : !hasRevenueData ? (
          <EmptyState
            title="No delivered revenue yet"
            description="Delivered orders will populate this chart and table."
            className="mt-6 p-6"
          />
        ) : (
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="h-80 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChartData} margin={{ top: 10, right: 12, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="weekLabel"
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    tick={{ fontSize: 12, fontWeight: 600 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => compactCurrency(Number(value))}
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
                    labelFormatter={(label) => {
                      const point = revenueChartData.find((item) => item.weekLabel === label);
                      return point?.label ?? label;
                    }}
                  />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={42} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="min-w-0">
              <div className="grid grid-cols-2 gap-4 border-b border-line pb-4">
                <div>
                  <p className="text-xs font-medium uppercase text-muted">Revenue</p>
                  <p className="mt-2 text-lg font-semibold text-ink">{formatCurrency(totalRevenue)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-muted">Orders</p>
                  <p className="mt-2 text-lg font-semibold text-ink">{formatNumber(totalOrders)}</p>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs font-semibold uppercase text-muted">
                      <th className="py-2 pr-3">Period</th>
                      <th className="px-3 py-2 text-right">Orders</th>
                      <th className="py-2 pl-3 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueSeries.map((point) => (
                      <tr key={point.key} className="border-b border-line last:border-0">
                        <td className="py-2 pr-3 font-medium text-ink">{point.label}</td>
                        <td className="px-3 py-2 text-right text-muted">{formatNumber(point.orders)}</td>
                        <td className="py-2 pl-3 text-right font-semibold text-ink">
                          {formatCurrency(point.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
