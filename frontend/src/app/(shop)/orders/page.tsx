import { redirect } from "next/navigation";

type OrdersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const page = firstValue((await searchParams).page);
  redirect(page ? `/account/orders?page=${encodeURIComponent(page)}` : "/account/orders");
}
