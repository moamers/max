import { requireUser } from "@/lib/session";
import { ImportScreen } from "@/components/import/ImportScreen";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  await requireUser();
  return <ImportScreen />;
}
