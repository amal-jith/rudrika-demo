import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-6 py-32 text-center">
      <h1 className="font-display text-5xl mb-4">Page not found</h1>
      <p className="text-ink/50 mb-8">The page you're looking for doesn't exist or has moved.</p>
      <Link href="/" className="btn-primary">Back to Home</Link>
    </div>
  );
}
