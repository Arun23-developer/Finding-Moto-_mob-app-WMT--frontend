export const PRODUCT_CATEGORIES = [
  "Air & Fuel Systems",
  "Body & Accessories",
  "Cooling Systems",
  "Electrical & Electronics",
  "Engine Parts",
  "Exhaust Systems",
  "Lighting & Signals",
  "Suspension & Brakes",
  "Tires & Wheels",
  "Transmission & Clutch",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
