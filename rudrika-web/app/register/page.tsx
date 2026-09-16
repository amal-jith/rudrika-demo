"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", whatsappOptIn: true });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      router.push("/account");
      router.refresh();
    } else {
      setError(data.error);
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <h1 className="font-display text-4xl text-center mb-8">Create account</h1>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Full name</label>
          <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><label className="label">Email</label>
          <input type="email" required className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">Phone (for order updates)</label><input required className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} pattern="[0-9+ -]{10,}" placeholder="+91" /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.whatsappOptIn} onChange={(e) => setForm({ ...form, whatsappOptIn: e.target.checked })} /> Send order updates and offers on WhatsApp</label>
        <div><label className="label">Password (6+ characters)</label>
          <input type="password" required minLength={6} className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
        {error && <p className="text-sm text-clay">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Creating account" : "Create account"}</button>
      </form>
      <p className="text-sm text-center mt-6 text-ink/60">
        Already have an account?{" "}
        <Link href="/login" className="underline hover:text-clay">Sign in</Link>
      </p>
    </div>
  );
}
