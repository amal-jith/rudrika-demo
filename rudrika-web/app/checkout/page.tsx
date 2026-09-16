import { getUser } from "@/lib/auth";
import CheckoutForm from "@/components/CheckoutForm";
import { getZones } from "@/lib/shipping";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const [user, zones] = await Promise.all([getUser(), getZones()]);
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="font-display text-2xl sm:text-4xl mb-6 sm:mb-10">Checkout</h1>
      <CheckoutForm
        user={user ? { name: user.name, email: user.email, phone: user.phone ?? "" } : null}
        zones={zones}
      />
    </div>
  );
}
