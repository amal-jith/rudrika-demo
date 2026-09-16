import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { saveAddress, deleteAddress, setDefaultAddress } from "@/lib/account-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Addresses" };

function Fields({ a }: { a?: any }) {
  return (
    <>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Label</label>
          <select name="label" defaultValue={a?.label ?? "Home"} className="input !py-2">
            <option>Home</option><option>Office</option><option>Other</option>
          </select>
        </div>
        <div>
          <label className="label">Full name</label>
          <input name="name" className="input !py-2" defaultValue={a?.name ?? ""} />
        </div>
      </div>
      <div>
        <label className="label">Address</label>
        <input name="line1" required className="input !py-2" defaultValue={a?.line1 ?? ""} placeholder="House / street" />
      </div>
      <input name="line2" className="input !py-2" defaultValue={a?.line2 ?? ""} placeholder="Landmark (optional)" />
      <div className="grid sm:grid-cols-3 gap-3">
        <input name="city" required className="input !py-2" defaultValue={a?.city ?? ""} placeholder="City" />
        <input name="state" required className="input !py-2" defaultValue={a?.state ?? ""} placeholder="State" />
        <input name="pincode" required pattern="[0-9]{6}" className="input !py-2" defaultValue={a?.pincode ?? ""} placeholder="PIN code" />
      </div>
      <input name="phone" required className="input !py-2" defaultValue={a?.phone ?? ""} placeholder="Phone number" />
    </>
  );
}

export default async function Addresses() {
  const user = await getUser();
  // The layout redirects too, but in the App Router layouts and pages render
  // in parallel, so each page has to guard on its own or it throws first.
  if (!user) redirect("/login");
  const addresses = await db.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }],
  });

  return (
    <div className="space-y-6">
      {addresses.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses.map((a) => (
            <div key={a.id} className={`bg-white border p-5 ${a.isDefault ? "border-gold" : "border-gold/20"}`}>
              <div className="flex justify-between items-start">
                <span className="text-[11px] uppercase tracking-widest text-gold-dark">{a.label}</span>
                {a.isDefault && <span className="text-[10px] bg-gold/15 text-gold-dark px-2 py-0.5">Default</span>}
              </div>
              <div className="text-sm mt-2 leading-relaxed">
                {a.name && <div className="font-medium">{a.name}</div>}
                {a.line1}{a.line2 ? `, ${a.line2}` : ""}
                <br />
                {a.city}, {a.state}, {a.pincode}
                <br />
                <span className="text-ink/55">{a.phone}</span>
              </div>

              <details className="mt-3">
                <summary className="text-xs underline cursor-pointer hover:text-clay">Edit</summary>
                <form action={saveAddress} className="space-y-3 mt-3">
                  <input type="hidden" name="id" value={a.id} />
                  <Fields a={a} />
                  <button className="btn-primary !py-2 !px-4 text-xs">Save changes</button>
                </form>
              </details>

              <div className="flex gap-4 mt-3 pt-3 border-t border-ink/5 text-xs">
                {!a.isDefault && (
                  <form action={setDefaultAddress}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="underline hover:text-clay">Set as default</button>
                  </form>
                )}
                <form action={deleteAddress} className="ml-auto">
                  <input type="hidden" name="id" value={a.id} />
                  <button className="underline text-red-600">Delete</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      <form action={saveAddress} className="bg-white border border-gold/20 p-5 space-y-3">
        <h2 className="font-display text-xl">Add a new address</h2>
        <Fields />
        <button className="btn-primary">Save Address</button>
      </form>
    </div>
  );
}
