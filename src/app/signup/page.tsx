import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { Wordmark } from "@/components/brand/Counterbalance";
import { SignupForm } from "./SignupForm";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const user = await getSessionUser();

  return (
    <main className="max-w-sm mx-auto px-6 py-16">
      <div className="mb-8">
        <Wordmark size={34} idSuffix="signup" />
      </div>
      <h1 className="text-2xl font-semibold mb-2">Create your account</h1>
      {/* R-20: say what happens to the data before it is handed over, not after. */}
      <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
        Your pay periods, spending and income are visible only to you. Nobody else
        using Ravel can see them.
      </p>

      {user ? (
        <p>
          You are already signed in as {user.email}.{" "}
          <Link href="/">Go to your money</Link>.
        </p>
      ) : (
        <SignupForm />
      )}
    </main>
  );
}
