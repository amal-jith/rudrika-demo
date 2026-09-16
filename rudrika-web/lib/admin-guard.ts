import { redirect } from "next/navigation";
import { getUser } from "./auth";
import { can, isStaff, type Area } from "./permissions";

/**
 * Page-level guard for everything under /admin.
 *
 * Redirects rather than throwing, because landing on a blank error page when
 * you tapped the wrong bookmark is unhelpful. Not signed in at all goes to the
 * login screen; signed in but without the right role goes back to the
 * Dashboard, which every staff role can see.
 *
 * The matching server actions call requireCan() instead, which throws. That's
 * the difference that matters: a page is a view and can afford to be polite, a
 * write has to refuse outright.
 */
export async function guardPage(area: Area) {
  const user = await getUser();
  if (!user || user.active === false || !isStaff(user.role)) redirect("/login");
  if (!can(user.role, area)) redirect("/admin");
  return user;
}
