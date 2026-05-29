// Merch catalog — pricing in USD cents to match Stripe.
export type Variant = { id: string; label: string };
export type Product = {
  slug: string;
  name: string;
  blurb: string;
  category: "apparel" | "accessory" | "stationery" | "bundle";
  price: number; // cents
  // optional axes
  sizes?: Variant[];
  fits?: Variant[]; // men / women / kids
  colors?: Variant[];
  customizable?: boolean; // custom name/text (+ $8 and +1 week)
  bundleOf?: string[]; // slugs included
  badge?: string;
};

const APPAREL_SIZES: Variant[] = ["XS", "S", "M", "L", "XL", "XXL"].map((s) => ({ id: s, label: s }));
const KID_SIZES: Variant[] = ["4", "6", "8", "10", "12", "14"].map((s) => ({ id: s, label: s }));
const FITS: Variant[] = [
  { id: "mens", label: "Men" },
  { id: "womens", label: "Women" },
  { id: "boys", label: "Boys" },
  { id: "girls", label: "Girls" },
];
const COLORS: Variant[] = [
  { id: "obsidian", label: "Obsidian" },
  { id: "matrix", label: "Matrix Green" },
  { id: "gold", label: "Paladin Gold" },
  { id: "wizard", label: "Wizard Indigo" },
];

export const CUSTOMIZATION_FEE = 800; // $8
export const CUSTOMIZATION_DAYS = 7;
export const BUNDLE_DISCOUNT_THRESHOLD = 3;
export const BUNDLE_DISCOUNT_PCT = 10;
export const FREE_SHIPPING_THRESHOLD = 10000; // $100
export const STANDARD_SHIPPING = 799; // $7.99

export const PRODUCTS: Product[] = [
  {
    slug: "paladin-tee",
    name: "Paladin Tee",
    blurb: "Heavyweight 100% cotton. Holy-forge embroidered crest.",
    category: "apparel",
    price: 2999,
    sizes: APPAREL_SIZES,
    fits: FITS,
    colors: COLORS,
    customizable: true,
    badge: "Best seller",
  },
  {
    slug: "paladin-tee-kids",
    name: "Squire Tee (Kids)",
    blurb: "Soft ringspun cotton for young paladins-in-training.",
    category: "apparel",
    price: 2499,
    sizes: KID_SIZES,
    fits: [
      { id: "boys", label: "Boys" },
      { id: "girls", label: "Girls" },
    ],
    colors: COLORS,
    customizable: true,
  },
  {
    slug: "paladin-hoodie",
    name: "Holy Forge Hoodie",
    blurb: "Heavy fleece, kangaroo pocket, gold-foil chest sigil.",
    category: "apparel",
    price: 5999,
    sizes: APPAREL_SIZES,
    fits: FITS,
    colors: COLORS,
    customizable: true,
  },
  {
    slug: "paladin-cap",
    name: "Paladin Snapback",
    blurb: "Structured 6-panel snapback. Embroidered Paladin crest.",
    category: "apparel",
    price: 2799,
    colors: COLORS,
    customizable: true,
  },
  {
    slug: "paladin-shades",
    name: "Arcane Shades",
    blurb: "Polarized aviators in matrix-green or gold mirror finish.",
    category: "accessory",
    price: 3499,
    colors: [
      { id: "matrix", label: "Matrix Mirror" },
      { id: "gold", label: "Gold Mirror" },
      { id: "obsidian", label: "Obsidian Black" },
    ],
  },
  {
    slug: "paladin-scarf",
    name: "Knight's Scarf",
    blurb: "Merino knit scarf in house colors.",
    category: "accessory",
    price: 2999,
    colors: COLORS,
  },
  {
    slug: "paladin-socks",
    name: "Crit Socks (3-pack)",
    blurb: "Combed-cotton crew socks with the Paladin sigil.",
    category: "accessory",
    price: 1899,
    sizes: [
      { id: "S", label: "S" },
      { id: "M", label: "M" },
      { id: "L", label: "L" },
    ],
  },
  {
    slug: "paladin-bottle",
    name: "Mana Flask Water Bottle",
    blurb: "24oz stainless, double-wall vacuum, etched crest.",
    category: "accessory",
    price: 2599,
    colors: COLORS,
    customizable: true,
  },
  {
    slug: "paladin-pen",
    name: "Quill of Reckoning Pen",
    blurb: "Brass-weighted rollerball pen. Black ink refill.",
    category: "stationery",
    price: 1499,
  },
  {
    slug: "paladin-pencils",
    name: "Scribe Pencils (6-pack)",
    blurb: "Cedar No. 2 with foil-stamped Paladin proverbs.",
    category: "stationery",
    price: 999,
  },
  {
    slug: "paladin-stickers",
    name: "Sticker Pack",
    blurb: "10 vinyl die-cut stickers — sigils, suits, and slogans.",
    category: "stationery",
    price: 799,
  },
  {
    slug: "starter-bundle",
    name: "Squire Starter Bundle",
    blurb: "Tee + cap + sticker pack. Save instantly.",
    category: "bundle",
    price: 5599,
    bundleOf: ["paladin-tee", "paladin-cap", "paladin-stickers"],
    badge: "Save $9",
  },
  {
    slug: "knight-bundle",
    name: "Knight's Full Kit",
    blurb: "Hoodie + tee + cap + shades + bottle + sticker pack.",
    category: "bundle",
    price: 14999,
    bundleOf: ["paladin-hoodie", "paladin-tee", "paladin-cap", "paladin-shades", "paladin-bottle", "paladin-stickers"],
    badge: "Save $25",
  },
];

export const productBySlug = (slug: string) => PRODUCTS.find((p) => p.slug === slug);
