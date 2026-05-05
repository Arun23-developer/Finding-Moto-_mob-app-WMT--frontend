import type { Order } from "./types";

export function getBuyerName(buyer?: Order["buyer"]): string {
  if (!buyer) return "Customer";
  if (typeof buyer === "string") return buyer;

  return (
    buyer.name ||
    `${buyer.firstName || ""} ${buyer.lastName || ""}`.trim() ||
    buyer.email ||
    "Customer"
  );
}