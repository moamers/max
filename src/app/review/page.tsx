import { requireUser } from "@/lib/session";
import { listAttentionTransactions } from "@/lib/store";
import { ReviewQueue } from "./ReviewQueue";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const user = await requireUser();
  const rows = await listAttentionTransactions(user.id);
  return <ReviewQueue initialRows={rows} />;
}
