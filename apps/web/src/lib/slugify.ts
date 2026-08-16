export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getMerchantShopUrl(merchant?: { _id?: string; slug?: string; businessName?: string }): string {
  if (!merchant) return window.location.origin;
  const identifier = merchant.slug || (merchant.businessName ? slugify(merchant.businessName) : merchant._id);
  return `${window.location.origin}/shop/${identifier}`;
}

export function getMerchantShopPath(merchant?: { _id?: string; slug?: string; businessName?: string }): string {
  if (!merchant) return "/shop";
  const identifier = merchant.slug || (merchant.businessName ? slugify(merchant.businessName) : merchant._id);
  return `/shop/${identifier}`;
}
