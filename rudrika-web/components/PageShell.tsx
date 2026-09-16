export default function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-14 animate-fade-up">
      <header className="text-center mb-10">
        <h1 className="font-display text-3xl sm:text-5xl">{title}</h1>
        <div className="gold-divider"><span className="gold-dot" /></div>
        {subtitle && <p className="text-ink/60 max-w-xl mx-auto text-sm leading-relaxed">{subtitle}</p>}
      </header>
      <div className="space-y-8">{children}</div>
    </div>
  );
}

export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-gold/20 p-5 sm:p-8">
      <h2 className="font-display text-xl sm:text-2xl mb-4">{title}</h2>
      <div className="text-sm text-ink/75 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}
