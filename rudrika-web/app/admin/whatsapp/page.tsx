import Link from "next/link";
import { db } from "@/lib/db";
import { guardPage } from "@/lib/admin-guard";
import { resendWhatsApp } from "@/lib/rudrika-actions";
import { whatsappEnabled } from "@/lib/notify";
import { getRudrikaSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "WhatsApp" };

const EVENTS: [string, string][] = [["ORDER_CONFIRMED", "Order confirmed"], ["PACKED", "Packed"], ["SHIPPED", "Shipped"], ["DELIVERED", "Delivered"], ["FEEDBACK", "Feedback follow-up"], ["PHOTO_REWARD", "Photo reward"], ["RENEWAL", "Renewal reminder"], ["WELCOME", "Welcome"]];

export default async function WhatsAppPage({ searchParams }: { searchParams: { event?: string } }) {
  await guardPage("whatsapp");
  const s = await getRudrikaSettings();
  const ev = searchParams.event || "";
  const logs = await db.whatsAppLog.findMany({ where: ev ? { event: ev } : {}, orderBy: { createdAt: "desc" }, take: 200 });
  const sw: Record<string, string> = { ORDER_CONFIRMED: s.wa_order_confirmed, PACKED: s.wa_packed, SHIPPED: s.wa_shipped, DELIVERED: s.wa_delivered, FEEDBACK: s.wa_feedback, PHOTO_REWARD: s.wa_photo_reward, RENEWAL: s.wa_renewal, WELCOME: s.wa_welcome };
  return (
    <div>
      <h1 className="font-display text-3xl mb-1">WhatsApp messages</h1>
      <p className="text-sm text-ink/60 mb-4">Phase 2 automation on the WhatsApp Business Platform. Every message is logged here. {whatsappEnabled() ? "API keys are configured." : "API keys are not configured yet, so messages are logged as failed until the server .env has WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID."} Switch events on or off under <Link className="underline" href="/admin/settings">Settings</Link>.</p>
      <div className="flex flex-wrap gap-2 mb-6 text-xs">
        <a href="?" className={`px-3 py-1.5 border ${!ev ? "bg-clay text-cream border-clay" : "border-gold/40"}`}>All</a>
        {EVENTS.map(([k, l]) => <a key={k} href={`?event=${k}`} className={`px-3 py-1.5 border ${ev === k ? "bg-clay text-cream border-clay" : "border-gold/40"}`}>{l} {sw[k] === "0" ? "(off)" : ""}</a>)}
      </div>
      <div className="admin-card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-widest text-ink/50 border-b border-ink/10"><th className="p-3">When</th><th className="p-3">Event</th><th className="p-3">To</th><th className="p-3">Message</th><th className="p-3">Status</th><th className="p-3"></th></tr></thead>
          <tbody className="divide-y divide-ink/5">
            {logs.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-ink/50">No messages yet.</td></tr>}
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="p-3 text-xs text-ink/50 whitespace-nowrap">{new Date(l.createdAt).toLocaleString("en-IN")}</td>
                <td className="p-3">{l.event}</td><td className="p-3">{l.to}</td>
                <td className="p-3 max-w-md"><div className="line-clamp-2">{l.text}</div>{l.error && <div className="text-xs text-red-600 mt-1">{l.error}</div>}</td>
                <td className="p-3">{l.status}</td>
                <td className="p-3"><form action={resendWhatsApp}><input type="hidden" name="id" value={l.id} /><button className="text-xs underline">Send again</button></form></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
