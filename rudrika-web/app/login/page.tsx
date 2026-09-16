"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next && next.startsWith("/") ? next : data.role !== "CUSTOMER" ? "/admin" : "/account");
      router.refresh();
    } else {
      setError(data.error);
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <h1 className="font-display text-4xl text-center mb-8">Welcome back</h1>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Email</label>
          <input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><label className="label">Password</label>
          <input type="password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        {error && <p className="text-sm text-clay">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Signing in" : "Sign in"}</button>
      </form>
      <p className="text-sm text-center mt-6 text-ink/60">
        New here?{" "}
        <Link href="/register" className="underline hover:text-clay">Create an account</Link>
      </p>
    </div>
  );
}
