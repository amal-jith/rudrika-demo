import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { updateProfile, changePassword } from "@/lib/account-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profile" };

export default async function Profile() {
  const user = await getUser();
  // The layout redirects too, but in the App Router layouts and pages render
  // in parallel, so each page has to guard on its own or it throws first.
  if (!user) redirect("/login");

  return (
    <div className="space-y-6 max-w-lg">
      <form action={updateProfile} className="bg-white border border-gold/20 p-5 space-y-4">
        <h2 className="font-display text-xl">Your details</h2>
        <div>
          <label className="label">Full name</label>
          <input name="name" required className="input" defaultValue={user.name} />
        </div>
        <div>
          <label className="label">Phone number</label>
          <input name="phone" className="input" defaultValue={user.phone ?? ""} placeholder="+91" />
        </div>
        <div>
          <label className="label">Email (cannot be changed)</label>
          <input className="input bg-sand/60" value={user.email} disabled />
        </div>
        <button className="btn-primary">Save Details</button>
      </form>

      <form action={changePassword} className="bg-white border border-gold/20 p-5 space-y-4">
        <h2 className="font-display text-xl">Change password</h2>
        <div>
          <label className="label">Current password</label>
          <input name="current" type="password" required className="input" />
        </div>
        <div>
          <label className="label">New password (6+ characters)</label>
          <input name="next" type="password" required minLength={6} className="input" />
        </div>
        <button className="btn-outline">Update Password</button>
      </form>
    </div>
  );
}
