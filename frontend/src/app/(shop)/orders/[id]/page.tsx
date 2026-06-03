import { redirect } from "next/navigation";

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  redirect(`/account/orders/${encodeURIComponent(id)}`);
}
