import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { SignupForm } from "./SignupForm";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const user = await getSessionUser();

  return (
    <main className="max-w-sm mx-auto px-6 py-16">
      <h1 className="text-2xl font-semibold mb-2">Create your Max account</h1>
      {/* R-20: say what happens to the data before it is handed over, not after. */}
      <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
        Your pay periods, spending and income are visible only to you. Nobody else
        using Max can see them.
      </p>

      {user ? (
        <p>
          You are already signed in as {user.email}.{" "}
          <Link href="/dashboard">Go to your dashboard</Link>.
        </p>
      ) : (
        <SignupForm />
      )}
    </main>
  );
}
