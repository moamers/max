import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { LoginForm } from "./LoginForm";
import { SignOutButton } from "./SignOutButton";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getSessionUser();

  return (
    <main className="max-w-sm mx-auto px-6 py-16">
      <h1 className="text-2xl font-semibold mb-6">Sign in to Max</h1>

      {user ? (
        <div className="flex flex-col gap-4">
          {/* R-9: what Max knows about who you are is stated plainly, not hidden. */}
          <p style={{ color: "var(--text-secondary)" }}>
            You are signed in as {user.email}.
          </p>
          <p>
            <Link href="/dashboard">Go to your dashboard</Link>
          </p>
          <SignOutButton />
        </div>
      ) : (
        <LoginForm />
      )}
    </main>
  );
}
