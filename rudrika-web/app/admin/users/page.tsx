import { db } from "@/lib/db";
import { saveStaff, setStaffActive } from "@/lib/admin-actions";
import { guardPage } from "@/lib/admin-guard";
import { STAFF_ROLES, ROLE_LABELS, ROLE_HELP, type StaffRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function AdminStaff() {
  const me = await guardPage("staff");

  const staff = await db.user.findMany({
    where: { role: { in: [...STAFF_ROLES] } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });

  const activeOwners = staff.filter((s) => s.role === "ADMIN" && s.active).length;

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl mb-2">Staff</h1>
      <p className="text-sm text-ink/60 mb-6">
        Everyone who helps run the shop gets their own login here, so nobody has to share yours. If
        someone leaves, switch them off, their name stays on the orders they handled.
      </p>

      {/* What each role can actually do, in plain words, so the choice below
          isn't a guess. */}
      <div className="admin-card mb-8">
        <div className="label !mb-2">The three levels</div>
        <dl className="space-y-2 text-sm">
          {STAFF_ROLES.map((r) => (
            <div key={r}>
              <dt className="font-medium">{ROLE_LABELS[r]}</dt>
              <dd className="text-ink/60 text-xs mt-0.5">{ROLE_HELP[r]}</dd>
            </div>
          ))}
        </dl>
      </div>

      <h2 className="font-display text-xl mb-3">Add someone</h2>
      <form action={saveStaff} className="admin-card mb-10 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Their name</label>
            <input name="name" required className="input" placeholder="Anjali" />
          </div>
          <div>
            <label className="label">Their email</label>
            <input name="email" type="email" required className="input" placeholder="anjali@example.com" />
          </div>
          <div>
            <label className="label">Starting password</label>
            <input name="password" required minLength={8} className="input" placeholder="At least 8 characters" />
            <p className="text-xs text-ink/40 mt-1.5">
              Give it to them directly, not over WhatsApp. They can change it later under their account.
            </p>
          </div>
          <div>
            <label className="label">What they can do</label>
            <select name="role" defaultValue="STAFF" className="input">
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button className="btn-primary !py-2 !px-5 text-sm">Create login</button>
      </form>

      <h2 className="font-display text-xl mb-3">
        People with access <span className="text-ink/40 text-base">({staff.length})</span>
      </h2>

      <div className="space-y-3">
        {staff.map((s) => {
          const isMe = s.id === me.id;
          // The last owner standing can't be demoted or switched off, or there'd
          // be no way back into the panel at all.
          const lastOwner = s.role === "ADMIN" && s.active && activeOwners === 1;

          return (
            <div key={s.id} className={`admin-card ${s.active ? "" : "opacity-60"}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="font-medium">
                    {s.name}
                    {isMe && <span className="text-xs text-ink/40 font-normal">, you</span>}
                    {!s.active && (
                      <span className="text-xs bg-ink/10 px-2 py-0.5 ml-2 font-normal">Switched off</span>
                    )}
                  </div>
                  <div className="text-xs text-ink/50 mt-0.5">
                    {s.email}, joined {new Date(s.createdAt).toLocaleDateString("en-IN")}
                  </div>
                </div>

                {!isMe && !lastOwner && (
                  <form action={setStaffActive}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="active" value={s.active ? "0" : "1"} />
                    <button className="btn-outline !py-1.5 !px-3 text-xs whitespace-nowrap">
                      {s.active ? "Switch off" : "Switch back on"}
                    </button>
                  </form>
                )}
              </div>

              <form action={saveStaff} className="mt-4 pt-4 border-t border-ink/10 grid sm:grid-cols-2 gap-3">
                <input type="hidden" name="id" value={s.id} />
                <div>
                  <label className="label">Name</label>
                  <input name="name" defaultValue={s.name} className="input" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input name="email" type="email" defaultValue={s.email} className="input" />
                </div>
                <div>
                  <label className="label">What they can do</label>
                  <select
                    name="role"
                    defaultValue={s.role}
                    disabled={isMe || lastOwner}
                    className="input disabled:opacity-50"
                  >
                    {STAFF_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                  {isMe && (
                    <p className="text-xs text-ink/40 mt-1.5">
                      You can&apos;t change your own level, that&apos;s how people lock themselves out.
                    </p>
                  )}
                  {lastOwner && !isMe && (
                    <p className="text-xs text-ink/40 mt-1.5">
                      The only Owner left. Make someone else an Owner first.
                    </p>
                  )}
                </div>
                <div>
                  <label className="label">New password</label>
                  <input name="password" className="input" placeholder="Leave blank to keep theirs" />
                </div>
                <div className="sm:col-span-2">
                  <button className="btn-primary !py-2 !px-5 text-sm">Save changes</button>
                </div>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
