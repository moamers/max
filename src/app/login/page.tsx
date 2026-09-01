import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { Wordmark } from "@/components/brand/Counterbalance";
import { LoginForm } from "./LoginForm";
import { SignOutButton } from "./SignOutButton";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getSessionUser();

  return (
    <main className="max-w-sm mx-auto px-6 py-16">
      {/* The kit: "Use the full lockup when the name must be introduced." */}
      <div className="mb-8">
        <Wordmark size={34} idSuffix="login" />
      </div>
      <h1 className="font-semibold mb-6" style={{ fontSize: "var(--type-heading)" }}>Sign in</h1>

      {user ? (
        <div className="flex flex-col gap-4">
          {/* R-9: what Ravel knows about who you are is stated plainly, not hidden. */}
          <p style={{ color: "var(--text-secondary)" }}>
            You are signed in as {user.email}.
          </p>
          <p>
            <Link href="/">Go to your money</Link>
          </p>
          <SignOutButton />
        </div>
      ) : (
        <LoginForm />
      )}
    </main>
  );
}
