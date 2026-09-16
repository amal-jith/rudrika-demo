import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import AccountNav from "@/components/AccountNav";

export const metadata = { title: "My Account" };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-8">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-gold-dark mb-1">My Account</div>
          <h1 className="font-display text-3xl sm:text-4xl">Hello, {user.name.split(" ")[0]}</h1>
          <p className="text-sm text-ink/50 mt-1">{user.email}</p>
        </div>
        <LogoutButton />
      </div>

      <div className="grid md:grid-cols-[210px_1fr] gap-8">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
