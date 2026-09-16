import { db } from "@/lib/db";
import { formatINR } from "@/lib/utils";
import { saveShippingZone, deleteShippingZone } from "@/lib/admin-actions";
import { guardPage } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Shipping" };

/** Zones are matched top to bottom; the first one containing the customer's state wins. */
export default async function AdminShipping() {
  await guardPage("shipping");
  let zones: Awaited<ReturnType<typeof db.shippingZone.findMany>> = [];
  let migrated = true;
  try {
    zones = await db.shippingZone.findMany({ orderBy: { sort: "asc" } });
  } catch {
    migrated = false;
  }

  if (!migrated)
    return (
      <div>
        <h1 className="font-display text-3xl mb-4">Shipping</h1>
        <div className="admin-card">
          <p className="text-sm text-ink/70">
            The shipping table hasn&apos;t been created yet. Run the v11 migration on the server,
            then reload this page. Until then the site charges the original flat rate.
          </p>
        </div>
      </div>
    );

  const states = (json: string) => {
    try {
      const a = JSON.parse(json);
      return Array.isArray(a) ? a.join(", ") : "";
    } catch {
      return "";
    }
  };

  return (
    <div>
      <h1 className="font-display text-3xl mb-2">Shipping</h1>
      <p className="text-sm text-ink/55 mb-6 max-w-2xl">
        Zones are checked from the top down. The first zone that lists the customer&apos;s delivery
        state sets the charge. If none match, the zone marked <strong>Fallback</strong> is used, so
        always keep one fallback zone with no states listed.
      </p>

      <div className="space-y-4 mb-8">
        {zones.map((z) => (
          <form key={z.id} action={saveShippingZone} className="admin-card">
            <input type="hidden" name="id" value={z.id} />
            <div className="grid sm:grid-cols-[1fr_90px_120px_120px] gap-3 items-end">
              <div>
                <label className="label">Zone name</label>
                <input name="name" required className="input !py-2" defaultValue={z.name} />
              </div>
              <div>
                <label className="label">Order</label>
                <input name="sort" type="number" className="input !py-2" defaultValue={z.sort} />
              </div>
              <div>
                <label className="label">Charge (Rs.)</label>
                <input name="rate" type="number" step="0.01" min="0" className="input !py-2"
                  defaultValue={z.rate / 100} />
              </div>
              <div>
                <label className="label">Free above (Rs.)</label>
                <input name="freeAbove" type="number" step="0.01" min="0" className="input !py-2"
                  defaultValue={z.freeAbove != null ? z.freeAbove / 100 : ""} placeholder="never" />
              </div>
            </div>

            <div className="mt-3">
              <label className="label">States in this zone (comma separated)</label>
              <input name="states" className="input !py-2" defaultValue={states(z.states)}
                placeholder="Kerala, Tamil Nadu, Karnataka" />
              <p className="text-xs text-ink/40 mt-1">
                Leave blank on the fallback zone. Spelling and capitalisation don&apos;t matter.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-5 mt-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="enabled" defaultChecked={z.enabled} /> Active
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="isDefault" defaultChecked={z.isDefault} /> Fallback zone
              </label>
              <span className="text-xs text-ink/45">
                Currently: {z.rate === 0 ? "Free" : formatINR(z.rate)}
                {z.freeAbove != null && `, free above ${formatINR(z.freeAbove)}`}
              </span>
              <button className="btn-primary !py-2 !px-5 ml-auto">Save</button>
              <button
                formAction={deleteShippingZone}
                className="text-xs text-red-600 underline"
              >
                Delete
              </button>
            </div>
          </form>
        ))}
      </div>

      <form action={saveShippingZone} className="admin-card border-dashed">
        <div className="font-display text-xl mb-4">Add a zone</div>
        <div className="grid sm:grid-cols-[1fr_90px_120px_120px] gap-3 items-end">
          <div>
            <label className="label">Zone name</label>
            <input name="name" required className="input !py-2" placeholder="South India" />
          </div>
          <div>
            <label className="label">Order</label>
            <input name="sort" type="number" className="input !py-2" defaultValue={zones.length} />
          </div>
          <div>
            <label className="label">Charge (Rs.)</label>
            <input name="rate" type="number" step="0.01" min="0" className="input !py-2" defaultValue="99" />
          </div>
          <div>
            <label className="label">Free above (Rs.)</label>
            <input name="freeAbove" type="number" step="0.01" min="0" className="input !py-2" placeholder="3000" />
          </div>
        </div>
        <div className="mt-3">
          <label className="label">States (comma separated)</label>
          <input name="states" className="input !py-2" placeholder="Tamil Nadu, Karnataka, Telangana" />
        </div>
        <div className="flex items-center gap-5 mt-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="enabled" defaultChecked /> Active
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isDefault" /> Fallback zone
          </label>
          <button className="btn-primary !py-2 !px-5 ml-auto">Add zone</button>
        </div>
      </form>
    </div>
  );
}
