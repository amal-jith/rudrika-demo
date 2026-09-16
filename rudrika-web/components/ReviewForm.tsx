"use client";

import { useState } from "react";
import { StarIcon } from "@/components/Icons";
import { useRouter } from "next/navigation";

export default function ReviewForm({ productId }: { productId: string }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("busy");
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, rating, title, body }),
    });
    if (res.ok) {
      setState("done");
      router.refresh();
    } else setState("error");
  };

  if (state === "done")
    return <p className="text-sm text-clay">Thank you! Your review will appear after moderation.</p>;

  return (
    <form onSubmit={submit} className="space-y-4 max-w-md">
      <div className="font-display text-xl">Write a review</div>
      <div>
        <div className="label">Rating</div>
        <div className="flex gap-1 text-2xl">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setRating(n)}
              className={n <= rating ? "text-gold" : "text-ink/20"}
            >
              <StarIcon className="w-6 h-6" />
            </button>
          ))}
        </div>
      </div>
      <input className="input" placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea
        className="input"
        rows={4}
        required
        placeholder="Share your thoughts"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <button className="btn-primary" disabled={state === "busy"}>
        {state === "busy" ? "Submitting" : "Submit review"}
      </button>
      {state === "error" && <p className="text-sm text-clay">Something went wrong. Try again.</p>}
    </form>
  );
}
