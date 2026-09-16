/**
 * Case-insensitive product search, done in JS so it behaves the same on every
 * database. The catalogue is small enough that this costs nothing. Matches
 * the name, description, fabric, care text, category, product code and tags.
 */

type Searchable = {
  name: string;
  description?: string | null;
  fabric?: string | null;
  care?: string | null;
  tags?: string | null;
  productCode?: string | null;
  category?: { name: string } | null;
};

function normalise(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

export function searchProducts<T extends Searchable>(products: T[], query?: string): T[] {
  const terms = normalise(query ?? "").split(" ").filter(Boolean);
  if (terms.length === 0) return products;
  return products.filter((p) => {
    const haystack = normalise([p.name, p.description ?? "", p.fabric ?? "", p.care ?? "", p.tags ?? "", p.productCode ?? "", p.category?.name ?? ""].join(" "));
    return terms.every((t) => haystack.includes(t));
  });
}
