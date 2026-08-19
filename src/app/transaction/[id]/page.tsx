import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getTransactionDetail } from "./data";
import { TransactionView } from "./TransactionView";

export default async function TransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) notFound();

  const detail = await getTransactionDetail(user.id, id);
  if (!detail) notFound();

  return <TransactionView detail={detail} />;
}
