"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      username: formData.get("username"),
      password: formData.get("password"),
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid username or password.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-brand-dark mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-dark">BOC Sports Society</h1>
          <p className="text-text-grey mt-1">Player Ranking System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-8">
          <h2 className="text-lg font-semibold text-text-dark mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1.5" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                className="w-full px-4 py-2.5 rounded-xl border border-purple-200 bg-brand-bg text-text-dark placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-sm"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-dark mb-1.5" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full px-4 py-2.5 rounded-xl border border-purple-200 bg-brand-bg text-text-dark placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-sm"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <p className="text-sm text-brand-pink bg-pink-50 border border-pink-200 rounded-xl px-4 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-sm mt-2"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-text-grey mt-6">
          Bank of Ceylon Sports Society · Authorized access only
        </p>
      </div>
    </div>
  );
}
